import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  CheckCircle2,
  XCircle,
  Trash2,
  PauseCircle,
  PlayCircle,
  EyeOff,
  Eye,
  Search,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OfficeRow {
  id: string;
  office_name: string;
  owner_name: string;
  email: string;
  phone: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  propertyCount?: number;
}

// ─── Query ────────────────────────────────────────────────────────────────────

function useOffices() {
  return useQuery({
    queryKey: ['admin-offices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offices')
        .select('id, office_name, owner_name, email, phone, status, is_active, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as OfficeRow[];
    },
    staleTime: 1000 * 30,
  });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
  suspended: 'bg-orange-100 text-orange-800',
};

function StatusBadge({
  status,
  isActive,
  t,
}: {
  status: string;
  isActive: boolean;
  t: ReturnType<typeof useI18n>['t'];
}) {
  const label =
    status === 'approved'
      ? isActive
        ? t.admin.approved
        : t.admin.makeUnavailable
      : status === 'rejected'
        ? t.admin.rejected
        : status === 'suspended'
          ? t.admin.suspended
          : t.admin.pending;

  const color =
    status === 'approved' && !isActive
      ? 'bg-gray-100 text-gray-600'
      : (statusColors[status] ?? statusColors.pending);

  return <Badge className={color}>{label}</Badge>;
}

// ─── Confirm modal (generic) ──────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  isPending,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? t.common.loading : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reject dialog (needs reason input) ──────────────────────────────────────

