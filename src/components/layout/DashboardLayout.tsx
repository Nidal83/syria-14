import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Home,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import { cn } from '@/lib/utils';

type DashboardRole = 'office' | 'admin';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

function useNavItems(role: DashboardRole, t: ReturnType<typeof useI18n>['t']): NavItem[] {
  if (role === 'admin') {
    return [
      { href: PATHS.adminDashboard, label: t.admin.dashboard, icon: LayoutDashboard },
      { href: PATHS.adminUsers, label: t.admin.users, icon: Users },
      { href: PATHS.adminOffices, label: t.admin.offices, icon: Building2 },
      { href: PATHS.adminProperties, label: t.admin.properties, icon: Home },
      { href: PATHS.adminApplications, label: t.admin.applications, icon: FileText },
    ];
  }

  return [
    { href: PATHS.officeDashboard, label: t.office.dashboard, icon: LayoutDashboard },
    { href: PATHS.officeProperties, label: t.office.myProperties, icon: Home },
    { href: PATHS.officeProfile, label: t.office.officeName, icon: Building2 },
    { href: PATHS.officeSettings, label: t.nav.account, icon: Settings },
  ];
}

interface Props {
  role: DashboardRole;
}

export function DashboardLayout({ role }: Props) {
  const { t } = useI18n();
  const { profile, logout } = useAuth();
  const location = useLocation();
  const navItems = useNavItems(role, t);

  const initials = profile?.name?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-e border-border/60 bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <Logo compact />
          <div>
            <p className="text-xs font-semibold text-sidebar-foreground">{t.common.appName}</p>
            <p className="flex items-center gap-1 text-[10px] text-sidebar-foreground/60">
              {role === 'admin' ? (
                <>
                  <ShieldCheck className="h-3 w-3" />
                  {t.admin.dashboard}
                </>
              ) : (
                <>
                  <Building2 className="h-3 w-3" />
                  {t.office.dashboard}
                </>
              )}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
          {navItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-sidebar-border p-3">
          <Link
            to={PATHS.home}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent"
          >
            <Home className="h-4 w-4" />
            {t.nav.home}
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            {t.nav.logout}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur md:px-6">
          <h1 className="hidden text-sm font-semibold text-muted-foreground lg:block">
            {navItems.find((n) => n.href === location.pathname)?.label ?? ''}
          </h1>
          <Logo className="lg:hidden" />

          <div className="ms-auto flex items-center gap-3">
            <LanguageSwitcher />
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-end sm:block">
                <p className="text-xs font-medium leading-none">
                  {profile?.name || profile?.email}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {profile?.role ? t.roles[profile.role] : ''}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
