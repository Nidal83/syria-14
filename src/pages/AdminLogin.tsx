import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';
import { ROUTES } from '@/app/route-paths';

const AdminLogin = () => {
  const { t, lang } = useLanguage();
  const { login, logout } = useAuth();
  const navigate = useNavigate();
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

    if (result.user.role !== 'admin') {
      await logout();
      toast.error(lang === 'ar' ? 'هذا الحساب ليس مسؤولاً' : 'This account is not an admin');
      return;
    }

    toast.success(lang === 'ar' ? 'مرحباً بالمسؤول' : 'Welcome Admin');
    navigate(ROUTES.admin, { replace: true });
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-card">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Shield className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold">{lang === 'ar' ? 'دخول المسؤول' : 'Admin Login'}</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="admin-email">{t('auth.email')}</Label>
            <Input
              id="admin-email"
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
            <Label htmlFor="admin-password">{t('auth.password')}</Label>
            <PasswordInput
              id="admin-password"
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
            {loading ? t('common.loading') : lang === 'ar' ? 'دخول' : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
