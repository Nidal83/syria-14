import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import { cn } from '@/lib/utils';

// ─── Data fetching ────────────────────────────────────────────────────────────

function useGovernorates() {
  return useQuery({
    queryKey: ['governorates'],
    queryFn: async () => {
      const { data } = await supabase
        .from('governorates')
        .select('id, name_ar, name_en')
        .order('name_ar');
      return data ?? [];
    },
    staleTime: Infinity,
  });
}

function useAreas(governorateId: string | null) {
  return useQuery({
    queryKey: ['areas', governorateId],
    queryFn: async () => {
      if (!governorateId) return [];
      const { data } = await supabase
        .from('areas')
        .select('id, name_ar, name_en')
        .eq('governorate_id', governorateId)
        .order('name_ar');
      return data ?? [];
    },
    enabled: Boolean(governorateId),
    staleTime: Infinity,
  });
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function FilterSelect({
  value,
  onValueChange,
  placeholder,
  children,
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn(
          'h-11 rounded-xl border-0 bg-transparent text-sm font-medium text-foreground/80 shadow-none focus:ring-0',
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  compact?: boolean;
  className?: string;
}

export default function SearchBox({ compact = false, className }: Props) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();

  // Basic filters
  const [listingType, setListingType] = useState('');
  const [category, setCategory] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [areaId, setAreaId] = useState('');

  // Advanced filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [furnished, setFurnished] = useState('');
  const [floor, setFloor] = useState('');
  const [rooms, setRooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');

  const { data: governorates = [] } = useGovernorates();
  const { data: areas = [] } = useAreas(governorateId || null);

  function handleGovernorateChange(val: string) {
    setGovernorateId(val);
    setAreaId('');
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (listingType) params.set('listing_type', listingType);
    if (category) params.set('category', category);
    if (governorateId) params.set('governorate_id', governorateId);
    if (areaId) params.set('area_id', areaId);
    if (furnished) params.set('furnished', furnished);
    if (floor) params.set('floor', floor);
    if (rooms) params.set('rooms', rooms);
    if (bathrooms) params.set('bathrooms', bathrooms);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    if (minArea) params.set('min_area', minArea);
    if (maxArea) params.set('max_area', maxArea);

    navigate(`${PATHS.search}?${params.toString()}`);
  }

  const nameKey = locale === 'ar' ? 'name_ar' : 'name_en';
  const divider = 'border-e border-border/40 last:border-0';

  return (
    <form
      onSubmit={handleSearch}
      className={cn('rounded-2xl bg-white shadow-xl', compact ? 'p-3' : 'p-5', className)}
    >
      {/* ── Row 1: main filters ── */}
      <div className="grid grid-cols-2 divide-x divide-border/40 overflow-hidden rounded-xl border border-border/40 sm:grid-cols-4 rtl:divide-x-reverse">
        {/* Listing type */}
        <div className={divider}>
          <FilterSelect
            value={listingType}
            onValueChange={setListingType}
            placeholder={t.search.anyType}
          >
            <SelectItem value="sale">{t.property.sale}</SelectItem>
            <SelectItem value="rent">{t.property.rent}</SelectItem>
          </FilterSelect>
        </div>

        {/* Category */}
        <div className={divider}>
          <FilterSelect
            value={category}
            onValueChange={setCategory}
            placeholder={t.search.propertyType}
          >
            {Object.entries(t.property.categories).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </FilterSelect>
        </div>

        {/* Governorate */}
        <div className={divider}>
          <FilterSelect
            value={governorateId}
            onValueChange={handleGovernorateChange}
            placeholder={t.search.anyGovernorate}
          >
            {governorates.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g[nameKey]}
              </SelectItem>
            ))}
          </FilterSelect>
        </div>

        {/* Area */}
        <div className={divider}>
          <FilterSelect value={areaId} onValueChange={setAreaId} placeholder={t.search.anyArea}>
            {areas.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a[nameKey]}
              </SelectItem>
            ))}
          </FilterSelect>
        </div>
      </div>

      {/* ── Advanced toggle ── */}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        {showAdvanced ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
        {t.search.advancedSearch}
      </button>

      {/* ── Advanced filters ── */}
      {showAdvanced && (
        <div className="mt-3 space-y-3">
          {/* Row 2: furnished / floor / rooms / bathrooms */}
          <div className="grid grid-cols-2 divide-x divide-border/40 overflow-hidden rounded-xl border border-border/40 sm:grid-cols-4 rtl:divide-x-reverse">
            <div className={divider}>
              <FilterSelect
                value={furnished}
                onValueChange={setFurnished}
                placeholder={t.search.furnished}
              >
                <SelectItem value="true">{t.search.furnishedYes}</SelectItem>
                <SelectItem value="false">{t.search.furnishedNo}</SelectItem>
              </FilterSelect>
            </div>

            <div className={divider}>
              <FilterSelect value={floor} onValueChange={setFloor} placeholder={t.search.floor}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </FilterSelect>
            </div>

            <div className={divider}>
              <FilterSelect value={rooms} onValueChange={setRooms} placeholder={t.search.rooms}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}+
                  </SelectItem>
                ))}
              </FilterSelect>
            </div>

            <div className={divider}>
              <FilterSelect
                value={bathrooms}
                onValueChange={setBathrooms}
                placeholder={t.search.bathrooms}
              >
                {[1, 2, 3, 4].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}+
                  </SelectItem>
                ))}
              </FilterSelect>
            </div>
          </div>

          {/* Row 3: price / area */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Input
              type="number"
              min={0}
              placeholder={t.search.priceFrom}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="h-11 rounded-xl border-border/40 text-sm"
            />
            <Input
              type="number"
              min={0}
              placeholder={t.search.priceTo}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="h-11 rounded-xl border-border/40 text-sm"
            />
            <Input
              type="number"
              min={0}
              placeholder={t.search.areaFrom}
              value={minArea}
              onChange={(e) => setMinArea(e.target.value)}
              className="h-11 rounded-xl border-border/40 text-sm"
            />
            <Input
              type="number"
              min={0}
              placeholder={t.search.areaTo}
              value={maxArea}
              onChange={(e) => setMaxArea(e.target.value)}
              className="h-11 rounded-xl border-border/40 text-sm"
            />
          </div>
        </div>
      )}

      {/* ── Search button ── */}
      <Button
        type="submit"
        className="mt-3 h-12 w-full gap-2 rounded-xl text-base font-bold"
        style={{
          background:
            'linear-gradient(90deg, var(--primary) 0%, var(--primary-gold, #b8860b) 100%)',
        }}
      >
        <Search className="h-5 w-5" />
        {t.common.search}
      </Button>
    </form>
  );
}
