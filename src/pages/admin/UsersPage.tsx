import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  ImageIcon,
  ExternalLink,
  UserX,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Search,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserApplication {
  id: string;
  document_url: string | null;
  id_document_url: string | null;
  logo_url: string | null;
  office_name: string;
  status: string;
  phone: string;
  city: string;
  office_slug: string | null;
  description: string;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean | null;
  created_at: string;
  office_applications: UserApplication[];
}

// ─── Query ────────────────────────────────────────────────────────────────────

function useUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // is_active column is added by migration 20260618000000_admin_management.sql.
      // Cast query as unknown to bypass generated-types mismatch until types are regenerated.
      const query = supabase
        .from('profiles')
        .select(
          'id, name, email, phone, role, is_active, created_at, office_applications(id, document_url, id_document_url, logo_url, office_name, status, phone, city, office_slug, description)',
        )
        .order('created_at', { ascending: false }) as unknown as Promise<{
        data: UserRow[] | null;
        error: { message: string } | null;
      }>;
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      // Filter out deactivated users client-side (is_active may be null before migration)
      return (data ?? []).filter((u) => u.is_active !== false);
    },
    staleTime: 1000 * 30,
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  office: 'bg-blue-100 text-blue-800',
  pending_office: 'bg-yellow-100 text-yellow-800',
  subadmin: 'bg-indigo-100 text-indigo-800',
  user: 'bg-gray-100 text-gray-700',
};

// ─── Doc link ─────────────────────────────────────────────────────────────────

