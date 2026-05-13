import { Link } from 'react-router-dom';
import { Home, Plus, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';

export default function OfficeDashboardPage() {
  const { t } = useI18n();
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.office.dashboard}</h1>
          <p className="text-muted-foreground">{profile?.name}</p>
        </div>
        <Button asChild>
          <Link to={PATHS.officeNewProperty}>
            <Plus className="me-2 h-4 w-4" />
            {t.property.addProperty}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: t.property.properties, value: '0', icon: Home, href: PATHS.officeProperties },
          {
            label: t.property.statuses.active,
            value: '0',
            icon: Home,
            href: PATHS.officeProperties,
          },
          {
            label: t.property.statuses.pending,
            value: '0',
            icon: Home,
            href: PATHS.officeProperties,
          },
        ].map(({ label, value, icon: Icon, href }) => (
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
