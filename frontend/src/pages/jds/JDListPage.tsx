import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { getJDs, createJD } from '@/api/jds';
import type { JD, JDCreate } from '@/types';
import { apiError } from '@/lib/apiError';
import { DataTable, type ColumnDef } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, RefreshCw, PlusCircle, Eye } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const PAGE_LIMIT = 20;

const JD_STATUSES = ['all', 'received', 'in_review', 'sourcing', 'shortlist_ready', 'closed'];

const createSchema = z.object({
  client_id: z.string().min(1, 'Required'),
  title: z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
  timezone: z.string().optional(),
  budget_min: z.string().optional(),
  budget_max: z.string().optional(),
  contract_duration: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;

export default function JDListPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine base path (/admin or /recruiter)
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/recruiter';

  const [jds, setJDs] = useState<JD[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateForm>({ resolver: zodResolver(createSchema) });

  const fetchJDs = useCallback(async (reset = false) => {
    setIsLoading(true);
    setError(null);
    const currentSkip = reset ? 0 : skip;
    try {
      const params: Record<string, unknown> = { skip: currentSkip, limit: PAGE_LIMIT };
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await getJDs(params);
      if (reset) {
        setJDs(data);
        setSkip(data.length);
      } else {
        setJDs((prev) => [...prev, ...data]);
        setSkip(currentSkip + data.length);
      }
      setHasMore(data.length === PAGE_LIMIT);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, skip]);

  // Reset + refetch when filter changes
  useEffect(() => {
    setSkip(0);
    setJDs([]);
    fetchJDs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const onCreateSubmit = async (data: CreateForm) => {
    setIsSubmitting(true);
    try {
      const payload: JDCreate = {
        client_id: parseInt(data.client_id, 10),
        title: data.title,
        description: data.description,
        timezone: data.timezone || undefined,
        budget_min: data.budget_min ? parseFloat(data.budget_min) : undefined,
        budget_max: data.budget_max ? parseFloat(data.budget_max) : undefined,
        contract_duration: data.contract_duration || undefined,
      };
      await createJD(payload);
      toast({ title: 'Job description created.' });
      setSheetOpen(false);
      form.reset();
      setSkip(0);
      setJDs([]);
      fetchJDs(true);
    } catch {
      toast({ title: 'Failed to create job description.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<JD>[] = [
    { header: 'Title', accessor: 'title' },
    { header: 'Client ID', accessor: 'client_name' },
    {
      header: 'Status',
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Created At',
      accessor: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`${basePath}/jds/${row.id}`)}
        >
          <Eye className="w-3.5 h-3.5 mr-1" />View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Job Descriptions"
        action={
          <Button onClick={() => { form.reset(); setSheetOpen(true); }}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Create JD
          </Button>
        }
      />

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-4">
        <TabsList className="bg-muted/50 flex-wrap h-auto gap-1">
          {JD_STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-md bg-destructive/10 text-destructive mb-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm flex-1">{error}</span>
          <Button size="sm" variant="outline" onClick={() => fetchJDs(true)}>
            <RefreshCw className="w-4 h-4 mr-1" />Retry
          </Button>
        </div>
      )}

      <DataTable<JD>
        columns={columns}
        data={jds}
        isLoading={isLoading && jds.length === 0}
        emptyMessage="No job descriptions yet."
      />

      {hasMore && !isLoading && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => fetchJDs(false)}>Load More</Button>
        </div>
      )}

      {/* ─── Create JD Sheet ─── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="bg-card border-border w-[480px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Create Job Description</SheetTitle>
          </SheetHeader>
          <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="jd-client">Client ID *</Label>
              <Input id="jd-client" type="number" {...form.register('client_id')} />
              {form.formState.errors.client_id && (
                <p className="text-xs text-destructive">{form.formState.errors.client_id.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jd-title">Title *</Label>
              <Input id="jd-title" {...form.register('title')} />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jd-desc">Description *</Label>
              <Textarea id="jd-desc" rows={5} {...form.register('description')} />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jd-tz">Timezone</Label>
              <Input id="jd-tz" placeholder="e.g. UTC+5:30" {...form.register('timezone')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="jd-bmin">Budget Min</Label>
                <Input id="jd-bmin" type="number" {...form.register('budget_min')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jd-bmax">Budget Max</Label>
                <Input id="jd-bmax" type="number" {...form.register('budget_max')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jd-dur">Contract Duration</Label>
              <Input id="jd-dur" placeholder="e.g. 6 months" {...form.register('contract_duration')} />
            </div>
            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Job Description'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
