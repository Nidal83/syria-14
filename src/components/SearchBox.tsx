import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
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

// ─── Data ─────────────────────────────────────────────────────────────────────

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

// ─── Styled filter box ────────────────────────────────────────────────────────

function FilterBox({
  value,
  onValueChange,
  placeholder,
  children,
}: {
  value: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-12 border-0 bg-transparent px-4 text-sm font-medium shadow-none focus:ring-0">
          <SelectValue placeholder={<span className="text-foreground/70">{placeholder}</span>} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  compact?: boolean;
  className?: string;
}

export default function SearchBox({ compact = false, className }: Props) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();

  const [listingType, setListingType] = useState('');
  const [category, setCategory] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [areaId, setAreaId] = useState('');

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

  const nameKey = locale === 'ar' ? 'name_ar' : 'name_en';

  function handleGovernorateChange(val: string) {
    setGovernorateId(val);
    setAreaId('');
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (listingType) p.set('listing_type', listingType);
    if (category) p.set('category', category);
    if (governorateId) p.set('governorate_id', governorateId);
    if (areaId) p.set('area_id', areaId);
    if (furnished) p.set('furnished', furnished);
    if (floor) p.set('floor', floor);
    if (rooms) p.set('rooms', rooms);
    if (bathrooms) p.set('bathrooms', bathrooms);
    if (minPrice) p.set('min_price', minPrice);
    if (maxPrice) p.set('max_price', maxPrice);
    if (minArea) p.set('min_area', minArea);
    if (maxArea) p.set('max_area', maxArea);
    navigate(`${PATHS.search}?${p.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className={cn(
        'rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur-sm',
        compact ? 'p-3' : 'p-5',
        className,
      )}
    >
      {/* ── Row 1: main 4 filters ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <FilterBox value={listingType} onValueChange={setListingType} placeholder={t.common.all}>
          <SelectItem value="sale">{t.property.sale}</SelectItem>
          <SelectItem value="rent">{t.property.rent}</SelectItem>
        </FilterBox>

        <FilterBox value={category} onValueChange={setCategory} placeholder={t.search.propertyType}>
          {Object.entries(t.property.categories).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </FilterBox>

        <FilterBox
          value={governorateId}
          onValueChange={handleGovernorateChange}
          placeholder={t.search.anyGovernorate}
        >
          {governorates.map((g) => (
            <SelectItem key={g.id} value={g.id}>
              {g[nameKey]}
            </SelectItem>
          ))}
        </FilterBox>

        <FilterBox value={areaId} onValueChange={setAreaId} placeholder={t.search.anyArea}>
          {areas.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a[nameKey]}
            </SelectItem>
          ))}
        </FilterBox>
      </div>

      {/* ── Advanced toggle ── */}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary transition-opacity hover:opacity-75"
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <FilterBox
              value={furnished}
              onValueChange={setFurnished}
              placeholder={t.search.furnished}
            >
              <SelectItem value="true">{t.search.furnishedYes}</SelectItem>
              <SelectItem value="false">{t.search.furnishedNo}</SelectItem>
            </FilterBox>

            <FilterBox value={floor} onValueChange={setFloor} placeholder={t.search.floor}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </FilterBox>

            <FilterBox value={rooms} onValueChange={setRooms} placeholder={t.search.rooms}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}+
                </SelectItem>
              ))}
            </FilterBox>

            <FilterBox
              value={bathrooms}
              onValueChange={setBathrooms}
              placeholder={t.search.bathrooms}
            >
              {[1, 2, 3, 4].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}+
                </SelectItem>
              ))}
            </FilterBox>
          </div>

          {/* Row 3: price / area range inputs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Input
              type="number"
              min={0}
              placeholder={t.search.priceFrom}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="h-12 rounded-xl border-border/60 bg-white text-sm shadow-sm"
            />
            <Input
              type="number"
              min={0}
              placeholder={t.search.priceTo}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="h-12 rounded-xl border-border/60 bg-white text-sm shadow-sm"
            />
            <Input
              type="number"
              min={0}
              placeholder={t.search.areaFrom}
              value={minArea}
              onChange={(e) => setMinArea(e.target.value)}
              className="h-12 rounded-xl border-border/60 bg-white text-sm shadow-sm"
            />
            <Input
              type="number"
              min={0}
              placeholder={t.search.areaTo}
              value={maxArea}
              onChange={(e) => setMaxArea(e.target.value)}
              className="h-12 rounded-xl border-border/60 bg-white text-sm shadow-sm"
            />
          </div>
        </div>
      )}

      {/* ── Search button ── */}
      <button
        type="submit"
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-bold text-white shadow-md transition-opacity hover:opacity-90 active:opacity-80"
        style={{
          background: 'linear-gradient(90deg, hsl(145 45% 28%) 0%, hsl(38 70% 46%) 100%)',
        }}
      >
        <Search className="h-5 w-5" />
        {t.common.search}
      </button>
    </form>
  );
}
