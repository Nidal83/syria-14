import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import { createPropertySchema } from '../schemas/property.schema';
import type { CreatePropertyValues } from '../schemas/property.schema';
import { describeFormErrors } from '../lib/describe-form-errors';
import { useCreateProperty } from '../hooks/use-create-property';
import { BasicInfoSection } from './sections/BasicInfoSection';
import { LocationSection } from './sections/LocationSection';
import { DetailsSection } from './sections/DetailsSection';
import { FarmPricingSection } from './sections/FarmPricingSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { ContactSection } from './sections/ContactSection';
import { PhotosSection } from './sections/PhotosSection';

export default function NewPropertyForm() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { mutate, isPending } = useCreateProperty();

  const schema = useMemo(
    () =>
      createPropertySchema({
        required: t.validation.required,
        tooShort: t.validation.tooShort,
        tooLong: t.validation.tooLong,
        notANumber: t.validation.notANumber,
        mustBePositive: t.validation.mustBePositive,
        invalidUrl: t.validation.invalidUrl,
        invalidPhone: t.validation.invalidPhone,
        atLeastOneImage: t.validation.atLeastOneImage,
        atLeastOnePrice: t.property.farm.atLeastOnePrice,
        maxLessThanMin: t.property.farm.maxLessThanMin,
      }),
    [t.validation, t.property.farm],
  );

  const form = useForm<CreatePropertyValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      listing_type: 'sale',
      currency: 'USD',
      features: [],
      living_rooms: 0,
      kitchens: 1,
      images: [],
    },
  });

  function scrollToFirstError(errors?: unknown) {
    // Without this, a failed validation just silently refuses to submit.
    console.warn('[NewPropertyForm] validation errors', errors);
    const fields = describeFormErrors(errors, t);
    toast.error(t.property.form.fixErrors, fields ? { description: fields } : undefined);
    requestAnimationFrame(() => {
      const firstInvalid = document.querySelector('[aria-invalid="true"]') as HTMLElement | null;
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus?.();
      }
    });
  }

  function onSubmit(values: CreatePropertyValues) {
    mutate(values);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-1 pb-28">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t.property.form.title}</h1>
        <p className="text-muted-foreground">{t.property.form.subtitle}</p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, scrollToFirstError)}
          noValidate
          className="space-y-4"
        >
          <BasicInfoSection />
          <LocationSection />
          <DetailsSection />
          <FarmPricingSection />
          <FeaturesSection />
          <ContactSection />
          <PhotosSection />
        </form>
      </Form>

      {/* Sticky submit bar */}
      <div className="fixed bottom-0 end-0 start-0 z-10 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-3xl items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(PATHS.officeProperties)}
            disabled={isPending}
          >
            {t.property.actions.cancel}
          </Button>

          <Button
            type="submit"
            disabled={isPending}
            onClick={form.handleSubmit(onSubmit, scrollToFirstError)}
          >
            {isPending ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t.property.actions.publishing}
              </>
            ) : (
              t.property.actions.publish
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
