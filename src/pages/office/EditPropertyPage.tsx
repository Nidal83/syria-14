import { useParams } from 'react-router-dom';
import { useI18n } from '@/lib/i18n/context';

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t.property.editProperty}</h1>
      <p className="text-muted-foreground">ID: {id}</p>
    </div>
  );
}
