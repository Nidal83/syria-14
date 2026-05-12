import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { toast } from 'sonner';
import { Loader2, KeyRound, AlertTriangle } from 'lucide-react';
import { ROUTES } from '@/app/route-paths';

type RecoveryState = 'checking' | 'ready' | 'invalid';

const ResetPassword = () => {
  const { t, lang } = useLanguage();
  const { updatePassword, logout } = useAuth();
  const navigate = useNavigate();

  const [recovery, setRecovery] = useState<RecoveryState>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Supabase emits `PASSWORD_RECOVERY` once it processes the recovery token
  // from the URL (because the client is created with `detectSessionInUrl`).
  // We listen for it to know we're in a legitimate reset flow.
  //
  // If the user lands here without a valid token (e.g. they bookmarked the
  // page or the link expired), no `PASSWORD_RECOVERY` event fires. We assume
  // the link is invalid after a short grace period.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecovery('ready');
      }
    });

    // If after 2 seconds we've seen no recovery event and there's no token in
    // the URL, treat the page as accessed without a valid link.
    timer = setTimeout(() => {
      setRecovery((current) => {
        if (current === 'checking') {
          // Check if URL still has hash params (recovery token); if not, invalid.
          const hasToken = window.location.hash.includes('access_token=');
          return hasToken ? 'checking' : 'invalid';
        }
        return current;
      });
    }, 2000);

    return () => {
      subscription.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error(
        lang === 'ar'
          ? 'يجب أن تكون كلمة المرور 8 أحرف على الأقل'
          : 'Password must be at least 8 characters',
      );
      return;
    }

    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);

    if (result.success === false) {
      toast.error(result.error);
      return;
    }

    toast.success(lang === 'ar' ? 'تم تحديث كلمة المرور بنجاح' : 'Password updated successfully');

    // Sign out the recovery session so the user must log in with the new password.
    await logout();
    navigate(ROUTES.login, { replace: true });
  };

  if (recovery === 'checking') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (recovery === 'invalid') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-card p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="mb-2 text-xl font-bold">
            {lang === 'ar' ? 'رابط غير صالح أو منتهي الصلاحية' : 'Invalid or expired link'}
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            {lang === 'ar'
              ? 'يرجى طلب رابط جديد لإعادة تعيين كلمة المرور.'
              : 'Please request a new password reset link.'}
          </p>
          <Link
            to={ROUTES.forgotPassword}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {lang === 'ar' ? 'طلب رابط جديد' : 'Request new link'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-card">
        <div className="mb-6 flex flex-col items-center gap-2">
          <KeyRound className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold">
            {lang === 'ar' ? 'كلمة مرور جديدة' : 'New password'}
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            {lang === 'ar' ? 'أدخل كلمة المرور الجديدة أدناه.' : 'Enter your new password below.'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="reset-password">{t('auth.password')}</Label>
            <PasswordInput
              id="reset-password"
              name="new-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div>
            <Label htmlFor="reset-password-confirm">
              {lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm password'}
            </Label>
            <PasswordInput
              id="reset-password-confirm"
              name="new-password-confirm"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button
            type="submit"
            className="gradient-primary w-full text-primary-foreground"
            disabled={loading}
          >
            {loading
              ? t('common.loading')
              : lang === 'ar'
                ? 'تحديث كلمة المرور'
                : 'Update password'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
