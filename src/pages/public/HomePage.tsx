import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SearchBox from '@/components/SearchBox';
import PropertySection from '@/components/PropertySection';
import PropertyCard from '@/components/PropertyCard';
import { Logo } from '@/components/common/Logo';
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
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative flex min-h-[82vh] flex-col items-center justify-center overflow-hidden">
        {/* Layered backgrounds: real photo first, SVG cityscape as fallback */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/hero-damascus.jpg'), url('/hero-syria.svg')`,
          }}
        />

        {/* Dark gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/65" />
        {/* Warm gold tint at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2d1400]/55 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative z-10 w-full px-4 pb-16 pt-8">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <div className="flex justify-center">
              <Logo variant="light" size="lg" eager />
            </div>
            <p className="mt-4 text-base font-medium uppercase tracking-widest text-[#D8C4A8] drop-shadow-md sm:text-lg">
              {t.common.tagline}
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <SearchBox />
          </div>
        </div>
      </section>

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
    </div>
  );
}
