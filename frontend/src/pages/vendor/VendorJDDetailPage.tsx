import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getJDById, getJDAssignments, acknowledgeJD } from '@/api/jds';
import { useAuthStore } from '@/store/authStore';
import type { JD, JDVendorAssignment } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { CVSubmissionSheet } from './CVSubmissionSheet';
import {
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Loader2,
  Clock,
  Send,
} from 'lucide-react';
import { apiError } from '@/lib/apiError';

export default function VendorJDDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [jd, setJD] = useState<JD | null>(null);
  const [assignment, setAssignment] = useState<JDVendorAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [cvSheetOpen, setCvSheetOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [jdData, assignments] = await Promise.all([
        getJDById(id),
        getJDAssignments(id),
      ]);
      setJD(jdData);
      // Find the assignment belonging to this vendor by matching user_id
      const myAssignment = assignments.find(
        (a) => a.vendor_id === user?.id || (a as any).vendor?.user_id === user?.id
      ) ?? assignments[0] ?? null;
      setAssignment(myAssignment);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAcknowledge = async () => {
    if (!id) return;
    setIsAcknowledging(true);
    try {
      const updated = await acknowledgeJD(id);
      setAssignment(updated);
      toast({ title: 'Assignment acknowledged.' });
    } catch (err) {
      toast({ title: apiError(err), variant: 'destructive' });
    } finally {
      setIsAcknowledging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-3 gap-6 mt-6">
          <div className="col-span-2"><Skeleton className="h-48" /></div>
          <div><Skeleton className="h-48" /></div>
        </div>
      </div>
    );
  }

  if (error || !jd) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-md bg-destructive/10 text-destructive">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm flex-1">{error ?? 'Job description not found.'}</span>
        <Button size="sm" variant="outline" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-1" />Retry
        </Button>
      </div>
    );
  }

  const jdAny = jd as any;
  const isActive = assignment?.status === 'active' || assignment?.status === 'sourcing';

  return (
    <div>
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{jd.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">Vendor Portal › My Assignments › {jd.id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Left: JD Info ─── */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-lg p-6 space-y-5">
            <div className="flex items-center gap-3">
              <StatusBadge status={jd.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
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

        {/* ─── Right: Assignment Panel ─── */}
        <div className="space-y-4">
          {/* Assignment Details */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold">Assignment Details</h3>

            {assignment ? (
              <>
                <div className="space-y-3 text-sm">
                  <InfoRow
                    label="Assigned On"
                    value={new Date(assignment.floated_at).toLocaleDateString()}
                  />
                  <InfoRow
                    label="Deadline"
                    value={assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'None'}
                  />
                  <InfoRow
                    label="Assignment Status"
                    value={<StatusBadge status={assignment.status} />}
                  />
                </div>

                {/* Acknowledge */}
                <div className="pt-2 border-t border-border">
                  {assignment.vendor_acknowledged ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Acknowledged
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={handleAcknowledge}
                      disabled={isAcknowledging}
                    >
                      {isAcknowledging ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Acknowledging…</>
                      ) : (
                        <><Clock className="w-4 h-4 mr-2" />Acknowledge Assignment</>
                      )}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No assignment record found.</p>
            )}
          </div>

          {/* Submit CV */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold">Submit a CV</h3>
            <p className="text-xs text-muted-foreground">
              Submit a candidate's CV for this job description.
            </p>
            <Button
              className="w-full"
              variant={isActive ? 'default' : 'outline'}
              disabled={!isActive}
              onClick={() => isActive && setCvSheetOpen(true)}
              title={!isActive ? 'This assignment is no longer active.' : undefined}
            >
              <Send className="w-4 h-4 mr-2" />
              {isActive ? 'Submit CV' : 'Submission Closed'}
            </Button>
          </div>
        </div>
      </div>

      {/* CV Submission Sheet */}
      {id && (
        <CVSubmissionSheet
          isOpen={cvSheetOpen}
          onOpenChange={setCvSheetOpen}
          jdId={id}
          onSuccess={() => { setCvSheetOpen(false); }}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="font-medium text-sm">{value ?? '—'}</p>
    </div>
  );
}
