import { Link } from 'react-router-dom';
import { Users, Building2, Home, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';

export default function AdminDashboardPage() {
  const { t } = useI18n();

  const stats = [
    { label: t.admin.totalUsers, value: '—', icon: Users, href: PATHS.adminUsers },
    { label: t.admin.totalOffices, value: '—', icon: Building2, href: PATHS.adminOffices },
    { label: t.admin.totalProperties, value: '—', icon: Home, href: PATHS.adminProperties },
    { label: t.admin.pendingReview, value: '—', icon: FileText, href: PATHS.adminApplications },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.admin.dashboard}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Card key={label} className="hover:shadow-card-hover shadow-card transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Icon className="h-4 w-4" />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
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
