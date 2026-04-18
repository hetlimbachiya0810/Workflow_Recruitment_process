import { useState, useEffect, useCallback } from 'react';
import { getMySubmissions } from '@/api/submissions';
import type { CVSubmission } from '@/types';
import { DataTable, type ColumnDef } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { apiError } from '@/lib/apiError';

const PAGE_LIMIT = 20;

export default function VendorSubmissionsPage() {
  const [submissions, setSubmissions] = useState<CVSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jdFilter, setJdFilter] = useState('');
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchSubmissions = useCallback(async (reset = false) => {
    setIsLoading(true);
    setError(null);
    const currentSkip = reset ? 0 : skip;
    try {
      const params: Record<string, unknown> = { skip: currentSkip, limit: PAGE_LIMIT };
      if (jdFilter.trim()) params.jd_id = jdFilter.trim();
      const data = await getMySubmissions(params);
      if (reset) {
        setSubmissions(data);
        setSkip(data.length);
      } else {
        setSubmissions((prev) => [...prev, ...data]);
        setSkip(currentSkip + data.length);
      }
      setHasMore(data.length === PAGE_LIMIT);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [jdFilter, skip]);

  useEffect(() => {
    setSkip(0);
    setSubmissions([]);
    fetchSubmissions(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jdFilter]);

  const columns: ColumnDef<CVSubmission>[] = [
    {
      header: 'Candidate Name',
      accessor: (row) => row.candidate?.name ?? row.candidate_name,
    },
    {
      header: 'Candidate Email',
      accessor: (row) => row.candidate?.email ?? row.candidate_email ?? '—',
    },
    { header: 'JD ID', accessor: 'jd_id' },
    {
      header: 'Status',
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Submitted Rate',
      accessor: (row) =>
        (row as any).submitted_rate != null ? `$${(row as any).submitted_rate}` : '—',
    },
    {
      header: 'Submitted At',
      accessor: (row) => new Date(row.submitted_at).toLocaleDateString(),
    },
    {
      header: 'CV',
      accessor: (row) =>
        row.candidate?.cv_url ? (
          <a
            href={row.candidate.cv_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />View
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="My Submissions" />

      {/* JD Filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="space-y-1">
          <Label htmlFor="jd-filter" className="text-xs">Filter by JD ID</Label>
          <Input
            id="jd-filter"
            className="w-48"
            placeholder="e.g. 42"
            value={jdFilter}
            onChange={(e) => setJdFilter(e.target.value)}
          />
        </div>
        <div className="flex items-end pb-0.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setJdFilter(''); }}
            disabled={!jdFilter}
          >
            Clear
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-md bg-destructive/10 text-destructive mb-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm flex-1">{error}</span>
          <Button size="sm" variant="outline" onClick={() => fetchSubmissions(true)}>
            <RefreshCw className="w-4 h-4 mr-1" />Retry
          </Button>
        </div>
      )}

      <DataTable<CVSubmission>
        columns={columns}
        data={submissions}
        isLoading={isLoading && submissions.length === 0}
        emptyMessage="No submissions yet."
      />

      {hasMore && !isLoading && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => fetchSubmissions(false)}>Load More</Button>
        </div>
      )}
    </div>
  );
}
