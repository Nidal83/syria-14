import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/context';
import { FormShell } from '../FormShell';
import type { CreatePropertyValues } from '../../schemas/property.schema';

function Req() {
  return <span className="ms-0.5 text-destructive">*</span>;
}

function Opt() {
  const { t } = useI18n();
  return <span className="ms-1 text-xs text-muted-foreground">({t.common.optional})</span>;
}

export function ContactSection() {
  const { t } = useI18n();
  const form = useFormContext<CreatePropertyValues>();

  return (
    <FormShell title={t.property.section.contact}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Contact phone */}
          <FormField
            control={form.control}
            name="contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t.property.field.contactPhone}
                  <Req />
                </FormLabel>
                <FormControl>
                  <Input type="tel" dir="ltr" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* WhatsApp */}
          <FormField
            control={form.control}
            name="whatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t.property.field.whatsapp}
                  <Opt />
                </FormLabel>
                <FormControl>
                  <Input type="tel" dir="ltr" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Video URL */}
        <FormField
          control={form.control}
          name="video_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t.property.field.videoUrl}
                <Opt />
              </FormLabel>
              <FormControl>
                <Input type="url" dir="ltr" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </FormShell>
  );
}
