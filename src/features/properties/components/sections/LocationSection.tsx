import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n/context';
import { FormShell } from '../FormShell';
import {
  fetchGovernorates,
  fetchAreasByGovernorate,
  type Governorate,
  type Area,
} from '../../api/properties.service';
import type { CreatePropertyValues } from '../../schemas/property.schema';

function Req() {
  return <span className="ms-0.5 text-destructive">*</span>;
}

export function LocationSection() {
  const { t, locale } = useI18n();
  const form = useFormContext<CreatePropertyValues>();
  const selectedGovId = form.watch('governorate_id');

  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loadingGov, setLoadingGov] = useState(true);
  const [loadingAreas, setLoadingAreas] = useState(false);

  useEffect(() => {
    setLoadingGov(true);
    fetchGovernorates()
      .then(setGovernorates)
      .finally(() => setLoadingGov(false));
  }, []);

  useEffect(() => {
    if (!selectedGovId) {
      setAreas([]);
      return;
    }
    const currentAreaId = form.getValues('area_id');
    setLoadingAreas(true);
    fetchAreasByGovernorate(selectedGovId)
      .then((fetchedAreas) => {
        setAreas(fetchedAreas);
        // Clear area_id only when the current value doesn't belong to this governorate
        // (user switched governorate). Preserve it when loading existing edit data.
        if (currentAreaId && !fetchedAreas.some((a) => a.id === currentAreaId)) {
          form.setValue('area_id', '');
        }
      })
      .finally(() => setLoadingAreas(false));
  }, [selectedGovId, form]);

  function govName(g: Governorate) {
    return locale === 'ar' ? g.name_ar : g.name_en;
  }
  function areaName(a: Area) {
    return locale === 'ar' ? a.name_ar : a.name_en;
  }

  return (
    <FormShell title={t.property.section.location}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Governorate */}
          <FormField
            control={form.control}
            name="governorate_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t.property.field.governorate}
                  <Req />
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                  disabled={loadingGov}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {governorates.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {govName(g)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Area */}
          <FormField
            control={form.control}
            name="area_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t.property.field.area}
                  <Req />
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                  disabled={!selectedGovId || loadingAreas}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {areas.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {areaName(a)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Address */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t.property.field.address}
                <Req />
              </FormLabel>
              <FormControl>
                <Input {...field} maxLength={250} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </FormShell>
  );
}
