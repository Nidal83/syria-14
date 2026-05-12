import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useProperties } from '@/hooks/useProperties';
import PropertyCard from '@/components/PropertyCard';
import SearchBox from '@/components/SearchBox';
import { Loader2 } from 'lucide-react';

const SearchResults = () => {
  const { t } = useLanguage();
  const [params] = useSearchParams();

  const filters: Record<string, string | null> = {
    listing_type: params.get('listingType'),
    property_type: params.get('propertyType'),
    rooms: params.get('rooms'),
    bathrooms: params.get('bathrooms'),
    furnished: params.get('furnished'),
    priceFrom: params.get('priceFrom'),
    priceTo: params.get('priceTo'),
    areaFrom: params.get('areaFrom'),
    areaTo: params.get('areaTo'),
    floor: params.get('floor'),
  };

  const { properties, loading } = useProperties(filters);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <SearchBox compact />
      </div>
      <h2 className="mb-6 text-xl font-bold">
        {t('search.results')} ({properties.length})
      </h2>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-xl bg-card p-12 text-center shadow-card">
          <p className="text-lg text-muted-foreground">{t('search.no_results')}</p>
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

export default SearchResults;
