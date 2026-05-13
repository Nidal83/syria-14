import { useParams } from 'react-router-dom';
import { useI18n } from '@/lib/i18n/context';

export default function OfficeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useI18n();
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold">{t.pages.officeDetail}</h1>
      <p className="mt-2 text-muted-foreground">Slug: {slug}</p>
    </div>
  );
}
