import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronDown, Home, Key, Building2, MapPin, Map } from 'lucide-react';
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

// ─── Filter section with label ────────────────────────────────────────────────

function FilterSection({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'group flex flex-col gap-0.5 px-4 py-3 transition-colors hover:bg-primary/5',
        className,
      )}
    >
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      {children}
    </div>
  );
}

// ─── Borderless select ────────────────────────────────────────────────────────

function FilterSelect({
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
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-8 border-0 bg-transparent p-0 text-sm font-semibold text-foreground shadow-none focus:ring-0 [&>span]:line-clamp-1">
        <SelectValue
          placeholder={<span className="text-muted-foreground/60">{placeholder}</span>}
        />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
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

  const [listingType, setListingType] = useState<'sale' | 'rent'>('sale');
  const [category, setCategory] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [areaId, setAreaId] = useState('');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [furnished, setFurnished] = useState('');
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
    p.set('listing_type', listingType);
    if (category) p.set('category', category);
    if (governorateId) p.set('governorate_id', governorateId);
    if (areaId) p.set('area_id', areaId);
    if (furnished) p.set('furnished', furnished);
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
        'bg-white/96 overflow-hidden rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md',
        compact && 'shadow-lg',
        className,
      )}
    >
      {/* ── Sale / Rent tabs ── */}
      <div className="flex border-b border-border/30 bg-muted/40">
        <button
          type="button"
          onClick={() => setListingType('sale')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-bold transition-all',
            listingType === 'sale'
              ? 'border-b-2 border-primary bg-white text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Home className="h-4 w-4" />
          {t.property.sale}
        </button>
        <button
          type="button"
          onClick={() => setListingType('rent')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-bold transition-all',
            listingType === 'rent'
              ? 'border-b-2 border-primary bg-white text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Key className="h-4 w-4" />
          {t.property.rent}
        </button>
      </div>

      {/* ── Main filter row ── */}
      <div className="flex flex-col sm:flex-row sm:divide-x sm:divide-border/30 rtl:sm:divide-x-reverse">
        {/* Property type */}
        <FilterSection
          icon={Building2}
          label={t.search.propertyType}
          className="flex-1 border-b sm:border-b-0"
        >
          <FilterSelect value={category} onValueChange={setCategory} placeholder={t.common.all}>
            {Object.entries(t.property.categories).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </FilterSelect>
        </FilterSection>

        {/* Governorate */}
        <FilterSection
          icon={MapPin}
          label={t.search.anyGovernorate}
          className="flex-1 border-b sm:border-b-0"
        >
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
        </FilterSection>

        {/* Area */}
        <FilterSection
          icon={Map}
          label={t.search.anyArea}
          className="flex-1 border-b sm:border-b-0"
        >
          <FilterSelect value={areaId} onValueChange={setAreaId} placeholder={t.search.anyArea}>
            {areas.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a[nameKey]}
              </SelectItem>
            ))}
          </FilterSelect>
        </FilterSection>

        {/* Search button — inline on desktop */}
        <div className="hidden items-center p-3 sm:flex">
          <Button
            type="submit"
            size="lg"
            className="h-14 w-14 rounded-xl p-0 text-lg shadow-md transition-transform hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, hsl(38 70% 46%), hsl(38 65% 38%))' }}
          >
            <Search className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* ── Advanced toggle + mobile search button ── */}
      <div className="flex items-center gap-3 border-t border-border/20 bg-muted/20 px-4 py-2.5">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary transition-opacity hover:opacity-80"
        >
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-200',
              showAdvanced && 'rotate-180',
            )}
          />
          {t.search.advancedSearch}
        </button>

        {/* Mobile search button */}
        <Button
          type="submit"
          className="ms-auto flex h-9 items-center gap-2 rounded-xl px-5 text-sm font-bold sm:hidden"
          style={{ background: 'linear-gradient(135deg, hsl(38 70% 46%), hsl(38 65% 38%))' }}
        >
          <Search className="h-4 w-4" />
          {t.common.search}
        </Button>
      </div>

      {/* ── Advanced filters ── */}
      {showAdvanced && (
        <div className="space-y-3 border-t border-border/20 bg-muted/10 p-4">
          {/* Row: furnished / rooms / bathrooms */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                {t.search.furnished}
              </label>
              <FilterSelect
                value={furnished}
                onValueChange={setFurnished}
                placeholder={t.common.all}
              >
                <SelectItem value="true">{t.search.furnishedYes}</SelectItem>
                <SelectItem value="false">{t.search.furnishedNo}</SelectItem>
              </FilterSelect>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                {t.search.rooms}
              </label>
              <FilterSelect value={rooms} onValueChange={setRooms} placeholder={t.common.all}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}+
                  </SelectItem>
                ))}
              </FilterSelect>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                {t.search.bathrooms}
              </label>
              <FilterSelect
                value={bathrooms}
                onValueChange={setBathrooms}
                placeholder={t.common.all}
              >
                {[1, 2, 3, 4].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}+
                  </SelectItem>
                ))}
              </FilterSelect>
            </div>
          </div>

          {/* Row: price / area */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Input
              type="number"
              min={0}
              placeholder={t.search.priceFrom}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="h-10 rounded-xl border-border/50 text-sm"
            />
            <Input
              type="number"
              min={0}
              placeholder={t.search.priceTo}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="h-10 rounded-xl border-border/50 text-sm"
            />
            <Input
              type="number"
              min={0}
              placeholder={t.search.areaFrom}
              value={minArea}
              onChange={(e) => setMinArea(e.target.value)}
              className="h-10 rounded-xl border-border/50 text-sm"
            />
            <Input
              type="number"
              min={0}
              placeholder={t.search.areaTo}
              value={maxArea}
              onChange={(e) => setMaxArea(e.target.value)}
              className="h-10 rounded-xl border-border/50 text-sm"
            />
          </div>
        </div>
      )}
    </form>
  );
}
