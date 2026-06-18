import { Outlet, Link, useLocation } from 'react-router-dom';
import { MAIN_CONTENT_ID } from '@/lib/a11y';
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
  CalendarCheck,
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { useOfficeBookings } from '@/features/bookings/hooks/useOfficeBookings';
import { cn } from '@/lib/utils';

type DashboardRole = 'office' | 'admin';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

function useNavItems(
  role: DashboardRole,
  t: ReturnType<typeof useI18n>['t'],
  pendingBookings: number,
): NavItem[] {
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
    {
      href: PATHS.officeBookings,
      label: t.bookings.title,
      icon: CalendarCheck,
      badge: pendingBookings || undefined,
    },
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
  const { data: bookings } = useOfficeBookings({ enabled: role === 'office' });
  const pendingBookings = bookings?.filter((b) => b.status === 'pending').length ?? 0;
  const navItems = useNavItems(role, t, pendingBookings);

  const initials = profile?.name?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <div className="flex min-h-screen">
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:shadow-md focus:outline-none"
      >
        {t.common.skipToContent}
      </a>
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-e border-border/60 bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <Logo size="sm" />
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
                {item.badge ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">
                    {item.badge}
                  </span>
                ) : null}
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

          <div className="ms-auto flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <NotificationBell />
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden min-w-0 flex-col items-start gap-0.5 sm:flex">
                <p className="max-w-[140px] truncate text-xs font-semibold leading-none text-foreground">
                  {profile?.name || profile?.email}
                </p>
                {profile?.role && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'h-4 px-1.5 text-[10px] font-medium',
                      role === 'admin'
                        ? 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300',
                    )}
                  >
                    {t.roles[profile.role]}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id={MAIN_CONTENT_ID} className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
