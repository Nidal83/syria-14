import { Heart } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

export default function FavoritesPage() {
  const { t } = useI18n();
  return (
    <div className="container py-10">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <Heart className="h-6 w-6 text-primary" />
        {t.pages.favorites}
      </h1>
      <p className="text-muted-foreground">{t.property.noProperties}</p>
    </div>
  );
}
