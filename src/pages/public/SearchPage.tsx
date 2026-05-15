import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/providers/AuthProvider';
import { useFavoritePropertyIds, useToggleFavoriteProperty } from '@/lib/hooks/useFavorites';
import SearchBox from '@/components/SearchBox';
import PropertyCard from '@/components/PropertyCard';
import type { Property } from '@/types/property.types';

// ─── Query ────────────────────────────────────────────────────────────────────

function useSearchResults(params: URLSearchParams) {
  const key = params.toString();
  return useQuery({
    queryKey: ['search', key],
    queryFn: async () => {
      let q = supabase
        .from('properties')
        .select(
          'id, title, slug, category, listing_type, price, currency, city, district, area_size, rooms, bathrooms, featured_image, status, furnished, created_at',
        )
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const listingType = params.get('listing_type');
      const category = params.get('category');
      const governorateId = params.get('governorate_id');
      const areaId = params.get('area_id');
      const furnished = params.get('furnished');
      const floor = params.get('floor');
      const rooms = params.get('rooms');
      const bathrooms = params.get('bathrooms');
      const minPrice = params.get('min_price');
      const maxPrice = params.get('max_price');
      const minArea = params.get('min_area');
      const maxArea = params.get('max_area');

      if (listingType) q = q.eq('listing_type', listingType as 'rent' | 'sale');
      if (category) q = q.eq('category', category);
      if (governorateId) q = q.eq('governorate_id', governorateId);
      if (areaId) q = q.eq('area_id', areaId);
      if (furnished === 'true') q = q.eq('furnished', true);
      if (furnished === 'false') q = q.eq('furnished', false);
      if (floor) q = q.gte('floor', parseInt(floor, 10));
      if (rooms) q = q.gte('rooms', parseInt(rooms, 10));
      if (bathrooms) q = q.gte('bathrooms', parseInt(bathrooms, 10));
      if (minPrice) q = q.gte('price', parseFloat(minPrice));
      if (maxPrice) q = q.lte('price', parseFloat(maxPrice));
      if (minArea) q = q.gte('area_size', parseFloat(minArea));
      if (maxArea) q = q.lte('area_size', parseFloat(maxArea));

      const { data, error } = await q;
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

// ─── Skeleton grid ────────────────────────────────────────────────────────────

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

// ─── Active filters summary ───────────────────────────────────────────────────

function FilterSummary({ params }: { params: URLSearchParams }) {
  const { t } = useI18n();
  const active: string[] = [];

  const lt = params.get('listing_type');
  const cat = params.get('category');
  const furnished = params.get('furnished');
  const minPrice = params.get('min_price');
  const maxPrice = params.get('max_price');

  if (lt) active.push(lt === 'sale' ? t.property.sale : t.property.rent);
  if (cat) active.push(t.property.categories[cat as keyof typeof t.property.categories] ?? cat);
  if (furnished === 'true') active.push(t.property.furnished);
  if (furnished === 'false') active.push(t.property.unfurnished);
  if (minPrice || maxPrice) {
    const range = [
      minPrice && `${Number(minPrice).toLocaleString()}`,
      maxPrice && `${Number(maxPrice).toLocaleString()}`,
    ]
      .filter(Boolean)
      .join(' — ');
    active.push(range);
  }

  if (active.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
      {active.map((label) => (
        <span
          key={label}
          className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const { data: properties = [], isLoading, isError } = useSearchResults(searchParams);
  const { data: favoriteIds = new Set<string>() } = useFavoritePropertyIds();
  const toggleFavorite = useToggleFavoriteProperty();

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="container space-y-6 py-6">
      {/* Compact search box at top */}
      <SearchBox compact className="shadow-card" />

      {/* Results header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-bold">
            {hasFilters ? t.search.results : t.pages.latestProperties}
          </h1>
          {!isLoading && !isError && (
            <p className="text-sm text-muted-foreground">
              {properties.length} {t.property.properties}
            </p>
          )}
        </div>
        <FilterSummary params={searchParams} />
      </div>

      {/* States */}
      {isLoading && <SkeletonGrid />}

      {isError && <p className="py-16 text-center text-destructive">{t.errors.generic}</p>}

      {!isLoading && !isError && properties.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">{t.search.noResults}</p>
      )}

      {/* Results grid */}
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
