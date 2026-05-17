import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, KeyRound, LogOut, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import { ChangePasswordDialog } from '@/features/auth/components/ChangePasswordDialog';
import { supabase } from '@/integrations/supabase/client';

// ─── Edit Profile Dialog ──────────────────────────────────────────────────────

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName: string;
  defaultPhone: string;
}

function EditProfileDialog({
  open,
  onOpenChange,
  defaultName,
  defaultPhone,
}: EditProfileDialogProps) {
  const { t } = useI18n();
  const { refreshProfile } = useAuth();
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    const { error } = await supabase.auth
      .getUser()
      .then(({ data }) =>
        data.user
          ? supabase.from('profiles').update({ name, phone }).eq('id', data.user.id)
          : Promise.resolve({ error: new Error('Not authenticated') }),
      );
    setLoading(false);
    if (error) {
      toast.error(t.common.error);
      return;
    }
    await refreshProfile();
    toast.success(t.common.save);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.account.actions.editProfile}</DialogTitle>
          <DialogDescription>{t.account.info.heading}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">{t.auth.fullName}</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-phone">{t.auth.phone}</Label>
            <Input
              id="edit-phone"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
            {t.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Action row ───────────────────────────────────────────────────────────────

function ActionRow({
  icon: Icon,
  label,
  description,
  onClick,
  variant = 'default',
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-start transition-colors hover:bg-accent"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          variant === 'destructive' ? 'bg-destructive/10' : 'bg-primary/10'
        }`}
      >
        <Icon
          className={`h-4 w-4 ${variant === 'destructive' ? 'text-destructive' : 'text-primary'}`}
        />
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${variant === 'destructive' ? 'text-destructive' : ''}`}>
          {label}
        </p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </button>
  );
}

// ─── Notification toggle ──────────────────────────────────────────────────────

function NotifToggle({
  label,
  prefKey,
  prefs,
  onToggle,
}: {
  label: string;
  prefKey: string;
  prefs: Record<string, boolean>;
  onToggle: (key: string, value: boolean) => void;
}) {
  const checked = prefs[prefKey] !== false;
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <Label htmlFor={`notif-${prefKey}`} className="cursor-pointer font-normal">
        {label}
      </Label>
      <Switch
        id={`notif-${prefKey}`}
        checked={checked}
        onCheckedChange={(v) => onToggle(prefKey, v)}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfficeSettingsPage() {
  const { t, locale } = useI18n();
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ inquiries: true, system: true });
  const [savingPref, setSavingPref] = useState(false);

  const initials = profile?.name?.slice(0, 2).toUpperCase() ?? '??';

  const handleSignOut = useCallback(async () => {
    await logout();
    navigate(PATHS.home);
  }, [logout, navigate]);

  const handleToggle = useCallback(
    async (key: string, value: boolean) => {
      const next = { ...prefs, [key]: value };
      setPrefs(next);
      setSavingPref(true);
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase.from('profiles').update({ notification_prefs: next }).eq('id', data.user.id);
      }
      setSavingPref(false);
      toast.success(t.account.notifications.saved);
    },
    [prefs, t],
  );

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-bold">{t.account.title}</h1>

      {/* ── Section 1: Account information ───────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t.account.info.heading}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar + details */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{profile?.name || '—'}</p>
              <p className="truncate text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>

          <div className="grid gap-3 text-sm">
            {profile?.phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.auth.phone}</span>
                <span dir="ltr">{profile.phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.account.info.accountType}</span>
              <Badge variant="outline">{t.account.info.realEstateOffice}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.account.info.joined}</span>
              <span>{joinedDate}</span>
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full" onClick={() => setEditOpen(true)}>
            {t.account.actions.editProfile}
          </Button>
        </CardContent>
      </Card>

      {/* ── Section 2: Security ──────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t.account.security.heading}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-2">
          <ActionRow
            icon={KeyRound}
            label={locale === 'ar' ? 'تغيير كلمة المرور' : 'Change password'}
            onClick={() => setPasswordOpen(true)}
          />
          <Separator />
          <ActionRow
            icon={LogOut}
            label={t.nav.logout}
            variant="destructive"
            onClick={handleSignOut}
          />
        </CardContent>
      </Card>

      {/* ── Section 3: Email notification preferences ─────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t.account.notifications.heading}</CardTitle>
            {savingPref && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t.account.notifications.saved}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <NotifToggle
            label={t.account.notifications.inquiries}
            prefKey="inquiries"
            prefs={prefs}
            onToggle={handleToggle}
          />
          <Separator />
          <NotifToggle
            label={t.account.notifications.system}
            prefKey="system"
            prefs={prefs}
            onToggle={handleToggle}
          />
          <Bell className="mx-auto mt-2 h-4 w-4 text-muted-foreground/30" />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        defaultName={profile?.name ?? ''}
        defaultPhone={profile?.phone ?? ''}
      />
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </div>
  );
}
