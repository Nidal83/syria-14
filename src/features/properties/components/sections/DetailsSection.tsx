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
import { DIRECTIONS, VIEWS } from '../../schemas/property.schema';
import type { CreatePropertyValues } from '../../schemas/property.schema';

function Req() {
  return <span className="ms-0.5 text-destructive">*</span>;
}

function Opt() {
  const { t } = useI18n();
  return <span className="ms-1 text-xs text-muted-foreground">({t.common.optional})</span>;
}

function NumberInput({
  field,
  min = 0,
  required = false,
}: {
  field: { value: number | string | undefined | null; onChange: (v: string) => void; name: string };
  min?: number;
  required?: boolean;
}) {
  return (
    <Input
      type="number"
      min={min}
      step="1"
      dir="ltr"
      required={required}
      value={field.value ?? ''}
      onChange={(e) => field.onChange(e.target.value)}
    />
  );
}

export function DetailsSection() {
  const { t } = useI18n();
  const form = useFormContext<CreatePropertyValues>();

  return (
    <FormShell title={t.property.section.details}>
      <div className="space-y-4">
        {/* Size + bedrooms */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="area_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t.property.field.size}
                  <Req />
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    dir="ltr"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t.property.field.bedrooms}
                  <Req />
                </FormLabel>
                <FormControl>
                  <NumberInput field={field} required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Bathrooms + living rooms */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="bathrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t.property.field.bathrooms}
                  <Req />
                </FormLabel>
                <FormControl>
                  <NumberInput field={field} required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="living_rooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.property.field.livingRooms}</FormLabel>
                <FormControl>
                  <NumberInput field={field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Kitchens + floor */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="kitchens"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.property.field.kitchens}</FormLabel>
                <FormControl>
                  <NumberInput field={field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="floor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t.property.field.floor}
                  <Opt />
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    dir="ltr"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Total floors + building age */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="total_floors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t.property.field.totalFloors}
                  <Opt />
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    dir="ltr"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="building_age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t.property.field.buildingAge}
                  <Opt />
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    dir="ltr"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Direction + view */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="direction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t.property.field.direction}
                  <Opt />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DIRECTIONS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {t.property.directions[d]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="view"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t.property.field.view}
                  <Opt />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VIEWS.map((v) => (
                      <SelectItem key={v} value={v}>
                        {t.property.views[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </FormShell>
  );
}
