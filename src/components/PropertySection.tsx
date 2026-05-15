import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/providers/AuthProvider';
import { useFavoritePropertyIds, useToggleFavoriteProperty } from '@/lib/hooks/useFavorites';
import PropertyCard from '@/components/PropertyCard';
import type { Property } from '@/types/property.types';

interface PropertySectionProps {
  title: string;
  queryKey: string;
  queryFn: () => Promise<Property[]>;
  viewAllHref?: string;
}

export default function PropertySection({
  title,
  queryKey,
  queryFn,
  viewAllHref,
}: PropertySectionProps) {
  const { t, locale } = useI18n();
  const { isAuthenticated } = useAuth();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn,
    staleTime: 1000 * 60,
  });

  const { data: favIds = new Set<string>() } = useFavoritePropertyIds();
  const toggleFav = useToggleFavoriteProperty();

  const handleToggleFavorite = (propertyId: string) => {
    if (!isAuthenticated) return;
    toggleFav.mutate({ propertyId, isFavorited: favIds.has(propertyId) });
  };

  if (!isLoading && properties.length === 0) return null;

  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <section className="py-10">
      <div className="container">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
          {viewAllHref && (
            <Link
              to={viewAllHref}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t.common.viewAll}
              <ArrowIcon className="h-4 w-4" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[320px] animate-pulse rounded-xl border border-border/40 bg-muted"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                isFavorited={favIds.has(property.id)}
                onToggleFavorite={isAuthenticated ? handleToggleFavorite : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
