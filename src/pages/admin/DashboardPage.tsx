import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, Building2, Home, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';

function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [users, offices, properties, pending] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('offices').select('id', { count: 'exact', head: true }),
        supabase.from('properties').select('id', { count: 'exact', head: true }),
        supabase
          .from('office_applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending_review'),
      ]);
      return {
        users: users.count ?? 0,
        offices: offices.count ?? 0,
        properties: properties.count ?? 0,
        pending: pending.count ?? 0,
      };
    },
    staleTime: 1000 * 30,
  });
}

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const { data: stats } = useAdminStats();

  const cards = [
    { label: t.admin.totalUsers, value: stats?.users, icon: Users, href: PATHS.adminUsers },
    {
      label: t.admin.totalOffices,
      value: stats?.offices,
      icon: Building2,
      href: PATHS.adminOffices,
    },
    {
      label: t.admin.totalProperties,
      value: stats?.properties,
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.admin.dashboard}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, href }) => (
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
    </div>
  );
}
