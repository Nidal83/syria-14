import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Phone, Mail, MapPin, MessageCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import PropertyCard from '@/components/PropertyCard';
import { Button } from '@/components/ui/button';
import type { Property } from '@/types/property.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OfficeDetail {
  id: string;
  office_name: string;
  slug: string | null;
  phone: string;
  email: string;
  whatsapp: string | null;
  logo_url: string | null;
  description: string | null;
  address: string | null;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

function useOfficeBySlug(slug: string) {
  return useQuery({
    queryKey: ['office-detail', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offices')
        .select('id, office_name, slug, phone, email, whatsapp, logo_url, description, address')
        .eq('slug', slug)
        .eq('status', 'approved')
        .eq('is_active', true)
        .single();
      if (error) throw error;
      return data as OfficeDetail;
    },
    enabled: Boolean(slug),
  });
}

function useOfficeProperties(officeId: string | undefined) {
  return useQuery({
    queryKey: ['office-properties', officeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select(
          'id, title, slug, category, listing_type, price, currency, city, district, area_size, rooms, bathrooms, featured_image, status, created_at',
        )
        .eq('office_id', officeId!)
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
            office_id: officeId ?? '',
          }) as unknown as Property,
      );
    },
    enabled: Boolean(officeId),
  });
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function HeaderSkeleton() {
  return (
    <div className="animate-pulse space-y-4 rounded-2xl border border-border/60 bg-card p-6">
      <div className="flex items-start gap-5">
        <div className="h-20 w-20 shrink-0 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-4 w-72 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-border/40 bg-card">
          <div className="h-48 rounded-t-xl bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfficeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useI18n();

  const {
    data: office,
    isLoading: officeLoading,
    isError: officeError,
  } = useOfficeBySlug(slug ?? '');
  const { data: properties = [], isLoading: propsLoading } = useOfficeProperties(office?.id);

  if (officeError) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg text-muted-foreground">{t.errors.generic}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={PATHS.offices}>{t.common.back}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container space-y-8 py-8">
      {/* Back link */}
      <Link
        to={PATHS.offices}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.pages.offices}
      </Link>

      {/* ── Office header ── */}
      {officeLoading ? (
        <HeaderSkeleton />
      ) : office ? (
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {/* Logo */}
            <div className="shrink-0">
              {office.logo_url ? (
                <img
                  src={office.logo_url}
                  alt={office.office_name}
                  className="h-20 w-20 rounded-full border-2 border-border object-cover shadow"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Building2 className="h-10 w-10 text-primary/60" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <h1 className="text-2xl font-bold leading-tight">{office.office_name}</h1>

              {office.description && (
                <p className="max-w-2xl text-sm text-muted-foreground">{office.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm">
                {office.phone && (
                  <a
                    href={`tel:${office.phone}`}
                    dir="ltr"
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    {office.phone}
                  </a>
                )}
                {office.whatsapp && (
                  <a
                    href={`https://wa.me/${office.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    dir="ltr"
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-green-600"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" />
                    {office.whatsapp}
                  </a>
                )}
                {office.email && (
                  <a
                    href={`mailto:${office.email}`}
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    {office.email}
                  </a>
                )}
                {office.address && (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {office.address}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Properties section ── */}
      {office && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">
              {t.office.propertiesBy} {office.office_name}
            </h2>
            {!propsLoading && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {properties.length} {t.property.properties}
              </p>
            )}
          </div>

          {propsLoading ? (
            <CardsSkeleton />
          ) : properties.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 py-16 text-center">
              <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{t.office.noOfficeProperties}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
