import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/providers/AuthProvider';
import { useFavoritePropertyIds, useToggleFavoriteProperty } from '@/lib/hooks/useFavorites';
import SearchBox from '@/components/SearchBox';
import PropertyCard from '@/components/PropertyCard';
import type { Property } from '@/types/property.types';

function useAllProperties() {
  return useQuery({
    queryKey: ['all-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select(
          'id, title, slug, category, listing_type, price, currency, city, district, area_size, rooms, bathrooms, featured_image, status, furnished, created_at',
        )
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(
        (p) =>
          ({
            ...p,
            bedrooms: p.rooms,
            description: '',
            amenities: [],
            address: null,
            latitude: null,
            longitude: null,
            rejection_reason: null,
            whatsapp: null,
            meta_title: null,
            meta_description: null,
            updated_at: p.created_at,
            office_id: '',
          }) as unknown as Property,
      );
    },
  });
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-border/40 bg-card">
          <div className="aspect-[16/10] rounded-t-xl bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
            <div className="h-5 w-1/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PropertiesPage() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const { data: properties = [], isLoading, isError } = useAllProperties();
  const { data: favoriteIds = new Set<string>() } = useFavoritePropertyIds();
  const toggleFavorite = useToggleFavoriteProperty();

  return (
    <div className="container space-y-6 py-6">
      <SearchBox compact className="shadow-card" />

      <div className="space-y-1">
        <h1 className="text-xl font-bold">{t.pages.properties}</h1>
        {!isLoading && !isError && (
          <p className="text-sm text-muted-foreground">
            {properties.length} {t.property.properties}
          </p>
        )}
      </div>

      {isLoading && <SkeletonGrid />}

      {isError && <p className="py-16 text-center text-destructive">{t.errors.generic}</p>}

      {!isLoading && !isError && properties.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">{t.property.noProperties}</p>
      )}

      {!isLoading && !isError && properties.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isFavorited={favoriteIds.has(property.id)}
              onToggleFavorite={
                isAuthenticated
                  ? (id) =>
                      toggleFavorite.mutate({ propertyId: id, isFavorited: favoriteIds.has(id) })
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
