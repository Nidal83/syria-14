import { useLanguage } from '@/i18n/LanguageContext';
import { governorates, areas, propertyTypes } from '@/data/properties';
import { Heart, MapPin, BedDouble, Bath, Maximize } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SupabaseProperty, getCoverImage } from '@/hooks/useProperties';

const PropertyCard = ({ property }: { property: SupabaseProperty }) => {
  const { lang, t } = useLanguage();
  const { user, toggleFavorite, isFavorite } = useAuth();
  const fav = user ? isFavorite(property.id) : false;

  const pType = propertyTypes.find((p) => p.key === property.property_type);
  const coverImg = getCoverImage(property.property_images);

  const formatPrice = (p: number) => {
    if (p >= 1000000000) return `${(p / 1000000000).toFixed(1)} ${lang === 'ar' ? 'مليار' : 'B'}`;
    if (p >= 1000000) return `${(p / 1000000).toFixed(1)} ${lang === 'ar' ? 'مليون' : 'M'}`;
    if (p >= 1000) return `${(p / 1000).toFixed(0)} ${lang === 'ar' ? 'ألف' : 'K'}`;
    return p.toLocaleString();
  };

  return (
    <Link to={`/property/${property.id}`} className="group block">
      <div className="hover:shadow-card-hover overflow-hidden rounded-xl bg-card shadow-card transition-all duration-300 hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={coverImg}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          {/* Badges */}
          <div className="absolute start-3 top-3 flex gap-2">
            <span
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                property.listing_type === 'sale'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary-gold text-primary-gold-foreground'
              }`}
            >
              {property.listing_type === 'sale' ? t('listing.sale') : t('listing.rent')}
            </span>
          </div>
          {/* Favorite */}
          {user && (
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleFavorite(property.id);
              }}
              className="absolute end-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition-colors hover:bg-card"
            >
              <Heart
                className={`h-4 w-4 ${fav ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`}
              />
            </button>
          )}
          {/* Price */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
            <span className="text-lg font-bold text-primary-foreground">
              {formatPrice(property.price)} {t('common.syp')}
            </span>
            {property.listing_type === 'rent' && (
              <span className="text-xs text-primary-foreground/80">
                {' '}
                / {lang === 'ar' ? 'شهري' : 'month'}
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="mb-1 line-clamp-1 font-semibold text-foreground">{property.title}</h3>
          <p className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {property.address || '—'}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" /> {property.rooms}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" /> {property.bathrooms}
            </span>
            <span className="flex items-center gap-1">
              <Maximize className="h-3.5 w-3.5" /> {property.area_size} {t('detail.sqm')}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">
              {pType?.[lang] || property.property_type}
            </span>
            <span className="text-xs text-muted-foreground">
              {property.offices?.office_name || '—'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
