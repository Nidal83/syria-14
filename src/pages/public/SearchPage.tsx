import { useI18n } from '@/lib/i18n/context';

export default function SearchPage() {
  const { t } = useI18n();
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold">{t.pages.search}</h1>
    </div>
  );
}
