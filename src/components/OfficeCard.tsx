import { Link } from 'react-router-dom';
import { MapPin, Phone, Building2, Heart } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import { cn } from '@/lib/utils';

interface OfficeRow {
  id: string;
  office_name: string;
  slug: string | null;
  email: string;
  phone: string;
  logo_url: string | null;
  description: string;
  status: string;
}

interface Props {
  office: OfficeRow;
  isFavorited?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export default function OfficeCard({ office, isFavorited, onToggleFavorite }: Props) {
  const { t } = useI18n();

  return (
    <div className="hover:shadow-card-hover group relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-card transition-all hover:-translate-y-0.5">
      {/* Logo / header */}
      <div className="relative flex h-28 items-center justify-center bg-muted/50 px-4">
        {office.logo_url ? (
          <img
            src={office.logo_url}
            alt={office.office_name}
            className="h-16 w-16 rounded-full border-2 border-background object-cover shadow"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-8 w-8 text-primary/60" />
          </div>
        )}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite(office.id);
            }}
            className="absolute end-3 top-3 rounded-full bg-background/80 p-1.5 backdrop-blur"
            aria-label={t.pages.favorites}
          >
            <Heart
              className={cn(
                'h-4 w-4',
                isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground',
              )}
            />
          </button>
        )}
      </div>

      {/* Info */}
      <Link
        to={office.slug ? PATHS.officeDetail(office.slug) : '#'}
        className="block space-y-2 p-4"
      >
        <h3 className="line-clamp-1 font-semibold leading-tight">{office.office_name}</h3>
        {office.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{office.description}</p>
        )}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {office.phone && (
            <span className="flex items-center gap-1" dir="ltr">
              <Phone className="h-3 w-3 shrink-0" />
              {office.phone}
            </span>
          )}
          {office.email && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {office.email}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
