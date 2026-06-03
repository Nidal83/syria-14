import { useFormContext, useWatch } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/context';
import { FormShell } from '../FormShell';
import type { CreatePropertyValues } from '../../schemas/property.schema';

function Opt() {
  const { t } = useI18n();
  return <span className="ms-1 text-xs text-muted-foreground">({t.common.optional})</span>;
}

/**
 * Farm-rental pricing block. Renders only when the watched property_type is
 * 'farm'. Daily/weekly/monthly price tiers (at least one required, enforced in
 * the zod schema) plus optional min/max booking-day limits.
 */
export function FarmPricingSection() {
  const { t } = useI18n();
  const form = useFormContext<CreatePropertyValues>();
  const propertyType = useWatch({ control: form.control, name: 'property_type' });
  const currency = useWatch({ control: form.control, name: 'currency' });

  if (propertyType !== 'farm') return null;

  const priceFields = [
    { name: 'daily_price', label: t.property.farm.dailyPrice },
    { name: 'weekly_price', label: t.property.farm.weeklyPrice },
    { name: 'monthly_price', label: t.property.farm.monthlyPrice },
  ] as const;

  const dayFields = [
    { name: 'min_booking_days', label: t.property.farm.minDays },
    { name: 'max_booking_days', label: t.property.farm.maxDays },
  ] as const;

  return (
    <FormShell title={t.property.farm.pricing}>
      <div className="space-y-4">
        {/* Price tiers */}
        <div className="grid gap-4 sm:grid-cols-3">
          {priceFields.map(({ name, label }) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {label}
                    {currency && (
                      <span className="ms-1 text-xs text-muted-foreground">({currency})</span>
                    )}
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
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t.property.farm.atLeastOnePrice}</p>

        {/* Booking-day limits */}
        <div className="grid gap-4 sm:grid-cols-2">
          {dayFields.map(({ name, label }) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {label}
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
          ))}
        </div>
      </div>
    </FormShell>
  );
}
