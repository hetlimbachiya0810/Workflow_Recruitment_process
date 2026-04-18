import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJDs } from '@/api/jds';
import type { JD } from '@/types';
import { DataTable, type ColumnDef } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { apiError } from '@/lib/apiError';

const PAGE_LIMIT = 20;
const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Closed', value: 'closed' },
];

export default function VendorJDListPage() {
  const navigate = useNavigate();
  const [jds, setJDs] = useState<JD[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);

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

  useEffect(() => {
    setSkip(0);
    setJDs([]);
    fetchJDs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const columns: ColumnDef<JD>[] = [
    { header: 'Title', accessor: 'title' },
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
        <Button size="sm" variant="outline" onClick={() => navigate(`/vendor/jds/${row.id}`)}>
          <Eye className="w-3.5 h-3.5 mr-1" />View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="My Assignments" />

      <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setSkip(0); }} className="mb-4">
        <TabsList className="bg-muted/50">
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
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
        emptyMessage="No JD assignments found."
      />

      {hasMore && !isLoading && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => fetchJDs(false)}>Load More</Button>
        </div>
      )}
    </div>
  );
}
