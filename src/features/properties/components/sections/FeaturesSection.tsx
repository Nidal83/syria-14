import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n/context';
import { FormShell } from '../FormShell';
import { FEATURES_LIST, PAYMENT_METHODS, OWNERSHIP_TYPES } from '../../schemas/property.schema';
import type { CreatePropertyValues } from '../../schemas/property.schema';

function Opt() {
  const { t } = useI18n();
  return <span className="ms-1 text-xs text-muted-foreground">({t.common.optional})</span>;
}

export function FeaturesSection() {
  const { t } = useI18n();
  const form = useFormContext<CreatePropertyValues>();
  const features = form.watch('features') ?? [];

  function toggleFeature(key: string, checked: boolean) {
    const next = checked ? [...features, key] : features.filter((f) => f !== key);
    form.setValue('features', next, { shouldValidate: true });
  }

  return (
    <FormShell title={t.property.section.features}>
      <div className="space-y-5">
        {/* Feature checkboxes */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {FEATURES_LIST.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={`feature-${key}`}
                checked={features.includes(key)}
                onCheckedChange={(checked) => toggleFeature(key, checked === true)}
              />
              <Label htmlFor={`feature-${key}`} className="cursor-pointer font-normal">
                {t.property.feature[key]}
              </Label>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Payment method */}
          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t.property.field.paymentMethod}
                  <Opt />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {t.property.paymentMethods[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Ownership type */}
          <FormField
            control={form.control}
            name="ownership_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t.property.field.ownershipType}
                  <Opt />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {OWNERSHIP_TYPES.map((o) => (
                      <SelectItem key={o} value={o}>
                        {t.property.ownershipTypes[o]}
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
