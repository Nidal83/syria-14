import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import type { OfficeApplication } from '@/types/office.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApplicationWithProfile extends OfficeApplication {
  profiles: { name: string; email: string } | null;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

function useApplications(statusFilter: string) {
  return useQuery({
    queryKey: ['admin-applications', statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('office_applications')
        .select('*, profiles!office_applications_user_id_fkey(name, email)')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') q = q.eq('status', statusFilter);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ApplicationWithProfile[];
    },
  });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const map: Record<string, { label: string; className: string }> = {
    pending_review: { label: t.admin.pending, className: 'bg-yellow-100 text-yellow-800' },
    approved: { label: t.admin.approved, className: 'bg-green-100 text-green-800' },
    rejected: { label: t.admin.rejected, className: 'bg-red-100 text-red-800' },
  };
  const cfg = map[status] ?? map.pending_review;
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

// ─── Document link ────────────────────────────────────────────────────────────

function DocLink({ url, label }: { url: string | null; label: string }) {
  if (!url) return <span className="text-xs text-muted-foreground">—</span>;
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

// ─── Application row ──────────────────────────────────────────────────────────

function ApplicationRow({
  app,
  onApprove,
  onReject,
}: {
  app: ApplicationWithProfile;
  onApprove: (app: ApplicationWithProfile) => void;
  onReject: (app: ApplicationWithProfile) => void;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden shadow-card">
      {/* Header row */}
      <div
        className="flex cursor-pointer items-center gap-3 p-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{app.office_name}</span>
            <StatusBadge status={app.status} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {app.profiles?.name} · {app.profiles?.email} · {app.city}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {/* Always-visible action buttons for pending applications */}
          {app.status === 'pending_review' && (
            <>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove(app);
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
                  onReject(app);
                }}
              >
                <XCircle className="h-4 w-4" />
                <span className="hidden sm:inline">{t.admin.reject}</span>
              </Button>
            </>
          )}
          <span className="hidden text-xs text-muted-foreground sm:block">
            {format(new Date(app.created_at), 'dd/MM/yyyy')}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <CardContent className="space-y-4 border-t border-border/40 bg-muted/20 pb-4 pt-4">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">{t.office.officeName}</p>
              <p className="font-medium">{app.office_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.office.officeSlug}</p>
              <p className="font-mono text-xs font-medium">{app.office_slug ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.office.phone}</p>
              <p className="font-medium" dir="ltr">
                {app.phone}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.office.city}</p>
              <p className="font-medium">{app.city}</p>
            </div>
          </div>

          {app.description && (
            <div>
              <p className="text-xs text-muted-foreground">{t.office.description}</p>
              <p className="text-sm">{app.description}</p>
            </div>
          )}

          {/* Documents */}
          <div className="flex flex-wrap gap-4">
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
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t.admin.viewDocuments}</p>
              <DocLink url={app.document_url} label={t.office.companyDocument} />
              <div />
              <DocLink url={app.id_document_url} label={t.office.idDocument} />
            </div>
          </div>

          {/* Rejection reason if rejected */}
          {app.status === 'rejected' && app.rejection_reason && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm">
              <span className="font-semibold text-red-700">{t.admin.rejectionReason}: </span>
              <span className="text-red-600">{app.rejection_reason}</span>
            </div>
          )}

          {/* Actions */}
          {app.status === 'pending_review' && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => onApprove(app)} className="gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                {t.admin.approve}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject(app)}
                className="gap-1.5"
              >
                <XCircle className="h-4 w-4" />
                {t.admin.reject}
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Approve dialog ───────────────────────────────────────────────────────────

function ApproveDialog({
  app,
  onClose,
}: {
  app: ApplicationWithProfile | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { profile } = useAuth();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!app || !profile) return;

      // 1. Update application status
      const { error: appErr } = await supabase
        .from('office_applications')
        .update({
          status: 'approved',
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', app.id);

      if (appErr) throw appErr;

      // 2. Create office record
      const { error: officeErr } = await supabase.from('offices').insert({
        owner_id: app.user_id,
        owner_name: app.profiles?.name ?? '',
        email: app.profiles?.email ?? '',
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

      // 3. Promote user role to 'office' so they can access the office dashboard
      const { error: roleErr } = await supabase
        .from('profiles')
        .update({ role: 'office' })
        .eq('id', app.user_id);

      if (roleErr) throw roleErr;
    },
    onSuccess: () => {
      toast.success(t.admin.approveSuccess);
      qc.invalidateQueries({ queryKey: ['admin-applications'] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={Boolean(app)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.admin.approve}</DialogTitle>
          <DialogDescription>{t.admin.confirmApprove}</DialogDescription>
        </DialogHeader>
        {app && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
            <p className="font-semibold">{app.office_name}</p>
            <p className="text-muted-foreground">
              {app.profiles?.name} — {app.city}
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

function RejectDialog({
  app,
  onClose,
}: {
  app: ApplicationWithProfile | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!app || !profile) return;
      const { error } = await supabase
        .from('office_applications')
        .update({
          status: 'rejected',
          rejection_reason: reason.trim() || null,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', app.id);
      if (error) throw error;

      // Revert role back to 'user' so they lose pending_office access
      await supabase.from('profiles').update({ role: 'user' }).eq('id', app.user_id);
    },
    onSuccess: () => {
      toast.success(t.admin.rejectSuccess);
      qc.invalidateQueries({ queryKey: ['admin-applications'] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      setReason('');
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog
      open={Boolean(app)}
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
        {app && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
            <p className="font-semibold">{app.office_name}</p>
            <p className="text-muted-foreground">
              {app.profiles?.name} — {app.city}
            </p>
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

export default function AdminApplicationsPage() {
  const { t } = useI18n();
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [approvingApp, setApprovingApp] = useState<ApplicationWithProfile | null>(null);
  const [rejectingApp, setRejectingApp] = useState<ApplicationWithProfile | null>(null);

  const { data: applications = [], isLoading } = useApplications(statusFilter);

  const statusIcon: Record<string, React.ReactNode> = {
    pending_review: <Clock className="h-4 w-4 text-yellow-500" />,
    approved: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    rejected: <XCircle className="h-4 w-4 text-red-500" />,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t.admin.applications}</h1>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.admin.allStatuses}</SelectItem>
            <SelectItem value="pending_review">
              <span className="flex items-center gap-1.5">
                {statusIcon.pending_review} {t.admin.pending}
              </span>
            </SelectItem>
            <SelectItem value="approved">
              <span className="flex items-center gap-1.5">
                {statusIcon.approved} {t.admin.approved}
              </span>
            </SelectItem>
            <SelectItem value="rejected">
              <span className="flex items-center gap-1.5">
                {statusIcon.rejected} {t.admin.rejected}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-muted-foreground">{t.common.loading}</p>}

      {!isLoading && applications.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">{t.common.noResults}</p>
      )}

      <div className={cn('space-y-3', isLoading && 'pointer-events-none opacity-50')}>
        {applications.map((app) => (
          <ApplicationRow
            key={app.id}
            app={app}
            onApprove={setApprovingApp}
            onReject={setRejectingApp}
          />
        ))}
      </div>

      <ApproveDialog app={approvingApp} onClose={() => setApprovingApp(null)} />
      <RejectDialog app={rejectingApp} onClose={() => setRejectingApp(null)} />
    </div>
  );
}
