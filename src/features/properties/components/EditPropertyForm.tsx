import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import { editPropertySchema } from '../schemas/property.schema';
import type { EditPropertyValues } from '../schemas/property.schema';
import { fetchPropertyForEdit } from '../api/properties.service';
import type { ExistingImage } from '../api/properties.service';
import { useEditProperty } from '../hooks/use-edit-property';
import { BasicInfoSection } from './sections/BasicInfoSection';
import { LocationSection } from './sections/LocationSection';
import { DetailsSection } from './sections/DetailsSection';
import { FarmPricingSection } from './sections/FarmPricingSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { ContactSection } from './sections/ContactSection';
import { EditPhotosSection } from './EditPhotosSection';
import { FarmAvailabilityCalendar } from '@/features/bookings/components/FarmAvailabilityCalendar';
import { FormShell } from './FormShell';

export default function EditPropertyForm() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const schema = useMemo(
    () =>
      editPropertySchema({
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

  const form = useForm<EditPropertyValues>({
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

  useEffect(() => {
    if (!id) return;
    fetchPropertyForEdit(id)
      .then((property) => {
        const features = Array.isArray(property.features) ? property.features : [];
        // Merge furnished boolean back into features array
        const mergedFeatures =
          property.furnished && !features.includes('furnished')
            ? [...features, 'furnished']
            : features;

        form.reset({
          title: property.title ?? '',
          description: property.description ?? '',
          property_type: property.property_type as EditPropertyValues['property_type'],
          listing_type: property.listing_type as EditPropertyValues['listing_type'],
          price: property.price,
          currency: property.currency as EditPropertyValues['currency'],
          governorate_id: property.governorate_id ?? '',
          area_id: property.area_id ?? '',
          address: property.address ?? '',
          area_size: property.area_size ?? undefined,
          rooms: property.rooms ?? undefined,
          bathrooms: property.bathrooms ?? undefined,
          living_rooms: property.living_rooms ?? 0,
          kitchens: property.kitchens ?? 1,
          floor: property.floor ?? undefined,
          total_floors: property.total_floors ?? undefined,
          building_age: property.building_age ?? undefined,
          direction: property.direction ?? undefined,
          view: property.view ?? undefined,
          daily_price: property.daily_price ?? undefined,
          weekly_price: property.weekly_price ?? undefined,
          monthly_price: property.monthly_price ?? undefined,
          min_booking_days: property.min_booking_days ?? undefined,
          max_booking_days: property.max_booking_days ?? undefined,
          features: mergedFeatures,
          payment_method: property.payment_method ?? undefined,
          ownership_type: property.ownership_type ?? undefined,
          contact_phone: property.contact_phone ?? '',
          whatsapp: property.whatsapp ?? '',
          video_url: property.video_url ?? '',
          images: [],
        });

        setExistingImages(property.property_images ?? []);
        setIsLoading(false);
      })
      .catch(() => {
        setLoadError(t.property.error.notFound);
        setIsLoading(false);
      });
  }, [id, form, t.property.error.notFound]);

  function handleRemoveExisting(imageId: string) {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    setRemovedImageIds((prev) => [...prev, imageId]);
  }

  function handleSetCoverExisting(imageId: string) {
    setExistingImages((prev) => prev.map((img) => ({ ...img, is_cover: img.id === imageId })));
  }

  const { mutate, isPending } = useEditProperty({
    propertyId: id!,
    existingImages,
    removedImageIds,
  });

  const watchedType = useWatch({ control: form.control, name: 'property_type' });

  function scrollToFirstError() {
    requestAnimationFrame(() => {
      const firstInvalid = document.querySelector('[aria-invalid="true"]') as HTMLElement | null;
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus?.();
      }
    });
  }

  function onSubmit(values: EditPropertyValues) {
    mutate(values);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">{loadError}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(PATHS.officeProperties)}>
          {t.property.actions.cancel}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-1 pb-28">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t.property.form.editTitle}</h1>
        <p className="text-muted-foreground">{t.property.form.editSubtitle}</p>
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
          <EditPhotosSection
            existingImages={existingImages}
            onRemoveExisting={handleRemoveExisting}
            onSetCoverExisting={handleSetCoverExisting}
          />
        </form>
      </Form>

      {/* Read-only availability calendar — farm listings only */}
      {watchedType === 'farm' && id && (
        <div className="mt-4">
          <FormShell title={t.property.farm.availability}>
            <FarmAvailabilityCalendar propertyId={id} />
          </FormShell>
        </div>
      )}

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
                {t.property.actions.saving}
              </>
            ) : (
              t.property.actions.save
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
