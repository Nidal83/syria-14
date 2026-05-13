import { useI18n } from '@/lib/i18n/context';

export default function PropertiesPage() {
  const { t } = useI18n();
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold">{t.pages.properties}</h1>
      <p className="mt-2 text-muted-foreground">{t.property.noProperties}</p>
    </div>
  );
}
