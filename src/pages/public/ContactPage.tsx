import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Phone, Mail, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface FormValues {
  name: string;
  contact: string;
  message: string;
}

export default function ContactPage() {
  const { t } = useI18n();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    setServerError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('contact_messages').insert({
      name: values.name,
      contact: values.contact,
      message: values.message,
    });
    if (error) {
      setServerError(t.errors.generic);
      return;
    }
    setSubmitted(true);
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{t.pages.contact}</h1>
          <p className="mt-1 text-muted-foreground">{t.contact.subtitle}</p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* ── Contact info ── */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">{t.contact.info.heading}</h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t.contact.info.phoneLabel}
                  </p>
                  <p dir="ltr" className="font-medium">
                    {t.contact.info.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t.contact.info.emailLabel}
                  </p>
                  <p dir="ltr" className="font-medium">
                    {t.contact.info.email}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t.contact.info.addressLabel}
                  </p>
                  <p className="font-medium">{t.contact.info.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t.contact.info.hoursLabel}
                  </p>
                  <p className="font-medium">{t.contact.info.hours}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Form ── */}
          <div>
            {submitted ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <h2 className="text-lg font-semibold">{t.contact.form.successTitle}</h2>
                <p className="text-sm text-muted-foreground">{t.contact.form.successBody}</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    reset();
                    setSubmitted(false);
                  }}
                >
                  {t.contact.form.sendAnother}
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="space-y-4 rounded-xl border border-border bg-card p-6"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="c-name">{t.contact.form.name}</Label>
                  <Input
                    id="c-name"
                    {...register('name', { required: t.validation.required })}
                    aria-invalid={Boolean(errors.name)}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-contact">{t.contact.form.contact}</Label>
                  <Input
                    id="c-contact"
                    {...register('contact', { required: t.validation.required })}
                    aria-invalid={Boolean(errors.contact)}
                  />
                  {errors.contact && (
                    <p className="text-xs text-destructive">{errors.contact.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-message">{t.contact.form.message}</Label>
                  <Textarea
                    id="c-message"
                    rows={5}
                    placeholder={t.contact.form.messagePlaceholder}
                    {...register('message', { required: t.validation.required })}
                    aria-invalid={Boolean(errors.message)}
                  />
                  {errors.message && (
                    <p className="text-xs text-destructive">{errors.message.message}</p>
                  )}
                </div>

                {serverError && <p className="text-sm text-destructive">{serverError}</p>}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t.contact.form.sending : t.contact.form.send}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
