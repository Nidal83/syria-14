import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { toast } from 'sonner';
import { ROUTES, getDashboardPath } from '@/app/route-paths';
import { isPendingOfficeApplicant, isRejectedOfficeApplicant, isApprovedOffice } from '@/lib/role-utils';

interface LocationState {
  from?: { pathname?: string };
}

const Login = () => {
  const { t, lang } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success === false) {
      if (result.code === 'email_not_confirmed') {
        toast.message(
          lang === 'ar' ? 'يرجى تأكيد بريدك الإلكتروني أولاً' : 'Please verify your email first',
        );
        navigate(ROUTES.verifyEmail, { state: { email: result.email } });
        return;
      }
      toast.error(result.error);
      return;
    }

    toast.success(t('nav.hello') + '!');

    const state = location.state as LocationState | null;
    const from = state?.from?.pathname;
    const shouldUseFrom = from && from !== ROUTES.login && from !== ROUTES.register;
    let target = shouldUseFrom ? from : getDashboardPath(result.user.role);

    if (!shouldUseFrom) {
      if (isPendingOfficeApplicant(result.user) || isRejectedOfficeApplicant(result.user)) {
        target = ROUTES.office;
      } else if (isApprovedOffice(result.user)) {
        target = ROUTES.office;
      }
    }

    navigate(target, { replace: true });
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-card">
        <h1 className="mb-6 text-center text-2xl font-bold">{t('auth.login')}</h1>

        <GoogleSignInButton className="w-full" />

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase text-muted-foreground">
            {lang === 'ar' ? 'أو' : 'or'}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="login-email">{t('auth.email')}</Label>
            <Input
              id="login-email"
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
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">{t('auth.password')}</Label>
              <Link
                to={ROUTES.forgotPassword}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
              </Link>
            </div>
            <PasswordInput
              id="login-password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="gradient-primary w-full text-primary-foreground"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('auth.login')}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('auth.no_account')}{' '}
          <Link to={ROUTES.register} className="font-medium text-primary hover:underline">
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
