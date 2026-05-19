import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/providers/AuthProvider';
import { useFavoriteOfficeIds, useToggleFavoriteOffice } from '@/lib/hooks/useFavorites';
import OfficeCard from '@/components/OfficeCard';

interface OfficeRow {
  id: string;
  office_name: string;
  slug: string | null;
  email: string;
  phone: string;
  logo_url: string | null;
  description: string;
  status: string;
}

function usePublicOffices() {
  return useQuery({
    queryKey: ['public-offices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offices')
        .select('id, office_name, slug, email, phone, logo_url, description, status')
        .eq('status', 'approved')
        .eq('is_active', true)
        .order('office_name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as OfficeRow[];
    },
  });
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-border/40 bg-card">
          <div className="h-28 rounded-t-xl bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-1/2 rounded bg-muted" />
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OfficesPage() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const { data: offices = [], isLoading, isError } = usePublicOffices();
  const { data: favoriteIds = new Set<string>() } = useFavoriteOfficeIds();
  const toggleFavorite = useToggleFavoriteOffice();

  return (
    <div className="container space-y-6 py-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{t.pages.offices}</h1>
        {!isLoading && !isError && (
          <p className="text-sm text-muted-foreground">
            {offices.length} {t.office.offices}
          </p>
        )}
      </div>

      {isLoading && <SkeletonGrid />}

      {isError && <p className="py-16 text-center text-destructive">{t.errors.generic}</p>}

      {!isLoading && !isError && offices.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">{t.office.noOffice}</p>
      )}

      {!isLoading && !isError && offices.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {offices.map((office) => (
            <OfficeCard
              key={office.id}
              office={office}
              isFavorited={favoriteIds.has(office.id)}
              onToggleFavorite={
                isAuthenticated
                  ? (id) =>
                      toggleFavorite.mutate({ officeId: id, isFavorited: favoriteIds.has(id) })
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
