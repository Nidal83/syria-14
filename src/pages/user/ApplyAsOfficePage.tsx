import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import { OfficeApplicationForm } from '@/features/office/components/OfficeApplicationForm';
import type { OfficeApplication } from '@/types/office.types';

export default function ApplyAsOfficePage() {
  const { t } = useI18n();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [existingApp, setExistingApp] = useState<OfficeApplication | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    // Redirect if already an office or admin
    if (profile.role === 'office' || profile.role === 'admin') {
      navigate(PATHS.officeDashboard, { replace: true });
      return;
    }

    // Check for an existing application
    supabase
      .from('office_applications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingApp(data as OfficeApplication);
          // If pending or approved, redirect to status page
          if (data.status === 'pending_review' || data.status === 'approved') {
            navigate(PATHS.officeApplicationStatus, { replace: true });
            return;
          }
        }
        setChecking(false);
      });
  }, [profile, navigate]);

  if (checking) return null;

  const isReapply = existingApp?.status === 'rejected';

  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t.office.applyAsOffice}</h1>
        </div>
      </div>

      {isReapply && existingApp.rejection_reason && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            <span className="font-semibold">{t.office.rejectionReason}:</span>{' '}
            {existingApp.rejection_reason}
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">
            {isReapply ? t.office.reapply : t.office.applyAsOffice}
          </CardTitle>
          <CardDescription>
            {t.office.applicationPending.replace('قيد المراجعة', '').trim()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OfficeApplicationForm prefill={isReapply ? existingApp : undefined} />
        </CardContent>
      </Card>
    </div>
  );
}
