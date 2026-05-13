import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: Props) {
  const { t, locale } = useI18n();
  const { verifyAndChangePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  function reset() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error(t.auth.passwordsNotMatch);
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t.auth.passwordMinLength);
      return;
    }
    if (currentPassword === newPassword) {
      toast.error(
        locale === 'ar'
          ? 'كلمة المرور الجديدة يجب أن تختلف عن الحالية'
          : 'New password must differ from current one',
      );
      return;
    }

    setLoading(true);
    const result = await verifyAndChangePassword(currentPassword, newPassword);
    setLoading(false);

    if (result.success === false) {
      toast.error(result.error);
      return;
    }

    toast.success(locale === 'ar' ? 'تم تحديث كلمة المرور بنجاح' : 'Password updated successfully');
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{locale === 'ar' ? 'تغيير كلمة المرور' : 'Change password'}</DialogTitle>
          <DialogDescription>
            {locale === 'ar'
              ? 'أدخل كلمة المرور الحالية ثم اختر كلمة مرور جديدة.'
              : 'Enter your current password, then choose a new one.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="current-password">
              {locale === 'ar' ? 'كلمة المرور الحالية' : 'Current password'}
            </Label>
            <PasswordInput
              id="current-password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="new-password">{t.auth.password}</Label>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div>
            <Label htmlFor="confirm-new-password">{t.auth.confirmPassword}</Label>
            <PasswordInput
              id="confirm-new-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t.common.loading : t.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
