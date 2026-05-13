import { useI18n } from '@/lib/i18n/context';

export default function AdminApplicationsPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t.admin.applications}</h1>
      <p className="text-muted-foreground">{t.common.loading}</p>
    </div>
  );
}
