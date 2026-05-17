import { Link } from 'react-router-dom';
import { Eye, EyeOff, Pencil, ExternalLink, BedDouble, Bath, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import { cn } from '@/lib/utils';
import { PropertyStatusBadge } from './PropertyStatusBadge';
import type { OfficeProperty } from '../api/properties.service';

interface Props {
  property: OfficeProperty;
  onToggle: (id: string, newStatus: 'active' | 'hidden') => void;
  isToggling: boolean;
}

export function OfficePropertyCard({ property, onToggle, isToggling }: Props) {
  const { t, locale } = useI18n();

  const coverUrl =
    property.featured_image ??
    property.property_images.find((img) => img.is_cover)?.image_url ??
    property.property_images[0]?.image_url;

  const govName = property.governorates
    ? locale === 'ar'
      ? property.governorates.name_ar
      : property.governorates.name_en
    : null;

  const areaName = property.areas
    ? locale === 'ar'
      ? property.areas.name_ar
      : property.areas.name_en
    : null;

  const location = [govName, areaName].filter(Boolean).join(' — ');

  const priceFormatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-SY' : 'en-US').format(
    property.price,
  );

  const dateFormatted = new Date(property.created_at).toLocaleDateString(
    locale === 'ar' ? 'ar-SY' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' },
  );

  const isActive = property.status === 'active';

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      {/* Cover image */}
      <div className="relative h-44 w-full overflow-hidden bg-muted">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={property.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            {t.property.images}
          </div>
        )}
        <div className="absolute end-2 top-2">
          <PropertyStatusBadge status={property.status} />
        </div>
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <p className="mb-1 line-clamp-1 font-semibold">{property.title}</p>

        {/* Price */}
        <p className="mb-1 text-sm font-medium text-primary">
          {priceFormatted}{' '}
          <span className="font-normal text-muted-foreground">{property.currency}</span>
        </p>

        {/* Location */}
        {location && <p className="mb-2 truncate text-xs text-muted-foreground">{location}</p>}

        {/* Specs */}
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {property.rooms > 0 && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" />
              {property.rooms}
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              {property.bathrooms}
            </span>
          )}
          {property.area_size > 0 && (
            <span className="flex items-center gap-1">
              <Maximize2 className="h-3.5 w-3.5" />
              {property.area_size} {t.property.sqm}
            </span>
          )}
        </div>

        {/* Date */}
        <p className="mb-3 text-[11px] text-muted-foreground">{dateFormatted}</p>

        {/* Actions */}
        <div className={cn('flex flex-wrap gap-2', locale === 'ar' ? 'flex-row-reverse' : '')}>
          {/* Hide / Show toggle */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
            disabled={isToggling}
            onClick={() => onToggle(property.id, isActive ? 'hidden' : 'active')}
          >
            {isActive ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                {t.property.actions.hide}
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                {t.property.actions.show}
              </>
            )}
          </Button>

          {/* Edit */}
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" asChild>
            <Link to={PATHS.officeEditProperty(property.id)}>
              <Pencil className="h-3.5 w-3.5" />
              {t.common.edit}
            </Link>
          </Button>

          {/* View public page */}
          <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs" asChild>
            <Link to={`/property/${property.id}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              {t.property.actions.viewPublic}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
