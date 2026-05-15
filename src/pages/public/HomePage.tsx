import SearchBox from '@/components/SearchBox';
import PropertySection from '@/components/PropertySection';
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
  return (data ?? []).map((p) => ({
    ...p,
    bedrooms: p.rooms,
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
  })) as Property[];
}

export default function HomePage() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative flex min-h-[82vh] flex-col items-center justify-center overflow-hidden">
        {/* Layered backgrounds: real photo first, SVG cityscape as fallback */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/hero-damascus.png'), url('/hero-syria.svg')`,
          }}
        />

        {/* Dark gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/65" />
        {/* Warm gold tint at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2d1400]/55 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative z-10 w-full px-4 pb-16 pt-8">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white drop-shadow-xl sm:text-4xl lg:text-5xl xl:text-6xl">
              {t.search.heroTitle}
            </h1>
            <p className="mt-4 text-base text-white/80 drop-shadow-md sm:text-lg lg:text-xl">
              {t.search.heroSubtitle}
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <SearchBox />
          </div>
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
