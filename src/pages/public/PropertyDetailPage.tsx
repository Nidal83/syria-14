import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Heart,
  Share2,
  Maximize,
  BedDouble,
  Bath,
  ChevronLeft,
  ChevronRight,
  Building2,
  ArrowLeft,
  ArrowRight,
  Layers,
  Calendar,
  Sofa,
  Home,
  CookingPot,
  Armchair,
  Compass,
  Eye,
  FileText,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/providers/AuthProvider';
import { useFavoritePropertyIds, useToggleFavoriteProperty } from '@/lib/hooks/useFavorites';
import PropertyCard from '@/components/PropertyCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PATHS } from '@/routes/paths';
import { cn } from '@/lib/utils';
import type { Property } from '@/types/property.types';

// ─── Local DB-aligned type ────────────────────────────────────────────────────

interface OfficeInfo {
  id: string;
  office_name: string;
  slug: string | null;
  email: string;
  phone: string;
  logo_url: string | null;
  description: string;
}

interface PropertyDetail {
  id: string;
  title: string;
  slug: string | null;
  description: string;
  category: string;
  listing_type: 'sale' | 'rent';
  price: number;
  currency: string;
  city: string;
  district: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  area_size: number;
  rooms: number;
  bathrooms: number;
  kitchens: number;
  living_rooms: number;
  floor: number;
  total_floors: number;
  building_age: number;
  furnished: boolean;
  direction: string;
  view: string;
  property_type: string;
  ownership_type: string;
  payment_method: string;
  features: string[];
  featured_image: string | null;
  status: string;
  contact_phone: string;
  whatsapp: string;
  office_id: string;
  offices: OfficeInfo | null;
  property_images: { id: string; image_url: string; is_cover: boolean }[];
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

const UUID_RE = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

async function fetchPropertyBySlug(slug: string): Promise<PropertyDetail | null> {
  const col = UUID_RE.test(slug) ? 'id' : 'slug';
  const { data, error } = await supabase
    .from('properties')
    .select(
      `*, offices (id, office_name, slug, email, phone, logo_url, description),
       property_images (id, image_url, is_cover)`,
    )
    .eq(col, slug)
    .maybeSingle();
  if (error) throw error;
  return data as PropertyDetail | null;
}

// ─── Spec item ────────────────────────────────────────────────────────────────

function SpecItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-muted/30 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PropertyDetailSkeleton() {
  return (
    <div className="container animate-pulse py-6">
      <div className="mb-6 h-[380px] rounded-2xl bg-muted sm:h-[480px]" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className="h-8 w-3/4 rounded-lg bg-muted" />
          <div className="h-5 w-1/2 rounded-lg bg-muted" />
          <div className="h-24 w-full rounded-lg bg-muted" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <div className="h-48 rounded-2xl bg-muted" />
          <div className="h-32 rounded-2xl bg-muted" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PropertyDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, locale } = useI18n();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [currentImg, setCurrentImg] = useState(0);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', slug],
    queryFn: () => fetchPropertyBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 1000 * 60,
  });

  const { data: related = [] } = useQuery({
    queryKey: ['related-properties', property?.id],
    queryFn: async () => {
      if (!property) return [];
      const { data } = await supabase
        .from('properties')
        .select(
          'id, title, slug, price, currency, city, district, listing_type, category, featured_image, area_size, rooms, bathrooms, status, contact_phone, whatsapp',
        )
        .eq('status', 'active')
        .eq('city', property.city)
        .neq('id', property.id)
        .limit(4);
      return (data ?? []).map((p) => ({ ...p, bedrooms: p.rooms })) as unknown as Property[];
    },
    enabled: Boolean(property),
    staleTime: 1000 * 60 * 5,
  });

  const { data: favIds = new Set<string>() } = useFavoritePropertyIds();
  const toggleFav = useToggleFavoriteProperty();

  const isFav = property ? favIds.has(property.id) : false;

  // Build image list: featured first, then additional
  const images: string[] = property
    ? [
        ...(property.featured_image ? [property.featured_image] : []),
        ...property.property_images
          .map((i) => i.image_url)
          .filter((u) => u !== property.featured_image),
      ]
    : [];

  function prevImg() {
    setCurrentImg((v) => (v === 0 ? images.length - 1 : v - 1));
  }
  function nextImg() {
    setCurrentImg((v) => (v === images.length - 1 ? 0 : v + 1));
  }

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title: property?.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(t.property.linkCopied);
      }
    } catch {
      // user cancelled share
    }
  }

  useEffect(() => {
    if (property?.title) document.title = `${property.title} — Syria 14`;
    return () => {
      document.title = 'Syria 14';
    };
  }, [property?.title]);

  if (isLoading) return <PropertyDetailSkeleton />;

  if (!property) {
    return (
      <div className="container flex flex-col items-center py-24 text-center">
        <Home className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <h1 className="mb-2 text-xl font-bold">{t.pages.notFound}</h1>
        <p className="mb-6 text-muted-foreground">{t.pages.notFoundDesc}</p>
        <Button onClick={() => navigate(PATHS.properties)}>{t.common.back}</Button>
      </div>
    );
  }

  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft;
  const PrevIcon = locale === 'ar' ? ChevronRight : ChevronLeft;
  const NextIcon = locale === 'ar' ? ChevronLeft : ChevronRight;

  const phone = property.contact_phone || '';
  const waPhone = (property.whatsapp || phone).replace(/[\s\-+()]/g, '');
  const waUrl = `https://wa.me/${waPhone}`;

  const specRows = [
    property.area_size > 0 && {
      icon: Maximize,
      label: t.property.area,
      value: `${property.area_size} ${t.property.sqm}`,
    },
    property.rooms > 0 && { icon: BedDouble, label: t.property.rooms, value: property.rooms },
    property.bathrooms > 0 && {
      icon: Bath,
      label: t.property.bathrooms,
      value: property.bathrooms,
    },
    property.kitchens > 0 && {
      icon: CookingPot,
      label: t.property.kitchens,
      value: property.kitchens,
    },
    property.living_rooms > 0 && {
      icon: Armchair,
      label: t.property.livingRooms,
      value: property.living_rooms,
    },
    property.floor > 0 && {
      icon: Layers,
      label: t.property.floor,
      value:
        property.total_floors > 0 ? `${property.floor} / ${property.total_floors}` : property.floor,
    },
    property.building_age > 0 && {
      icon: Calendar,
      label: t.property.buildingAge,
      value: `${property.building_age} ${t.property.years}`,
    },
    {
      icon: Sofa,
      label: t.property.furnished,
      value: property.furnished ? t.property.furnished : t.property.unfurnished,
    },
    property.direction && {
      icon: Compass,
      label: t.property.direction,
      value: property.direction,
    },
    property.view && { icon: Eye, label: t.property.view, value: property.view },
    property.ownership_type && {
      icon: FileText,
      label: t.property.ownershipType,
      value: property.ownership_type,
    },
    property.payment_method && {
      icon: CreditCard,
      label: t.property.paymentMethod,
      value: property.payment_method,
    },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: React.ReactNode }[];

  return (
    <div className="pb-24 md:pb-0">
      <div className="container py-4">
        {/* ── Breadcrumb ── */}
        <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 hover:text-primary"
          >
            <BackIcon className="h-4 w-4" />
            {t.common.back}
          </button>
          <span>/</span>
          <Link to={PATHS.properties} className="hover:text-primary">
            {t.nav.properties}
          </Link>
          <span>/</span>
          <span className="line-clamp-1 max-w-[200px] text-foreground">{property.title}</span>
        </nav>

        {/* ── Image gallery ── */}
        <div className="mb-6 overflow-hidden rounded-2xl">
          {images.length > 0 ? (
            <div className="relative">
              <div className="relative aspect-video overflow-hidden bg-muted">
                <img
                  key={currentImg}
                  src={images[currentImg]}
                  alt={property.title}
                  className="h-full w-full object-cover transition-opacity duration-300"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImg}
                      className="absolute start-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/60"
                    >
                      <PrevIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImg}
                      className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/60"
                    >
                      <NextIcon className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 start-1/2 flex -translate-x-1/2 gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImg(i)}
                          className={cn(
                            'h-1.5 rounded-full transition-all',
                            i === currentImg ? 'w-5 bg-white' : 'w-1.5 bg-white/50',
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto bg-muted/30 p-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImg(i)}
                      className={cn(
                        'h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                        i === currentImg ? 'border-primary' : 'border-transparent opacity-60',
                      )}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-2xl bg-muted">
              <Home className="h-20 w-20 text-muted-foreground/20" />
            </div>
          )}
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left — main content */}
          <div className="space-y-8 lg:col-span-8">
            {/* Title + badges + price */}
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {property.listing_type === 'sale' ? t.property.sale : t.property.rent}
                </Badge>
                <Badge className="bg-muted text-xs text-foreground">
                  {t.property.categories[property.category as keyof typeof t.property.categories] ??
                    property.category}
                </Badge>
              </div>
              <h1 className="mb-3 text-2xl font-bold leading-snug sm:text-3xl">{property.title}</h1>
              <p className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                {[property.city, property.district, property.address].filter(Boolean).join(', ')}
              </p>
              <p className="text-3xl font-extrabold text-primary">
                {property.price.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US')}{' '}
                <span className="text-lg font-semibold">
                  {t.property.currency[property.currency as keyof typeof t.property.currency] ??
                    property.currency}
                </span>
              </p>
            </div>

            <Separator />

            {/* Description */}
            {property.description && (
              <div>
                <h2 className="mb-3 text-lg font-bold">{t.property.description}</h2>
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {property.description}
                </p>
              </div>
            )}

            {/* Specifications */}
            {specRows.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-bold">{t.property.specifications}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {specRows.map(({ icon, label, value }, i) => (
                    <SpecItem key={i} icon={icon} label={label} value={value} />
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            {property.features?.length > 0 && (
              <div>
                <h2 className="mb-3 text-lg font-bold">{t.property.features}</h2>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((f) => (
                    <span
                      key={f}
                      className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-sm text-primary"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {property.latitude && property.longitude && (
              <div>
                <h2 className="mb-3 text-lg font-bold">{t.property.address}</h2>
                <div className="overflow-hidden rounded-xl border border-border/60">
                  <iframe
                    title="map"
                    className="h-64 w-full"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${property.longitude - 0.01},${property.latitude - 0.01},${property.longitude + 0.01},${property.latitude + 0.01}&layer=mapnik&marker=${property.latitude},${property.longitude}`}
                  />
                </div>
                <a
                  href={`https://maps.google.com/?q=${property.latitude},${property.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Google Maps
                </a>
              </div>
            )}
          </div>

          {/* Right — sticky sidebar */}
          <div className="lg:col-span-4">
            <div className="space-y-4 lg:sticky lg:top-20">
              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate(PATHS.login);
                      return;
                    }
                    toggleFav.mutate({ propertyId: property.id, isFavorited: isFav });
                  }}
                >
                  <Heart
                    className={cn(
                      'h-4 w-4',
                      isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground',
                    )}
                  />
                  {t.pages.favorites}
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                  {t.property.shareProperty ?? 'Share'}
                </Button>
              </div>

              {/* Contact card */}
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
                <p className="mb-1 text-xs text-muted-foreground">{t.property.price}</p>
                <p className="mb-4 text-2xl font-extrabold text-primary">
                  {property.price.toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US')}{' '}
                  {t.property.currency[property.currency as keyof typeof t.property.currency] ??
                    property.currency}
                </p>
                <div className="space-y-2">
                  {waPhone && (
                    <Button asChild className="w-full gap-2 bg-[#25D366] hover:bg-[#1ebe57]">
                      <a href={waUrl} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4" />
                        {t.property.whatsapp}
                      </a>
                    </Button>
                  )}
                  {phone && (
                    <Button asChild variant="outline" className="w-full gap-2">
                      <a href={`tel:${phone}`}>
                        <Phone className="h-4 w-4" />
                        {t.property.callNow}
                      </a>
                    </Button>
                  )}
                  {property.offices?.email && (
                    <Button asChild variant="outline" className="w-full gap-2">
                      <a href={`mailto:${property.offices.email}`}>
                        <Mail className="h-4 w-4" />
                        {t.property.emailContact}
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Office card */}
              {property.offices && (
                <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
                  <div className="flex items-center gap-3">
                    {property.offices.logo_url ? (
                      <img
                        src={property.offices.logo_url}
                        alt={property.offices.office_name}
                        className="h-12 w-12 rounded-xl border border-border/60 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary/60" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{property.offices.office_name}</p>
                      {property.offices.phone && (
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          {property.offices.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  {property.offices.description && (
                    <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                      {property.offices.description}
                    </p>
                  )}
                  {property.offices.slug && (
                    <Link
                      to={PATHS.officeDetail(property.offices.slug)}
                      className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      {t.property.contactOffice}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Related properties ── */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-5 text-xl font-bold">{t.property.relatedProperties}</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile sticky contact bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/95 p-3 backdrop-blur md:hidden">
        <div className="flex gap-2">
          {waPhone && (
            <Button asChild className="flex-1 gap-1.5 bg-[#25D366] hover:bg-[#1ebe57]" size="sm">
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                {t.property.whatsapp}
              </a>
            </Button>
          )}
          {phone && (
            <Button asChild variant="outline" className="flex-1 gap-1.5" size="sm">
              <a href={`tel:${phone}`}>
                <Phone className="h-4 w-4" />
                {t.property.callNow}
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
