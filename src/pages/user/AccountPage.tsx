import { Link } from 'react-router-dom';
import { User, Heart, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import { isOffice, isAdmin, isPendingOffice } from '@/lib/roles';

export default function AccountPage() {
  const { t } = useI18n();
  const { profile } = useAuth();

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="mb-6 text-2xl font-bold">{t.pages.account}</h1>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" /> {t.auth.fullName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t.auth.fullName}</p>
              <p className="font-medium">{profile?.name || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t.auth.email}</p>
              <p className="font-medium">{profile?.email || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t.auth.phone}</p>
              <p className="font-medium">{profile?.phone || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t.roles[profile?.role ?? 'user']}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" asChild>
              <Link to={PATHS.favorites}>
                <Heart className="me-2 h-4 w-4" />
                {t.nav.favorites}
              </Link>
            </Button>
            {!isOffice(profile) && !isAdmin(profile) && !isPendingOffice(profile) && (
              <Button asChild>
                <Link to={PATHS.officeApply}>
                  <Building2 className="me-2 h-4 w-4" />
                  {t.office.applyAsOffice}
                </Link>
              </Button>
            )}
            {isPendingOffice(profile) && (
              <Button variant="outline" asChild>
                <Link to={PATHS.officeApplicationStatus}>{t.office.applicationStatus}</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
