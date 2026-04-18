import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { getVendors, updateVendorApproval } from '@/api/vendors';
import type { Vendor } from '@/types';
import { apiError } from '@/lib/apiError';
import { DataTable, type ColumnDef } from '@/components/DataTable';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'pending' | 'approved'>('all');

  // Sheet / dialog state
  const [viewVendor, setViewVendor] = useState<Vendor | null>(null);
  const [approvalTarget, setApprovalTarget] = useState<{ vendor: Vendor; action: 'approve' | 'revoke' } | null>(null);

  const PAGE_SIZE = 10;

  const fetchVendors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, page_size: PAGE_SIZE };
      if (approvalFilter === 'approved') params.is_approved = true;
      if (approvalFilter === 'pending') params.is_approved = false;

      const res = await getVendors(params);
      if (Array.isArray(res)) {
        setVendors(res as unknown as Vendor[]);
        setTotal((res as unknown as Vendor[]).length);
        setTotalPages(1);
      } else {
        setVendors(res.data);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      }
    } catch (err) {
      setError(apiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, approvalFilter]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const handleApprovalAction = async () => {
    if (!approvalTarget) return;
    const { vendor, action } = approvalTarget;
    try {
      await updateVendorApproval(vendor.id, action === 'approve');
      toast({ title: action === 'approve' ? 'Vendor approved.' : 'Vendor approval revoked.' });
      setApprovalTarget(null);
      fetchVendors();
    } catch {
      toast({ title: 'Action failed.', variant: 'destructive' });
    }
  };

  const columns: ColumnDef<Vendor>[] = [
    { header: 'Company', accessor: 'company_name' },
    { header: 'Email', accessor: 'contact_email' },
    {
      header: 'Status',
      accessor: (row) => <StatusBadge status={row.is_approved ? 'approved' : 'pending'} />,
    },
    {
      header: 'Performance',
      accessor: (row) => (
        <span className="font-mono text-sm">
          {typeof row.performance_score === 'number' ? row.performance_score.toFixed(1) : '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setViewVendor(row)}>View</Button>
          {row.is_approved ? (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={() => setApprovalTarget({ vendor: row, action: 'revoke' })}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />Revoke
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10"
              onClick={() => setApprovalTarget({ vendor: row, action: 'approve' })}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" />Approve
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Vendors" />

      {/* Approval filter tabs */}
      <Tabs value={approvalFilter} onValueChange={(v) => { setApprovalFilter(v as typeof approvalFilter); setPage(1); }} className="mb-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center justify-end mb-3">
        <span className="text-sm text-muted-foreground">
          {!isLoading && `${total} vendor${total !== 1 ? 's' : ''}`}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-md bg-destructive/10 text-destructive mb-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm flex-1">{error}</span>
          <Button size="sm" variant="outline" onClick={fetchVendors}>
            <RefreshCw className="w-4 h-4 mr-1" />Retry
          </Button>
        </div>
      )}

      <DataTable<Vendor>
        columns={columns}
        data={vendors}
        isLoading={isLoading}
        emptyMessage="No vendors found."
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* ─── Vendor Detail Sheet ─── */}
      <Sheet open={!!viewVendor} onOpenChange={(o) => !o && setViewVendor(null)}>
        <SheetContent className="bg-card border-border w-[440px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Vendor Details</SheetTitle>
          </SheetHeader>
          {viewVendor && (
            <div className="space-y-4">
              {[
                { label: 'Company Name', value: viewVendor.company_name },
                { label: 'Contact Email', value: viewVendor.contact_email },
                { label: 'Approval Status', value: <StatusBadge status={viewVendor.is_approved ? 'approved' : 'pending'} /> },
                { label: 'Performance Score', value: typeof viewVendor.performance_score === 'number' ? viewVendor.performance_score.toFixed(2) : '—' },
                { label: 'User ID', value: viewVendor.user_id },
                { label: 'Vendor ID', value: viewVendor.id },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── Approval / Revoke Dialog ─── */}
      <ConfirmDialog
        isOpen={!!approvalTarget}
        title={approvalTarget?.action === 'approve' ? 'Approve Vendor' : 'Revoke Vendor Approval'}
        description={
          approvalTarget?.action === 'approve'
            ? 'Approve this vendor? They will be able to submit CVs immediately.'
            : "Revoke this vendor's approval? They will lose CV submission access immediately."
        }
        confirmLabel={approvalTarget?.action === 'approve' ? 'Approve' : 'Revoke'}
        destructive={approvalTarget?.action === 'revoke'}
        onConfirm={handleApprovalAction}
        onCancel={() => setApprovalTarget(null)}
      />
    </div>
  );
}
