import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import { useCurrentOffice } from '@/features/offices/hooks/use-current-office';
import { useOfficeProperties } from '@/features/properties/hooks/use-office-properties';
import { useToggleVisibility } from '@/features/properties/hooks/use-toggle-visibility';
import { OfficePropertyCard } from '@/features/properties/components/OfficePropertyCard';
import {
  PropertyFilterTabs,
  type PropertyFilter,
} from '@/features/properties/components/PropertyFilterTabs';

export default function OfficePropertiesPage() {
  const { t } = useI18n();
  const { profile } = useAuth();
  const [filter, setFilter] = useState<PropertyFilter>('all');

  const { data: office, isLoading: officeLoading } = useCurrentOffice(profile?.id);
  const { data: properties = [], isLoading: propsLoading } = useOfficeProperties(office?.id);
  const toggleMutation = useToggleVisibility(office?.id);

  const isLoading = officeLoading || propsLoading;

  const counts = {
    all: properties.length,
    active: properties.filter((p) => p.status === 'active').length,
    hidden: properties.filter((p) => p.status === 'hidden').length,
  };

  const filtered = filter === 'all' ? properties : properties.filter((p) => p.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.office.myProperties}</h1>
        <Button asChild size="sm">
          <Link to={PATHS.officeNewProperty}>
            <Plus className="me-2 h-4 w-4" />
            {t.property.addProperty}
          </Link>
        </Button>
      </div>

      {/* Filter tabs */}
      {!isLoading && properties.length > 0 && (
        <PropertyFilterTabs active={filter} counts={counts} onChange={setFilter} />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border">
              <Skeleton className="h-44 w-full" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && properties.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-20 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="font-medium text-muted-foreground">{t.property.noProperties}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.property.noPropertiesHint}</p>
          </div>
          <Button asChild>
            <Link to={PATHS.officeNewProperty}>
              <Plus className="me-2 h-4 w-4" />
              {t.property.addProperty}
            </Link>
          </Button>
        </div>
      )}

      {/* Filtered empty state */}
      {!isLoading && properties.length > 0 && filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">{t.common.noResults}</p>
      )}

      {/* Property grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((property) => (
            <OfficePropertyCard
              key={property.id}
              property={property}
              onToggle={(id, status) => toggleMutation.mutate({ propertyId: id, status })}
              isToggling={toggleMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
