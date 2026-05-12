import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { governorates, areas, propertyTypes } from '@/data/properties';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SearchBox = ({ compact = false }: { compact?: boolean }) => {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [filters, setFilters] = useState({
    listingType: '',
    propertyType: '',
    governorate: '',
    area: '',
    furnished: '',
    floor: '',
    rooms: '',
    bathrooms: '',
    priceFrom: '',
    priceTo: '',
    areaFrom: '',
    areaTo: '',
  });

  const update = (key: string, val: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: val };
      if (key === 'governorate') next.area = '';
      return next;
    });
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    navigate(`/search?${params.toString()}`);
  };

  const selectClass =
    'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none';
  const inputClass = selectClass;

  const currentAreas = filters.governorate ? areas[filters.governorate] || [] : [];

  return (
    <div className={`rounded-2xl bg-card p-4 shadow-card ${compact ? '' : 'md:p-6'}`}>
      {/* Main row */}
      <div className="grid gap-3 md:grid-cols-4">
        {/* Listing type */}
        <select
          value={filters.listingType}
          onChange={(e) => update('listingType', e.target.value)}
          className={selectClass}
        >
          <option value="">{t('listing.all')}</option>
          <option value="sale">{t('listing.sale')}</option>
          <option value="rent">{t('listing.rent')}</option>
        </select>

        {/* Property type */}
        <select
          value={filters.propertyType}
          onChange={(e) => update('propertyType', e.target.value)}
          className={selectClass}
        >
          <option value="">{t('property.type')}</option>
          {propertyTypes.map((p) => (
            <option key={p.key} value={p.key}>
              {p[lang]}
            </option>
          ))}
        </select>

        {/* Governorate */}
        <select
          value={filters.governorate}
          onChange={(e) => update('governorate', e.target.value)}
          className={selectClass}
        >
          <option value="">{t('gov.label')}</option>
          {governorates.map((g) => (
            <option key={g.key} value={g.key}>
              {g[lang]}
            </option>
          ))}
        </select>

        {/* Area */}
        <select
          value={filters.area}
          onChange={(e) => update('area', e.target.value)}
          className={selectClass}
          disabled={!filters.governorate}
        >
          <option value="">{t('filter.area')}</option>
          {currentAreas.map((a) => (
            <option key={a.key} value={a.key}>
              {a[lang]}
            </option>
          ))}
        </select>
      </div>

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="mt-3 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        {t('search.advanced')}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="mt-3 grid animate-fade-in gap-3 md:grid-cols-4">
          <select
            value={filters.furnished}
            onChange={(e) => update('furnished', e.target.value)}
            className={selectClass}
          >
            <option value="">{t('filter.furnished')}</option>
            <option value="yes">{t('filter.furnished_yes')}</option>
            <option value="no">{t('filter.furnished_no')}</option>
          </select>

          <select
            value={filters.floor}
            onChange={(e) => update('floor', e.target.value)}
            className={selectClass}
          >
            <option value="">{t('filter.floor')}</option>
            <option value="0">{t('filter.ground')}</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>
                {i + 1}
              </option>
            ))}
          </select>

          <select
            value={filters.rooms}
            onChange={(e) => update('rooms', e.target.value)}
            className={selectClass}
          >
            <option value="">{t('filter.rooms')}</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
            <option value="6">6+</option>
          </select>

          <select
            value={filters.bathrooms}
            onChange={(e) => update('bathrooms', e.target.value)}
            className={selectClass}
          >
            <option value="">{t('filter.bathrooms')}</option>
            {[1, 2, 3].map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
            <option value="4">4+</option>
          </select>

          <input
            type="number"
            placeholder={t('filter.price_from')}
            value={filters.priceFrom}
            onChange={(e) => update('priceFrom', e.target.value)}
            className={inputClass}
          />
          <input
            type="number"
            placeholder={t('filter.price_to')}
            value={filters.priceTo}
            onChange={(e) => update('priceTo', e.target.value)}
            className={inputClass}
          />
          <input
            type="number"
            placeholder={t('filter.area_from')}
            value={filters.areaFrom}
            onChange={(e) => update('areaFrom', e.target.value)}
            className={inputClass}
          />
          <input
            type="number"
            placeholder={t('filter.area_to')}
            value={filters.areaTo}
            onChange={(e) => update('areaTo', e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {/* Search button */}
      <Button
        onClick={handleSearch}
        className="gradient-primary mt-4 h-11 w-full text-base font-semibold text-primary-foreground"
      >
        <Search className="me-2 h-4 w-4" />
        {t('search.button')}
      </Button>
    </div>
  );
};

export default SearchBox;