function DocLink({ url, label }: { url: string | null; label: string }) {
  if (!url) return null;
  const isPdf = url.toLowerCase().includes('.pdf');
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
    >
      {isPdf ? <FileText className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
      {label}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

// ─── User row card ────────────────────────────────────────────────────────────

function UserCard({
  user,
  onDeactivate,
  onChangeRole,
  onApprove,
  onReject,
}: {
  user: UserRow;
  onDeactivate: (u: UserRow) => void;
  onChangeRole: (u: UserRow) => void;
  onApprove: (u: UserRow) => void;
  onReject: (u: UserRow) => void;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const app = user.office_applications?.[0] ?? null;
  const isPendingOffice = user.role === 'pending_office' && app?.status === 'pending_review';
  const canChangeRole = user.role !== 'admin';

  return (
    <Card className="overflow-hidden shadow-card">
      <div
        className="flex cursor-pointer items-center gap-3 p-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{user.name || '—'}</span>
            <Badge className={roleColors[user.role] ?? roleColors.user}>
              {t.roles[user.role as keyof typeof t.roles] ?? user.role}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {user.email}
            {user.phone ? ` · ${user.phone}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {isPendingOffice && (
            <>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove(user);
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t.admin.approve}</span>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  onReject(user);
                }}
              >
                <XCircle className="h-4 w-4" />
                <span className="hidden sm:inline">{t.admin.reject}</span>
              </Button>
            </>
          )}
          <span className="hidden text-xs text-muted-foreground sm:block">
            {format(new Date(user.created_at), 'dd/MM/yyyy')}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <CardContent className="space-y-4 border-t border-border/40 bg-muted/20 pb-4 pt-4">
          {/* Documents */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t.admin.documents}
            </p>
            {app ? (
              <div className="flex flex-wrap items-start gap-4">
                {app.logo_url && (
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">{t.office.logo}</p>
                    <a href={app.logo_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={app.logo_url}
                        alt="logo"
                        className="h-14 w-14 rounded-lg border border-border/60 object-cover"
                      />
                    </a>
                  </div>
                )}
                <div className="space-y-1.5">
                  <DocLink url={app.document_url} label={t.office.companyDocument} />
                  <div />
                  <DocLink url={app.id_document_url} label={t.office.idDocument} />
                  {!app.document_url && !app.id_document_url && !app.logo_url && (
                    <p className="text-xs text-muted-foreground">{t.admin.noDocuments}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t.admin.noDocuments}</p>
            )}
          </div>

          {/* Application info */}
          {app && (
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">{t.office.officeName}</p>
                <p className="font-medium">{app.office_name}</p>
              </div>
              {app.city && (
                <div>
                  <p className="text-xs text-muted-foreground">{t.office.city}</p>
                  <p className="font-medium">{app.city}</p>
                </div>
              )}
              {app.phone && (
                <div>
                  <p className="text-xs text-muted-foreground">{t.office.phone}</p>
                  <p className="font-medium" dir="ltr">
                    {app.phone}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {isPendingOffice && (
              <>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove(user);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {t.admin.approve}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject(user);
                  }}
                >
                  <XCircle className="h-4 w-4" />
                  {t.admin.reject}
                </Button>
              </>
            )}
            {canChangeRole && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeRole(user);
                }}
              >
                <ShieldAlert className="h-4 w-4" />
                {t.admin.changeRole}
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                onDeactivate(user);
              }}
            >
              <UserX className="h-4 w-4" />
              {t.admin.deactivateUser}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Deactivate dialog ────────────────────────────────────────────────────────

function DeactivateDialog({ user, onClose }: { user: UserRow | null; onClose: () => void }) {
  const { t } = useI18n();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      // RPC added by migration 20260618000000_admin_management.sql
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)('admin_deactivate_user', {
        p_user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t.admin.deactivateSuccess);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={Boolean(user)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.admin.deactivateUser}</DialogTitle>
          <DialogDescription>{t.admin.confirmDeactivateUser}</DialogDescription>
        </DialogHeader>
        {user && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
            <p className="font-semibold">{user.name || '—'}</p>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            {t.common.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? t.common.loading : t.admin.deactivateUser}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Change role dialog ────────────────────────────────────────────────────────

function ChangeRoleDialog({ user, onClose }: { user: UserRow | null; onClose: () => void }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [newRole, setNewRole] = useState('');

  const availableRoles = ['user', 'office', 'subadmin'] as const;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user || !newRole) return;
      // RPC added by migration 20260618000000_admin_management.sql
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)('admin_change_user_role', {
        p_user_id: user.id,
        p_new_role: newRole,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t.admin.changeRoleSuccess);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      setNewRole('');
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog
      open={Boolean(user)}
      onOpenChange={(o) => {
        if (!o) {
          setNewRole('');
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.admin.changeRole}</DialogTitle>
          <DialogDescription>{t.admin.confirmChangeRole}</DialogDescription>
        </DialogHeader>
        {user && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
              <p className="font-semibold">{user.name || '—'}</p>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="mt-1 flex items-center gap-1.5 text-xs">
                <Badge className={roleColors[user.role] ?? roleColors.user}>
                  {t.roles[user.role as keyof typeof t.roles] ?? user.role}
                </Badge>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                {newRole && (
                  <Badge className={roleColors[newRole] ?? roleColors.user}>
                    {t.roles[newRole as keyof typeof t.roles] ?? newRole}
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t.admin.selectNewRole}</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder={t.admin.selectNewRole} />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles
                    .filter((r) => r !== user.role)
                    .map((r) => (
                      <SelectItem key={r} value={r}>
                        {t.roles[r as keyof typeof t.roles] ?? r}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setNewRole('');
              onClose();
            }}
            disabled={mutation.isPending}
          >
            {t.common.cancel}
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !newRole}>
            {mutation.isPending ? t.common.loading : t.admin.changeRole}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Approve dialog ───────────────────────────────────────────────────────────

function ApproveDialog({ user, onClose }: { user: UserRow | null; onClose: () => void }) {
  const { t } = useI18n();
  const { profile: adminProfile } = useAuth();
  const qc = useQueryClient();
  const app = user?.office_applications?.[0] ?? null;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user || !app || !adminProfile) return;

      const { error: appErr } = await supabase
        .from('office_applications')
        .update({
          status: 'approved',
          reviewed_by: adminProfile.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', app.id);
      if (appErr) throw appErr;

      const { error: officeErr } = await supabase.from('offices').insert({
        owner_id: user.id,
        owner_name: user.name,
        email: user.email,
        phone: app.phone,
        office_name: app.office_name,
        slug: app.office_slug,
        description: app.description,
        logo_url: app.logo_url,
        address: '',
        is_active: true,
        status: 'approved',
      });
      if (officeErr) throw officeErr;

      const { error: roleErr } = await supabase
        .from('profiles')
        .update({ role: 'office' })
        .eq('id', user.id);
      if (roleErr) throw roleErr;
    },
    onSuccess: () => {
      toast.success(t.admin.approveSuccess);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-applications'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={Boolean(user)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.admin.approve}</DialogTitle>
          <DialogDescription>{t.admin.confirmApprove}</DialogDescription>
        </DialogHeader>
        {user && app && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
            <p className="font-semibold">{app.office_name}</p>
            <p className="text-muted-foreground">
              {user.name} — {app.city}
            </p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            {t.common.cancel}
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? t.common.loading : t.admin.approve}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reject dialog ────────────────────────────────────────────────────────────

function RejectDialog({ user, onClose }: { user: UserRow | null; onClose: () => void }) {
  const { t } = useI18n();
  const { profile: adminProfile } = useAuth();
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  const app = user?.office_applications?.[0] ?? null;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user || !app || !adminProfile) return;

      const { error } = await supabase
        .from('office_applications')
        .update({
          status: 'rejected',
          rejection_reason: reason.trim() || null,
          reviewed_by: adminProfile.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', app.id);
      if (error) throw error;

      await supabase.from('profiles').update({ role: 'user' }).eq('id', user.id);
    },
    onSuccess: () => {
      toast.success(t.admin.rejectSuccess);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-applications'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      setReason('');
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog
      open={Boolean(user)}
      onOpenChange={(o) => {
        if (!o) {
          setReason('');
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.admin.reject}</DialogTitle>
          <DialogDescription>{t.admin.confirmReject}</DialogDescription>
        </DialogHeader>
        {user && app && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
            <p className="font-semibold">{app.office_name}</p>
            <p className="text-muted-foreground">{user.name}</p>
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

export default function AdminUsersPage() {
  const { t } = useI18n();
  const { data: users = [], isLoading, isError } = useUsers();
  const [search, setSearch] = useState('');
  const [deactivatingUser, setDeactivatingUser] = useState<UserRow | null>(null);
  const [changingRoleUser, setChangingRoleUser] = useState<UserRow | null>(null);
  const [approvingUser, setApprovingUser] = useState<UserRow | null>(null);
  const [rejectingUser, setRejectingUser] = useState<UserRow | null>(null);

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t.admin.users}</h1>
        <span className="text-sm text-muted-foreground">
          {filtered.length} / {users.length}
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="ps-9"
          placeholder={t.common.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && <p className="text-muted-foreground">{t.common.loading}</p>}
      {isError && <p className="text-destructive">{t.common.error}</p>}

      {!isLoading && !isError && filtered.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">{t.common.noResults}</p>
      )}

      <div className="space-y-3">
        {filtered.map((u) => (
          <UserCard
            key={u.id}
            user={u}
            onDeactivate={setDeactivatingUser}
            onChangeRole={setChangingRoleUser}
            onApprove={setApprovingUser}
            onReject={setRejectingUser}
          />
        ))}
      </div>

      <DeactivateDialog user={deactivatingUser} onClose={() => setDeactivatingUser(null)} />
      <ChangeRoleDialog user={changingRoleUser} onClose={() => setChangingRoleUser(null)} />
      <ApproveDialog user={approvingUser} onClose={() => setApprovingUser(null)} />
      <RejectDialog user={rejectingUser} onClose={() => setRejectingUser(null)} />
    </div>
  );
}
