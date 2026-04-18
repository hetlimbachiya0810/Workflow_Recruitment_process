import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { getJDById, updateJD, updateJDStatus, floatJD, getJDAssignments } from '@/api/jds';
import type { JD, JDUpdate, JDVendorAssignment } from '@/types';
import { apiError } from '@/lib/apiError';
import { StatusBadge } from '@/components/StatusBadge';
import { DataTable, type ColumnDef } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  RefreshCw,
  Edit,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const JD_STATUSES = ['received', 'in_review', 'sourcing', 'shortlist_ready', 'closed'];

const editSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  timezone: z.string().optional(),
  budget_min: z.string().optional(),
  budget_max: z.string().optional(),
  contract_duration: z.string().optional(),
});

type EditForm = z.infer<typeof editSchema>;

export default function JDDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/recruiter';

  const [jd, setJD] = useState<JD | null>(null);
  const [assignments, setAssignments] = useState<JDVendorAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  // Float form
  const [vendorIds, setVendorIds] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isFloating, setIsFloating] = useState(false);

  const form = useForm<EditForm>({ resolver: zodResolver(editSchema) });

  const fetchJD = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getJDById(id);
      setJD(data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchAssignments = useCallback(async () => {
    if (!id) return;
    setAssignmentsLoading(true);
    try {
      const data = await getJDAssignments(id);
      setAssignments(data);
    } catch {
      // silently fail for assignments
    } finally {
      setAssignmentsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJD();
    fetchAssignments();
  }, [fetchJD, fetchAssignments]);

  const openEdit = () => {
    if (!jd) return;
    form.reset({
      title: jd.title,
      description: jd.description,
      timezone: (jd as any).timezone ?? '',
      budget_min: (jd as any).budget_min != null ? String((jd as any).budget_min) : '',
      budget_max: (jd as any).budget_max != null ? String((jd as any).budget_max) : '',
      contract_duration: (jd as any).contract_duration ?? '',
    });
    setEditSheetOpen(true);
  };

  const onEditSubmit = async (data: EditForm) => {
    if (!id) return;
    setIsEditSubmitting(true);
    try {
      const payload: JDUpdate = {};
      if (data.title) payload.title = data.title;
      if (data.description) payload.description = data.description;
      if (data.timezone) payload.timezone = data.timezone;
      if (data.budget_min) payload.budget_min = parseFloat(data.budget_min);
      if (data.budget_max) payload.budget_max = parseFloat(data.budget_max);
      if (data.contract_duration) payload.contract_duration = data.contract_duration;
      await updateJD(id, payload);
      toast({ title: 'Job description updated.' });
      setEditSheetOpen(false);
      fetchJD();
    } catch {
      toast({ title: 'Failed to update job description.', variant: 'destructive' });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!id) return;
    setIsStatusUpdating(true);
    try {
      const updated = await updateJDStatus(id, status);
      setJD(updated);
      toast({ title: `Status updated to "${status.replace(/_/g, ' ')}".` });
    } catch {
      toast({ title: 'Failed to update status.', variant: 'destructive' });
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handleFloat = async () => {
    if (!id || !vendorIds.trim()) {
      toast({ title: 'Please enter at least one vendor ID.', variant: 'destructive' });
      return;
    }
    const ids = vendorIds
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));

    if (ids.length === 0) {
      toast({ title: 'Invalid vendor IDs.', variant: 'destructive' });
      return;
    }

    setIsFloating(true);
    try {
      await floatJD(id, { vendor_ids: ids, deadline: deadline || undefined });
      toast({ title: 'JD floated to vendors successfully.' });
      setVendorIds('');
      setDeadline('');
      fetchAssignments();
    } catch {
      toast({ title: 'Failed to float JD.', variant: 'destructive' });
    } finally {
      setIsFloating(false);
    }
  };

  const assignmentColumns: ColumnDef<JDVendorAssignment>[] = [
    { header: 'Vendor ID', accessor: 'vendor_id' },
    { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Acknowledged',
      accessor: (row) =>
        row.vendor_acknowledged ? (
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        ) : (
          <XCircle className="w-4 h-4 text-muted-foreground" />
        ),
    },
    {
      header: 'Floated At',
      accessor: (row) => new Date(row.floated_at).toLocaleDateString(),
    },
    {
      header: 'Deadline',
      accessor: (row) => (row.deadline ? new Date(row.deadline).toLocaleDateString() : '—'),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-3 gap-6 mt-6">
          <div className="col-span-2 space-y-4">
            <Skeleton className="h-40" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !jd) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-md bg-destructive/10 text-destructive">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm flex-1">{error ?? 'Job description not found.'}</span>
        <Button size="sm" variant="outline" onClick={fetchJD}>
          <RefreshCw className="w-4 h-4 mr-1" />Retry
        </Button>
      </div>
    );
  }

  const jdAny = jd as any;

  return (
    <div>
      {/* Page Title */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{jd.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {basePath === '/admin' ? 'Admin' : 'Recruiter'} › Job Descriptions › {jd.id}
          </p>
        </div>
        <Button variant="outline" onClick={openEdit}>
          <Edit className="w-4 h-4 mr-2" />Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Left column: JD info ─── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <StatusBadge status={jd.status} />
              <span className="text-xs text-muted-foreground">Status</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow label="Client ID" value={jd.client_name || jdAny.client_id} />
              <InfoRow label="Created By" value={jd.created_by} />
              <InfoRow label="Created At" value={new Date(jd.created_at).toLocaleString()} />
              {jdAny.timezone && <InfoRow label="Timezone" value={jdAny.timezone} />}
              {(jdAny.budget_min || jdAny.budget_max) && (
                <InfoRow
                  label="Budget Range"
                  value={`${jdAny.budget_min ?? '—'} – ${jdAny.budget_max ?? '—'}`}
                />
              )}
              {jdAny.contract_duration && (
                <InfoRow label="Contract Duration" value={jdAny.contract_duration} />
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Description</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{jd.description}</p>
            </div>
          </div>
        </div>

        {/* ─── Right column: Actions ─── */}
        <div className="space-y-4">
          {/* Status Update */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold">Update Status</h3>
            <Select value={jd.status} onValueChange={handleStatusChange} disabled={isStatusUpdating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isStatusUpdating && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />Updating…
              </p>
            )}
          </div>

          {/* Float to Vendors */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold">Float to Vendors</h3>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-ids" className="text-xs">
                Vendor IDs <span className="text-muted-foreground">(comma-separated)</span>
              </Label>
              <Input
                id="vendor-ids"
                placeholder="e.g. 1, 2, 5"
                value={vendorIds}
                onChange={(e) => setVendorIds(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="float-deadline" className="text-xs">Deadline (optional)</Label>
              <Input
                id="float-deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleFloat} disabled={isFloating}>
              {isFloating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Floating…</> : 'Float JD'}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Vendor Assignments ─── */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Vendor Assignments</h2>
        <DataTable<JDVendorAssignment>
          columns={assignmentColumns}
          data={assignments}
          isLoading={assignmentsLoading}
          emptyMessage="No vendors assigned yet. Float this JD to get started."
        />
      </div>

      {/* ─── Edit Sheet ─── */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent className="bg-card border-border w-[480px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Edit Job Description</SheetTitle>
          </SheetHeader>
          <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="e-title">Title</Label>
              <Input id="e-title" {...form.register('title')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-desc">Description</Label>
              <Textarea id="e-desc" rows={5} {...form.register('description')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-tz">Timezone</Label>
              <Input id="e-tz" {...form.register('timezone')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="e-bmin">Budget Min</Label>
                <Input id="e-bmin" type="number" {...form.register('budget_min')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-bmax">Budget Max</Label>
                <Input id="e-bmax" type="number" {...form.register('budget_max')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-dur">Contract Duration</Label>
              <Input id="e-dur" {...form.register('contract_duration')} />
            </div>
            <Button type="submit" className="w-full mt-2" disabled={isEditSubmitting}>
              {isEditSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="font-medium">{value ?? '—'}</p>
    </div>
  );
}
