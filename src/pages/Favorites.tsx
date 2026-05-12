import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PropertyCard from '@/components/PropertyCard';
import { Heart, Loader2 } from 'lucide-react';
import type { SupabaseProperty } from '@/hooks/useProperties';

const Favorites = () => {
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const [properties, setProperties] = useState<SupabaseProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      setLoading(true);
      // Get favorite property IDs
      const { data: favs } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('user_id', session.user.id);

      if (!favs || favs.length === 0) {
        setProperties([]);
        setLoading(false);
        return;
      }

      const ids = favs.map((f) => f.property_id);
      const { data } = await supabase
        .from('properties')
        .select('*, offices(office_name, phone), property_images(image_url, is_cover)')
        .in('id', ids);

      setProperties((data as SupabaseProperty[]) || []);
      setLoading(false);
    };

    fetchFavorites();
  }, [session]);

  // ProtectedRoute ensures `user` is non-null here.
  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('nav.favorites')}</h1>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-xl bg-card p-12 text-center shadow-card">
          <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">{t('search.no_results')}</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
