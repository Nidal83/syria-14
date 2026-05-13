import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { User, Heart, Settings, KeyRound, LogOut, ChevronRight } from 'lucide-react';
import { isApprovedOffice, isPendingOfficeApplicant, isRejectedOfficeApplicant } from '@/lib/role-utils';
import { Button } from '@/components/ui/button';
import { ChangePasswordDialog } from '@/features/auth/components/ChangePasswordDialog';
import { ROUTES } from '@/app/route-paths';

const UserDashboard = () => {
  const { lang, t } = useLanguage();
  const { user, logout } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // ProtectedRoute already ensures `user` is non-null.
  // We still send admin/office users to their own dashboards if they land here.
  if (!user) return null;
  if (user.role === 'admin') return <Navigate to={ROUTES.admin} replace />;
  if (isApprovedOffice(user) || isPendingOfficeApplicant(user) || isRejectedOfficeApplicant(user)) {
    return <Navigate to={ROUTES.office} replace />;
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">
        {t('nav.hello')} {user.name}
      </h1>

      {/* Quick stats / shortcuts */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-xl bg-card p-6 text-center shadow-card">
          <User className="mx-auto mb-3 h-10 w-10 text-primary" />
          <h3 className="mb-1 font-semibold">{t('dash.profile')}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-sm text-muted-foreground">{user.phone}</p>
        </div>
        <Link
          to={ROUTES.favorites}
          className="group rounded-xl bg-card p-6 text-center shadow-card transition-colors hover:bg-secondary"
        >
          <Heart className="mx-auto mb-3 h-10 w-10 text-destructive" />
          <h3 className="mb-1 font-semibold">{t('nav.favorites')}</h3>
          <p className="text-sm text-muted-foreground group-hover:text-foreground">
            {lang === 'ar' ? 'عرض المفضلة' : 'View favorites'}
          </p>
        </Link>
        <div className="rounded-xl bg-card p-6 text-center shadow-card">
          <Settings className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-1 font-semibold">{t('dash.settings')}</h3>
          <p className="text-sm text-muted-foreground">
            {lang === 'ar' ? 'إدارة حسابك' : 'Manage your account'}
          </p>
        </div>
      </div>

      {/* Account section */}
      <section className="rounded-xl bg-card p-6 shadow-card">
        <h2 className="mb-4 text-lg font-semibold">
          {lang === 'ar' ? 'إعدادات الحساب' : 'Account settings'}
        </h2>
        <div className="divide-y divide-border">
          <button
            type="button"
            onClick={() => setChangePasswordOpen(true)}
            className="flex w-full items-center justify-between py-4 text-start transition-colors hover:bg-secondary/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {lang === 'ar' ? 'تغيير كلمة المرور' : 'Change password'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {lang === 'ar'
                    ? 'تحديث كلمة المرور الخاصة بك'
                    : 'Update the password on your account'}
                </p>
              </div>
            </div>
            <ChevronRight
              className={`h-5 w-5 text-muted-foreground ${lang === 'ar' ? 'rotate-180' : ''}`}
            />
          </button>

          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center justify-between py-4 text-start transition-colors hover:bg-secondary/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <LogOut className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium">{t('nav.logout')}</p>
                <p className="text-sm text-muted-foreground">
                  {lang === 'ar' ? 'تسجيل الخروج من هذا الجهاز' : 'Sign out of this device'}
                </p>
              </div>
            </div>
            <ChevronRight
              className={`h-5 w-5 text-muted-foreground ${lang === 'ar' ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <Button asChild variant="outline">
            <Link to={ROUTES.home}>
              {lang === 'ar' ? 'العودة للصفحة الرئيسية' : 'Back to home'}
            </Link>
          </Button>
        </div>
      </section>

      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </div>
  );
};

export default UserDashboard;
