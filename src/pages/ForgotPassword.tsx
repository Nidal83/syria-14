import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '@/app/route-paths';

const ForgotPassword = () => {
  const { t, lang } = useLanguage();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Build the absolute URL Supabase should redirect back to after the user
    // clicks the recovery link in their email. This URL must be allow-listed
    // in Supabase Dashboard → Auth → URL Configuration → Redirect URLs.
    const redirectTo = `${window.location.origin}${ROUTES.resetPassword}`;
    const result = await requestPasswordReset(email, redirectTo);
    setLoading(false);

    if (result.success === false) {
      // We deliberately do NOT distinguish "email not found" from other errors.
      // Enumerating registered emails is an anti-pattern (account-discovery).
      // Still, surface non-network errors to the user.
      toast.error(result.error);
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-card p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mb-2 text-xl font-bold">
            {lang === 'ar' ? 'تحقق من بريدك الإلكتروني' : 'Check your email'}
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            {lang === 'ar'
              ? `لقد أرسلنا رابط إعادة تعيين كلمة المرور إلى ${email}. تحقق من صندوق الوارد ومجلد الرسائل غير المرغوب فيها.`
              : `We sent a password reset link to ${email}. Check your inbox and spam folder.`}
          </p>
          <Link
            to={ROUTES.login}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {lang === 'ar' ? 'العودة إلى تسجيل الدخول' : 'Back to login'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-card">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Mail className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold">
            {lang === 'ar' ? 'استعادة كلمة المرور' : 'Reset password'}
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            {lang === 'ar'
              ? 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.'
              : "Enter your email and we'll send you a link to reset your password."}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="forgot-email">{t('auth.email')}</Label>
            <Input
              id="forgot-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
                ? 'إرسال رابط الاستعادة'
                : 'Send reset link'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link to={ROUTES.login} className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3 w-3" />
            {lang === 'ar' ? 'العودة إلى تسجيل الدخول' : 'Back to login'}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
