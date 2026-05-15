import { Link } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Maximize, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import { cn } from '@/lib/utils';
import type { Property } from '@/types/property.types';

interface Props {
  property: Property;
  isFavorited?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export default function PropertyCard({ property, isFavorited, onToggleFavorite }: Props) {
  const { t, locale } = useI18n();

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    draft: 'bg-gray-100 text-gray-600',
    rejected: 'bg-red-100 text-red-800',
  };

  // Fallback to id if slug is missing so the link is never broken
  const href = PATHS.propertyDetail(property.slug || property.id);

  return (
    <Link
      to={href}
      className="hover:shadow-card-hover group relative block cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-card shadow-card transition-all hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {property.featured_image ? (
          <img
            src={property.featured_image}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/40">
            <Maximize className="h-10 w-10" />
          </div>
        )}
        <Badge
          className={cn('absolute start-3 top-3 text-xs', statusColors[property.status] ?? '')}
        >
          {t.property.statuses[property.status]}
        </Badge>
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(property.id);
            }}
            className="absolute end-3 top-3 rounded-full bg-background/80 p-1.5 backdrop-blur transition-transform hover:scale-110"
            aria-label={t.pages.favorites}
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-colors',
                isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground',
              )}
            />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-1 font-semibold leading-tight">{property.title}</h3>
        {property.city && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            {property.city}
            {property.district ? `, ${property.district}` : ''}
          </p>
        )}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" />
              {property.bedrooms}
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              {property.bathrooms}
            </span>
          )}
          {property.area_size != null && (
            <span className="flex items-center gap-1">
              <Maximize className="h-3.5 w-3.5" />
              {property.area_size} {t.property.sqm}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-base font-bold text-primary">
            {property.price.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US')}{' '}
            {t.property.currency[property.currency as keyof typeof t.property.currency] ??
              property.currency}
          </span>
          <Badge variant="outline" className="text-xs">
            {property.listing_type === 'sale' ? t.property.sale : t.property.rent}
          </Badge>
        </div>
      </div>
    </Link>
  );
}
