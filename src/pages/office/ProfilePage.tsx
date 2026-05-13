import { useI18n } from '@/lib/i18n/context';

export default function OfficeProfilePage() {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t.office.officeName}</h1>
    </div>
  );
}
