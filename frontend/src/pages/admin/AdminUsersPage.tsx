import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { getUsers, createUser, updateUser, deactivateUser } from '@/api/users';
import type { User, UserCreate, UserUpdate } from '@/types';
import { Role } from '@/types';
import { apiError } from '@/lib/apiError';
import { DataTable, type ColumnDef } from '@/components/DataTable';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserPlus, AlertCircle, RefreshCw } from 'lucide-react';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'At least 6 characters'),
  role: z.nativeEnum(Role),
  company_name: z.string().optional(),
  contact_name: z.string().optional(),
});

const editSchema = z.object({
  email: z.string().email('Valid email required').optional(),
  password: z.string().min(6, 'At least 6 characters').optional().or(z.literal('')),
  role: z.nativeEnum(Role).optional(),
  is_active: z.boolean().optional(),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sheet / dialog state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PAGE_SIZE = 10;

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, page_size: PAGE_SIZE };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter === 'active') params.is_active = true;
      if (statusFilter === 'inactive') params.is_active = false;

      const res = await getUsers(params);
      // Handle both paginated and plain array responses
      if (Array.isArray(res)) {
        setUsers(res as unknown as User[]);
        setTotal((res as unknown as User[]).length);
        setTotalPages(1);
      } else {
        setUsers(res.data);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      }
    } catch (err) {
      setError(apiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ─── Create Form ───────────────────────────────────────────────────────────
  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema) });
  const watchRole = createForm.watch('role');

  const onCreateSubmit = async (data: CreateForm) => {
    setIsSubmitting(true);
    try {
      const payload: UserCreate = {
        email: data.email,
        password: data.password,
        role: data.role,
        company_name: data.company_name,
        contact_name: data.contact_name,
      };
      await createUser(payload);
      toast({ title: 'User created successfully.' });
      setSheetOpen(false);
      createForm.reset();
      fetchUsers();
    } catch {
      toast({ title: 'Failed to create user.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Edit Form ─────────────────────────────────────────────────────────────
  const editForm = useForm<EditForm>({ resolver: zodResolver(editSchema) });

  const openEdit = (user: User) => {
    setEditUser(user);
    editForm.reset({ email: user.email, role: user.role, is_active: user.is_active, password: '' });
    setSheetOpen(true);
  };

  const onEditSubmit = async (data: EditForm) => {
    if (!editUser) return;
    setIsSubmitting(true);
    try {
      const payload: UserUpdate = {
        email: data.email,
        role: data.role,
        is_active: data.is_active,
      };
      if (data.password) payload.password = data.password;
      await updateUser(editUser.id, payload);
      toast({ title: 'User updated successfully.' });
      setSheetOpen(false);
      setEditUser(null);
      fetchUsers();
    } catch {
      toast({ title: 'Failed to update user.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Deactivate ────────────────────────────────────────────────────────────
  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deactivateUser(deactivateTarget.id);
      toast({ title: 'User deactivated.' });
      setDeactivateTarget(null);
      fetchUsers();
    } catch {
      toast({ title: 'Failed to deactivate user.', variant: 'destructive' });
    }
  };

  // ─── Table Columns ─────────────────────────────────────────────────────────
  const columns: ColumnDef<User>[] = [
    { header: 'Email', accessor: 'email' },
    { header: 'Full Name', accessor: 'full_name' },
    {
      header: 'Role',
      accessor: (row) => <span className="capitalize">{row.role}</span>,
    },
    {
      header: 'Status',
      accessor: (row) => (
        <StatusBadge status={row.is_active ? 'active' : 'inactive'} />
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>Edit</Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive border-destructive/40 hover:bg-destructive/10 disabled:opacity-40"
            disabled={!row.is_active}
            onClick={() => row.is_active && setDeactivateTarget(row)}
          >
            Deactivate
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        action={
          <Button onClick={() => { setEditUser(null); createForm.reset(); setSheetOpen(true); }}>
            <UserPlus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value={Role.Admin}>Admin</SelectItem>
            <SelectItem value={Role.Recruiter}>Recruiter</SelectItem>
            <SelectItem value={Role.Vendor}>Vendor</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground ml-auto">
          {!isLoading && `${total} user${total !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-md bg-destructive/10 text-destructive mb-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm flex-1">{error}</span>
          <Button size="sm" variant="outline" onClick={fetchUsers}>
            <RefreshCw className="w-4 h-4 mr-1" />Retry
          </Button>
        </div>
      )}

      <DataTable<User>
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyMessage="No users found."
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* ─── Create Sheet ─── */}
      <Sheet open={sheetOpen && !editUser} onOpenChange={(o) => { if (!o) { setSheetOpen(false); setEditUser(null); } }}>
        <SheetContent className="bg-card border-border w-[440px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Create User</SheetTitle>
          </SheetHeader>
          <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="c-email">Email *</Label>
              <Input id="c-email" {...createForm.register('email')} />
              {createForm.formState.errors.email && (
                <p className="text-xs text-destructive">{createForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-pw">Password *</Label>
              <Input id="c-pw" type="password" {...createForm.register('password')} />
              {createForm.formState.errors.password && (
                <p className="text-xs text-destructive">{createForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select onValueChange={(v) => createForm.setValue('role', v as Role)}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.Admin}>Admin</SelectItem>
                  <SelectItem value={Role.Recruiter}>Recruiter</SelectItem>
                  <SelectItem value={Role.Vendor}>Vendor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(watchRole === Role.Vendor) && (
              <div className="space-y-1.5">
                <Label htmlFor="c-company">Company Name *</Label>
                <Input id="c-company" {...createForm.register('company_name')} />
              </div>
            )}
            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create User'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* ─── Edit Sheet ─── */}
      <Sheet open={sheetOpen && !!editUser} onOpenChange={(o) => { if (!o) { setSheetOpen(false); setEditUser(null); } }}>
        <SheetContent className="bg-card border-border w-[440px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Edit User</SheetTitle>
          </SheetHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="e-email">Email</Label>
              <Input id="e-email" {...editForm.register('email')} />
              {editForm.formState.errors.email && (
                <p className="text-xs text-destructive">{editForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-pw">Password <span className="text-muted-foreground text-xs">(leave blank to keep)</span></Label>
              <Input id="e-pw" type="password" {...editForm.register('password')} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                defaultValue={editUser?.role}
                onValueChange={(v) => editForm.setValue('role', v as Role)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.Admin}>Admin</SelectItem>
                  <SelectItem value={Role.Recruiter}>Recruiter</SelectItem>
                  <SelectItem value={Role.Vendor}>Vendor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="e-active"
                checked={editForm.watch('is_active') ?? true}
                onCheckedChange={(v) => editForm.setValue('is_active', v)}
              />
              <Label htmlFor="e-active">Active</Label>
            </div>
            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* ─── Deactivate Dialog ─── */}
      <ConfirmDialog
        isOpen={!!deactivateTarget}
        title="Deactivate User"
        description="Deactivate this user? They will lose access immediately."
        confirmLabel="Deactivate"
        destructive
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}