function RejectOfficeDialog({
  office,
  onClose,
}: {
  office: OfficeRow | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { profile: adminProfile } = useAuth();
  const qc = useQueryClient();
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!office || !adminProfile) return;
      const { error } = await supabase
        .from('offices')
        .update({ status: 'rejected' })
        .eq('id', office.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t.admin.rejectOfficeSuccess);
      qc.invalidateQueries({ queryKey: ['admin-offices'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      setReason('');
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog
      open={Boolean(office)}
      onOpenChange={(o) => {
        if (!o) {
          setReason('');
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.admin.rejectOffice}</DialogTitle>
          <DialogDescription>{t.admin.confirmRejectOffice}</DialogDescription>
        </DialogHeader>
        {office && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
            <p className="font-semibold">{office.office_name}</p>
            <p className="text-muted-foreground">{office.owner_name}</p>
          </div>
        )}
        <div className="space-y-1.5">
          <Label>{t.admin.rejectionReason}</Label>
          <Textarea
            rows={3}
            placeholder={t.admin.enterRejectionReason}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setReason('');
              onClose();
            }}
            disabled={mutation.isPending}
          >
            {t.common.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? t.common.loading : t.admin.reject}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOfficesPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: offices = [], isLoading, isError } = useOffices();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog state
  type Action = 'approve' | 'delete' | 'suspend' | 'unsuspend' | 'unavailable' | 'available';
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [targetOffice, setTargetOffice] = useState<OfficeRow | null>(null);
  const [rejectingOffice, setRejectingOffice] = useState<OfficeRow | null>(null);

  function openAction(action: Action, office: OfficeRow) {
    setActiveAction(action);
    setTargetOffice(office);
  }
  function closeAction() {
    setActiveAction(null);
    setTargetOffice(null);
  }

  const mutation = useMutation({
    mutationFn: async ({ action, office }: { action: Action; office: OfficeRow }) => {
      if (action === 'delete') {
        const { error } = await supabase.from('offices').delete().eq('id', office.id);
        if (error) throw error;
      } else if (action === 'approve') {
        const { error } = await supabase
          .from('offices')
          .update({ status: 'approved', is_active: true })
          .eq('id', office.id);
        if (error) throw error;
      } else if (action === 'suspend') {
        // 'suspended' is added to office_status enum by migration 20260618000000_admin_management.sql.
        // Regenerate TS types after applying that migration to remove this cast.
        const suspendUpdate = { status: 'suspended' } as unknown as {
          status: 'pending' | 'approved' | 'rejected';
        };
        const { error } = await supabase.from('offices').update(suspendUpdate).eq('id', office.id);
        if (error) throw error;
      } else if (action === 'unsuspend') {
        const { error } = await supabase
          .from('offices')
          .update({ status: 'approved' })
          .eq('id', office.id);
        if (error) throw error;
      } else if (action === 'unavailable') {
        const { error } = await supabase
          .from('offices')
          .update({ is_active: false })
          .eq('id', office.id);
        if (error) throw error;
      } else if (action === 'available') {
        const { error } = await supabase
          .from('offices')
          .update({ is_active: true })
          .eq('id', office.id);
        if (error) throw error;
      }
    },
    onSuccess: (_, { action }) => {
      const successMap: Record<Action, string> = {
        delete: t.admin.deleteOfficeSuccess,
        approve: t.admin.approveOfficeSuccess,
        suspend: t.admin.suspendSuccess,
        unsuspend: t.admin.unsuspendSuccess,
        unavailable: t.admin.toggleAvailabilitySuccess,
        available: t.admin.toggleAvailabilitySuccess,
      };
      toast.success(successMap[action]);
      qc.invalidateQueries({ queryKey: ['admin-offices'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      closeAction();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = offices.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !o.office_name.toLowerCase().includes(q) &&
        !o.owner_name.toLowerCase().includes(q) &&
        !o.email.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const dialogProps = () => {
    if (!activeAction || !targetOffice) return null;
    const map: Record<
      Action,
      { title: string; description: string; label: string; destructive?: boolean }
    > = {
      approve: {
        title: t.admin.approveOffice,
        description: t.admin.confirmApproveOffice,
        label: t.admin.approve,
      },
      delete: {
        title: t.admin.deleteOffice,
        description: t.admin.confirmDeleteOffice,
        label: t.admin.deleteOffice,
        destructive: true,
      },
      suspend: {
        title: t.admin.suspendOffice,
        description: t.admin.confirmSuspendOffice,
        label: t.admin.suspendOffice,
        destructive: true,
      },
      unsuspend: {
        title: t.admin.unsuspendOffice,
        description: t.admin.unsuspendSuccess,
        label: t.admin.unsuspendOffice,
      },
      unavailable: {
        title: t.admin.makeUnavailable,
        description: t.admin.makeUnavailable,
        label: t.admin.makeUnavailable,
      },
      available: {
        title: t.admin.makeAvailable,
        description: t.admin.makeAvailable,
        label: t.admin.makeAvailable,
      },
    };
    return map[activeAction];
  };

  const dp = dialogProps();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t.admin.offices}</h1>
        <span className="text-sm text-muted-foreground">
          {filtered.length} / {offices.length}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder={t.common.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'pending', 'approved', 'rejected', 'suspended'] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? 'default' : 'outline'}
              onClick={() => setStatusFilter(s)}
              className="text-xs"
            >
              {s === 'all'
                ? t.admin.allStatuses
                : s === 'approved'
                  ? t.admin.approved
                  : s === 'rejected'
                    ? t.admin.rejected
                    : s === 'suspended'
                      ? t.admin.suspended
                      : t.admin.pending}
            </Button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground">{t.common.loading}</p>}
      {isError && <p className="text-destructive">{t.common.error}</p>}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start">{t.office.officeName}</th>
                <th className="px-4 py-3 text-start">{t.admin.officeOwner}</th>
                <th className="px-4 py-3 text-start">{t.auth.email}</th>
                <th className="px-4 py-3 text-start">{t.property.status}</th>
                <th className="px-4 py-3 text-start">{t.admin.submittedAt}</th>
                <th className="px-4 py-3 text-start">{t.admin.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    {t.common.noResults}
                  </td>
                </tr>
              )}
              {filtered.map((o) => (
                <tr key={o.id} className="bg-background hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{o.office_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.owner_name || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.email}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} isActive={o.is_active} t={t} />
                    {!o.is_active && o.status === 'approved' && (
                      <Badge className="ms-1 bg-gray-100 text-[10px] text-gray-600">
                        {t.admin.makeUnavailable}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(o.created_at), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t.admin.actions}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-44">
                        {/* Approve (pending/rejected only) */}
                        {(o.status === 'pending' || o.status === 'rejected') && (
                          <DropdownMenuItem onClick={() => openAction('approve', o)}>
                            <CheckCircle2 className="me-2 h-4 w-4 text-green-600" />
                            {t.admin.approveOffice}
                          </DropdownMenuItem>
                        )}
                        {/* Reject (pending only) */}
                        {o.status === 'pending' && (
                          <DropdownMenuItem onClick={() => setRejectingOffice(o)}>
                            <XCircle className="me-2 h-4 w-4 text-destructive" />
                            {t.admin.rejectOffice}
                          </DropdownMenuItem>
                        )}
                        {/* Suspend / Unsuspend */}
                        {o.status === 'approved' && (
                          <DropdownMenuItem onClick={() => openAction('suspend', o)}>
                            <PauseCircle className="me-2 h-4 w-4 text-orange-500" />
                            {t.admin.suspendOffice}
                          </DropdownMenuItem>
                        )}
                        {o.status === 'suspended' && (
                          <DropdownMenuItem onClick={() => openAction('unsuspend', o)}>
                            <PlayCircle className="me-2 h-4 w-4 text-green-600" />
                            {t.admin.unsuspendOffice}
                          </DropdownMenuItem>
                        )}
                        {/* Available / Unavailable toggle */}
                        {o.status === 'approved' && (
                          <>
                            {o.is_active ? (
                              <DropdownMenuItem onClick={() => openAction('unavailable', o)}>
                                <EyeOff className="me-2 h-4 w-4" />
                                {t.admin.makeUnavailable}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => openAction('available', o)}>
                                <Eye className="me-2 h-4 w-4" />
                                {t.admin.makeAvailable}
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => openAction('delete', o)}
                        >
                          <Trash2 className="me-2 h-4 w-4" />
                          {t.admin.deleteOffice}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Generic confirm dialog */}
      {dp && targetOffice && (
        <ConfirmDialog
          open={Boolean(activeAction && targetOffice)}
          title={dp.title}
          description={dp.description}
          confirmLabel={dp.label}
          destructive={dp.destructive}
          isPending={mutation.isPending}
          onConfirm={() => mutation.mutate({ action: activeAction!, office: targetOffice })}
          onClose={closeAction}
        >
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
            <p className="font-semibold">{targetOffice.office_name}</p>
            <p className="text-muted-foreground">{targetOffice.owner_name}</p>
          </div>
        </ConfirmDialog>
      )}

      {/* Reject dialog (needs reason) */}
      <RejectOfficeDialog office={rejectingOffice} onClose={() => setRejectingOffice(null)} />
    </div>
  );
}
