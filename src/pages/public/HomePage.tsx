import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SearchBox from '@/components/SearchBox';
import PropertySection from '@/components/PropertySection';
import PropertyCard from '@/components/PropertyCard';
import { HeroCarousel } from '@/components/HeroCarousel';
import { BlogSection } from '@/components/blog/BlogSection';
import { useI18n } from '@/lib/i18n/context';
import { supabase } from '@/integrations/supabase/client';
import { PATHS } from '@/routes/paths';
import type { Property } from '@/types/property.types';

async function fetchLatestProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select(
      'id, title, slug, category, listing_type, price, currency, city, district, area_size, rooms, bathrooms, featured_image, status, created_at',
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(8);
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
}

function useFeaturedProperties() {
  return useQuery({
    queryKey: ['featured-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select(
          'id, title, slug, category, listing_type, price, currency, city, district, area_size, rooms, bathrooms, featured_image, status, created_at',
        )
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3);
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

export default function HomePage() {
  const { t } = useI18n();
  const { data: featuredProperties = [] } = useFeaturedProperties();

  return (
    <div className="flex flex-col bg-[#f5f3ef]">
      {/* ── Hero carousel ── */}
      <HeroCarousel />

      {/* ── Search bar below the carousel ── */}
      <div className="px-4 pb-10 pt-0 md:px-8">
        <div className="mx-auto max-w-4xl">
          <SearchBox />
        </div>
      </div>

      {/* ── Featured Properties ── */}
      <section className="container py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t.home.featured.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.home.featured.subtitle}</p>
          </div>
          <Link to={PATHS.search} className="text-sm font-medium text-primary hover:underline">
            {t.home.featured.view_all}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {featuredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      {/* ── Latest Properties ── */}
      <PropertySection
        title={t.pages.latestProperties}
        queryKey="latest-properties"
        queryFn={fetchLatestProperties}
        viewAllHref={PATHS.properties}
      />

      {/* ── Blog section — directly above footer ── */}
      <BlogSection />
    </div>
  );
}
