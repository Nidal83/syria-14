import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, Building2, Home, FileText, EyeOff, Archive, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';

function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [
        users,
        activeOffices,
        activeProperties,
        pending,
        hiddenOffices,
        archivedProperties,
        deactivatedUsers,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase
          .from('offices')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved'),
        supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('office_applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending_review'),
        // .filter() bypasses enum type-checking for 'hidden' — remove this cast
        // after regenerating TS types following migration 20260618100000.
        supabase
          .from('offices')
          .select('id', { count: 'exact', head: true })
          .filter('status', 'eq', 'hidden'),
        supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .filter('status', 'eq', 'archived'),
        // .filter() bypasses bool type-checking for is_active — remove after types regen.
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .filter('is_active', 'eq', 'false'),
      ]);

      return {
        users: users.count ?? 0,
        activeOffices: activeOffices.count ?? 0,
        activeProperties: activeProperties.count ?? 0,
        pending: pending.count ?? 0,
        hiddenOffices: hiddenOffices.count ?? 0,
        archivedProperties: archivedProperties.count ?? 0,
        deactivatedUsers: deactivatedUsers.count ?? 0,
      };
    },
    staleTime: 1000 * 30,
  });
}

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const { data: stats } = useAdminStats();

  const primaryCards = [
    { label: t.admin.totalUsers, value: stats?.users, icon: Users, href: PATHS.adminUsers },
    {
      label: t.admin.activeOffices,
      value: stats?.activeOffices,
      icon: Building2,
      href: PATHS.adminOffices,
    },
    {
      label: t.admin.activeProperties,
      value: stats?.activeProperties,
      icon: Home,
      href: PATHS.adminProperties,
    },
    {
      label: t.admin.pendingReview,
      value: stats?.pending,
      icon: FileText,
      href: PATHS.adminApplications,
    },
  ];

  const alertCards = [
    {
      label: t.admin.hiddenOffices,
      value: stats?.hiddenOffices,
      icon: EyeOff,
      href: PATHS.adminOffices,
      alert: (stats?.hiddenOffices ?? 0) > 0,
    },
    {
      label: t.admin.archivedProperties,
      value: stats?.archivedProperties,
      icon: Archive,
      href: PATHS.adminProperties,
      alert: (stats?.archivedProperties ?? 0) > 0,
    },
    {
      label: t.admin.deactivatedUsers,
      value: stats?.deactivatedUsers,
      icon: UserX,
      href: PATHS.adminUsers,
      alert: (stats?.deactivatedUsers ?? 0) > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.admin.dashboard}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {primaryCards.map(({ label, value, icon: Icon, href }) => (
          <Card key={label} className="hover:shadow-card-hover shadow-card transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Icon className="h-4 w-4" />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {value === undefined ? '—' : value.toLocaleString()}
              </p>
              <Link to={href} className="mt-1 text-xs text-primary hover:underline">
                {t.common.view}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {alertCards.map(({ label, value, icon: Icon, href, alert }) => (
          <Card
            key={label}
            className={`shadow-card transition-all ${alert ? 'hover:shadow-card-hover border-amber-200 bg-amber-50/40' : 'hover:shadow-card-hover'}`}
          >
            <CardHeader className="pb-2">
              <CardTitle
                className={`flex items-center gap-2 text-sm font-medium ${alert ? 'text-amber-700' : 'text-muted-foreground'}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${alert ? 'text-amber-800' : ''}`}>
                {value === undefined ? '—' : value.toLocaleString()}
              </p>
              <Link to={href} className="mt-1 text-xs text-primary hover:underline">
                {t.common.view}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
