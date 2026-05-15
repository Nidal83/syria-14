import { Heart } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/providers/AuthProvider';
import { Link } from 'react-router-dom';
import {
  useFavoriteProperties,
  useFavoriteOffices,
  useFavoritePropertyIds,
  useFavoriteOfficeIds,
  useToggleFavoriteProperty,
  useToggleFavoriteOffice,
} from '@/lib/hooks/useFavorites';
import PropertyCard from '@/components/PropertyCard';
import OfficeCard from '@/components/OfficeCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PATHS } from '@/routes/paths';
import type { Property } from '@/types/property.types';

export default function FavoritesPage() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();

  const { data: properties = [], isLoading: loadingProps } = useFavoriteProperties();
  const { data: offices = [], isLoading: loadingOffices } = useFavoriteOffices();
  const { data: favPropIds = new Set<string>() } = useFavoritePropertyIds();
  const { data: favOfficeIds = new Set<string>() } = useFavoriteOfficeIds();

  const toggleProp = useToggleFavoriteProperty();
  const toggleOffice = useToggleFavoriteOffice();

  if (!isAuthenticated) {
    return (
      <div className="container py-16 text-center">
        <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
        <p className="mb-4 text-muted-foreground">{t.pages.favorites}</p>
        <Link to={PATHS.login} className="text-sm font-medium text-primary hover:underline">
          {t.auth.login}
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <Heart className="h-6 w-6 text-primary" />
        {t.pages.favorites}
      </h1>

      <Tabs defaultValue="properties">
        <TabsList className="mb-6">
          <TabsTrigger value="properties">
            {t.pages.savedProperties}
            {properties.length > 0 && (
              <span className="ms-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-xs font-semibold text-primary">
                {properties.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="offices">
            {t.pages.savedOffices}
            {offices.length > 0 && (
              <span className="ms-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-xs font-semibold text-primary">
                {offices.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Properties tab ── */}
        <TabsContent value="properties">
          {loadingProps ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[320px] animate-pulse rounded-xl border border-border/40 bg-muted"
                />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="py-16 text-center">
              <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">{t.pages.noSavedProperties}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(properties as Property[]).map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isFavorited={favPropIds.has(property.id)}
                  onToggleFavorite={(id) =>
                    toggleProp.mutate({ propertyId: id, isFavorited: favPropIds.has(id) })
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Offices tab ── */}
        <TabsContent value="offices">
          {loadingOffices ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[200px] animate-pulse rounded-xl border border-border/40 bg-muted"
                />
              ))}
            </div>
          ) : offices.length === 0 ? (
            <div className="py-16 text-center">
              <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">{t.pages.noSavedOffices}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(offices as Parameters<typeof OfficeCard>[0]['office'][]).map((office) => (
                <OfficeCard
                  key={office.id}
                  office={office}
                  isFavorited={favOfficeIds.has(office.id)}
                  onToggleFavorite={(id) =>
                    toggleOffice.mutate({ officeId: id, isFavorited: favOfficeIds.has(id) })
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
