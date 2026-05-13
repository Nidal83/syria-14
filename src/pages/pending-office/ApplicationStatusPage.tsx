import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import type { OfficeApplication } from '@/types/office.types';

export default function ApplicationStatusPage() {
  const { t } = useI18n();
  const { profile } = useAuth();

  const [application, setApplication] = useState<OfficeApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    supabase
      .from('office_applications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setApplication(data as OfficeApplication | null);
        setLoading(false);
      });
  }, [profile?.id]);

  const status = application?.status ?? 'pending_review';

  const statusConfig = {
    pending_review: {
      icon: <Clock className="h-8 w-8 text-yellow-500" />,
      bg: 'bg-yellow-50',
      label: t.office.applicationPending,
      badgeClass: 'bg-yellow-100 text-yellow-800',
    },
    approved: {
      icon: <CheckCircle2 className="h-8 w-8 text-green-500" />,
      bg: 'bg-green-50',
      label: t.office.applicationApproved,
      badgeClass: 'bg-green-100 text-green-800',
    },
    rejected: {
      icon: <XCircle className="h-8 w-8 text-red-500" />,
      bg: 'bg-red-50',
      label: t.office.applicationRejected,
      badgeClass: 'bg-red-100 text-red-800',
    },
  } as const;

  const config = statusConfig[status];

  if (loading) return null;

  return (
    <div className="container max-w-xl py-16">
      <Card className="text-center shadow-card">
        <CardHeader className="pb-2">
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${config.bg}`}
          >
            {config.icon}
          </div>
          <CardTitle className="text-xl">{t.office.applicationStatus}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Badge className={config.badgeClass}>{config.label}</Badge>

          {application && (
            <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-4 text-start text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                <span className="font-medium">{application.office_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                <span>{profile?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                <span>{application.city}</span>
              </div>
            </div>
          )}

          {status === 'rejected' && application?.rejection_reason && (
            <Alert variant="destructive">
              <AlertDescription>
                <span className="font-semibold">{t.office.rejectionReason}:</span>{' '}
                {application.rejection_reason}
              </AlertDescription>
            </Alert>
          )}

          {status === 'rejected' && (
            <Button asChild className="w-full gap-2">
              <Link to={PATHS.officeApply}>
                <RefreshCw className="h-4 w-4" />
                {t.office.reapply}
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
