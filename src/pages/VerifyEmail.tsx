import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '@/app/route-paths';

interface LocationState {
  email?: string;
}

const VerifyEmail = () => {
  const { lang } = useLanguage();
  const { user, resendVerificationEmail } = useAuth();
  const location = useLocation();
  const initialEmail = (location.state as LocationState | null)?.email ?? user?.email ?? '';

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // If the user is already verified, congratulate them and show home link.
  if (user?.emailVerified) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-card p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mb-2 text-xl font-bold">
            {lang === 'ar' ? 'البريد الإلكتروني مؤكد' : 'Email verified'}
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            {lang === 'ar'
              ? 'حسابك مؤكد وجاهز للاستخدام.'
              : 'Your account is verified and ready to use.'}
          </p>
          <Button asChild>
            <Link to={ROUTES.home}>{lang === 'ar' ? 'الصفحة الرئيسية' : 'Home'}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error(lang === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email required');
      return;
    }
    setLoading(true);
    const result = await resendVerificationEmail(email);
    setLoading(false);
    if (result.success === false) {
      toast.error(result.error);
      return;
    }
    setSent(true);
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-card">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Mail className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold">
            {lang === 'ar' ? 'تأكيد البريد الإلكتروني' : 'Verify your email'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {sent
              ? lang === 'ar'
                ? `أعدنا إرسال رابط التأكيد إلى ${email}.`
                : `We re-sent the confirmation link to ${email}.`
              : lang === 'ar'
                ? 'لم يتم تأكيد بريدك بعد. تحقق من صندوق الوارد، أو اطلب رابطاً جديداً أدناه.'
                : "Your email hasn't been confirmed yet. Check your inbox, or request a new link below."}
          </p>
        </div>

        {!sent && (
          <form onSubmit={handleResend} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="verify-email">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
              <Input
                id="verify-email"
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
                ? lang === 'ar'
                  ? 'جارٍ الإرسال...'
                  : 'Sending...'
                : lang === 'ar'
                  ? 'إعادة إرسال رابط التأكيد'
                  : 'Resend confirmation link'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to={ROUTES.login} className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3 w-3" />
            {lang === 'ar' ? 'العودة إلى تسجيل الدخول' : 'Back to login'}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
