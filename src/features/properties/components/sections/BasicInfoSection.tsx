import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n/context';
import { FormShell } from '../FormShell';
import { PROPERTY_TYPES, LISTING_TYPES, CURRENCIES } from '../../schemas/property.schema';
import type { CreatePropertyValues } from '../../schemas/property.schema';

function Req() {
  return <span className="ms-0.5 text-destructive">*</span>;
}

export function BasicInfoSection() {
  const { t } = useI18n();
  const form = useFormContext<CreatePropertyValues>();

  return (
    <FormShell title={t.property.section.basic}>
      <div className="space-y-4">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t.property.field.title}
                <Req />
              </FormLabel>
              <FormControl>
                <Input {...field} maxLength={150} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t.property.field.description}
                <Req />
              </FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} maxLength={4000} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Property type */}
          <FormField
            control={form.control}
            name="property_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t.property.field.propertyType}
                  <Req />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t.property.types[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Listing type */}
          <FormField
            control={form.control}
            name="listing_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t.property.field.listingType}
                  <Req />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LISTING_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t.property[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Price */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t.property.field.price}
                  <Req />
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    dir="ltr"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? '' : e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Currency */}
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.property.field.currency}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? 'USD'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
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
