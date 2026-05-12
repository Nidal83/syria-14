import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProperty, getAllImages } from '@/hooks/useProperties';
import { propertyTypes } from '@/data/properties';
import {
  ArrowRight,
  ArrowLeft,
  Phone,
  MessageCircle,
  Heart,
  BedDouble,
  Bath,
  Maximize,
  Layers,
  MapPin,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageGallery from '@/components/ImageGallery';

const featureIcons: Record<string, string> = {
  balcony: '🏗️',
  elevator: '🛗',
  parking: '🅿️',
  pool: '🏊',
  garden: '🌳',
  heating: '🔥',
  ac: '❄️',
};

const PropertyDetails = () => {
  const { id } = useParams();
  const { lang, t } = useLanguage();
  const { user, toggleFavorite, isFavorite } = useAuth();
  const navigate = useNavigate();
  const { property, loading } = useProperty(id);

  const BackIcon = lang === 'ar' ? ArrowRight : ArrowLeft;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-xl text-muted-foreground">{t('search.no_results')}</p>
      </div>
    );
  }

  const pType = propertyTypes.find((p) => p.key === property.property_type);
  const fav = user ? isFavorite(property.id) : false;
  const images = getAllImages(property.property_images);
  const phone = property.offices?.phone || '';

  const formatPrice = (p: number) => p.toLocaleString(lang === 'ar' ? 'ar-SY' : 'en-US');

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <BackIcon className="h-4 w-4" /> {t('detail.back')}
      </button>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Images + info */}
        <div className="lg:col-span-2">
          <ImageGallery images={images} alt={property.title} />

          {/* Description */}
          {property.description && (
            <div className="mt-6">
              <h2 className="mb-3 text-lg font-semibold">{t('detail.description')}</h2>
              <p className="leading-relaxed text-muted-foreground">{property.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl bg-card p-5 shadow-card">
            <div
              className={`mb-3 inline-block rounded-md px-2.5 py-1 text-xs font-semibold ${
                property.listing_type === 'sale'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary-gold text-primary-gold-foreground'
              }`}
            >
              {property.listing_type === 'sale' ? t('listing.sale') : t('listing.rent')}
            </div>
            <h1 className="mb-1 text-xl font-bold">{property.title}</h1>
            <p className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {property.address || '—'}
            </p>
            <div className="text-gradient mb-4 text-2xl font-bold">
              {formatPrice(property.price)} {t('common.syp')}
              {property.listing_type === 'rent' && (
                <span className="text-base font-normal text-muted-foreground">
                  {' '}
                  / {lang === 'ar' ? 'شهري' : 'month'}
                </span>
              )}
            </div>

            {/* Quick stats */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-secondary p-2.5">
                <BedDouble className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">{t('filter.rooms')}</div>
                  <div className="text-sm font-semibold">{property.rooms}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-secondary p-2.5">
                <Bath className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">{t('filter.bathrooms')}</div>
                  <div className="text-sm font-semibold">{property.bathrooms}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-secondary p-2.5">
                <Maximize className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {lang === 'ar' ? 'المساحة' : 'Size'}
                  </div>
                  <div className="text-sm font-semibold">
                    {property.area_size} {t('detail.sqm')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-secondary p-2.5">
                <Layers className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">{t('filter.floor')}</div>
                  <div className="text-sm font-semibold">
                    {property.floor === 0 ? t('filter.ground') : property.floor}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('property.type')}</span>
                <span className="font-medium">{pType?.[lang] || property.property_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('filter.furnished')}</span>
                <span className="font-medium">
                  {property.furnished ? t('filter.furnished_yes') : t('filter.furnished_no')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('detail.office')}</span>
                <span className="font-medium">{property.offices?.office_name || '—'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {phone && (
                <>
                  <a href={`tel:${phone}`} className="block">
                    <Button className="gradient-primary w-full text-primary-foreground">
                      <Phone className="me-2 h-4 w-4" /> {t('detail.call')}
                    </Button>
                  </a>
                  <a
                    href={`https://wa.me/${phone.replace('+', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    <Button variant="outline" className="w-full">
                      <MessageCircle className="me-2 h-4 w-4" /> {t('detail.whatsapp')}
                    </Button>
                  </a>
                </>
              )}
              {user && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toggleFavorite(property.id)}
                >
                  <Heart
                    className={`me-2 h-4 w-4 ${fav ? 'fill-destructive text-destructive' : ''}`}
                  />
                  {fav ? t('detail.saved') : t('detail.save')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
