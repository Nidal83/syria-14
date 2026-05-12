import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
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
import { toast } from 'sonner';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Change-password dialog for an authenticated user.
 *
 * Requires the user's current password, then sets a new one. The current
 * password check protects against "left laptop unlocked" hijack — Supabase's
 * `updateUser({ password })` does not require it on its own.
 *
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   <ChangePasswordDialog open={open} onOpenChange={setOpen} />
 */
export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { lang } = useLanguage();
  const { verifyAndChangePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error(lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error(
        lang === 'ar'
          ? 'يجب أن تكون كلمة المرور 8 أحرف على الأقل'
          : 'Password must be at least 8 characters',
      );
      return;
    }
    if (currentPassword === newPassword) {
      toast.error(
        lang === 'ar'
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

    toast.success(lang === 'ar' ? 'تم تحديث كلمة المرور بنجاح' : 'Password updated successfully');
    reset();
    onOpenChange(false);
  };

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
          <DialogTitle>{lang === 'ar' ? 'تغيير كلمة المرور' : 'Change password'}</DialogTitle>
          <DialogDescription>
            {lang === 'ar'
              ? 'أدخل كلمة المرور الحالية ثم اختر كلمة مرور جديدة.'
              : 'Enter your current password, then choose a new one.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="current-password">
              {lang === 'ar' ? 'كلمة المرور الحالية' : 'Current password'}
            </Label>
            <PasswordInput
              id="current-password"
              name="current-password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="new-password">
              {lang === 'ar' ? 'كلمة المرور الجديدة' : 'New password'}
            </Label>
            <PasswordInput
              id="new-password"
              name="new-password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div>
            <Label htmlFor="confirm-new-password">
              {lang === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm new password'}
            </Label>
            <PasswordInput
              id="confirm-new-password"
              name="new-password-confirm"
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
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? lang === 'ar'
                  ? 'جارٍ التحديث...'
                  : 'Updating...'
                : lang === 'ar'
                  ? 'تحديث'
                  : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
