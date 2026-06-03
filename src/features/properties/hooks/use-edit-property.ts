import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import {
  fetchPropertyForEdit,
  updatePropertyFields,
  updateFeaturedImage,
} from '../api/properties.service';
import type { ExistingImage } from '../api/properties.service';
import {
  uploadPropertyImage,
  insertPropertyImage,
  deletePropertyImage,
} from '../api/property-images.service';
import type { EditPropertyValues } from '../schemas/property.schema';

interface UseEditPropertyOptions {
  propertyId: string;
  existingImages: ExistingImage[];
  removedImageIds: string[];
}

export function useEditProperty({
  propertyId,
  existingImages,
  removedImageIds,
}: UseEditPropertyOptions) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  return useMutation<{ someImagesFailed: boolean }, Error, EditPropertyValues>({
    mutationFn: async (values) => {
      if (!profile?.id) throw new Error('Not authenticated');

      // 1. Fetch office_id from the existing property (needed for storage path)
      const existing = await fetchPropertyForEdit(propertyId);

      // 2. Update property fields
      await updatePropertyFields(propertyId, {
        title: values.title,
        description: values.description,
        property_type: values.property_type,
        listing_type: values.listing_type,
        price: values.price,
        currency: values.currency,
        governorate_id: values.governorate_id,
        area_id: values.area_id,
        address: values.address,
        area_size: values.area_size,
        rooms: values.rooms,
        bathrooms: values.bathrooms,
        living_rooms: values.living_rooms ?? 0,
        kitchens: values.kitchens ?? 1,
        floor: values.floor ?? null,
        total_floors: values.total_floors ?? null,
        building_age: values.building_age ?? null,
        direction: values.direction ?? null,
        view: values.view ?? null,
        features: values.features,
        furnished: values.features.includes('furnished'),
        payment_method: values.payment_method ?? null,
        ownership_type: values.ownership_type ?? null,
        contact_phone: values.contact_phone,
        whatsapp: values.whatsapp ?? null,
        video_url: values.video_url ?? null,
        daily_price: values.daily_price ?? null,
        weekly_price: values.weekly_price ?? null,
        monthly_price: values.monthly_price ?? null,
        min_booking_days: values.min_booking_days ?? null,
        max_booking_days: values.max_booking_days ?? null,
        office_id: existing.office_id,
      });

      // 3. Delete removed images
      for (const id of removedImageIds) {
        await deletePropertyImage(id);
      }

      // 4. Upload new images
      let someImagesFailed = false;
      let firstNewUrl: string | null = null;

      for (let i = 0; i < values.images.length; i++) {
        const file = values.images[i];
        const url = await uploadPropertyImage(existing.office_id, propertyId, file);

        if (!url) {
          someImagesFailed = true;
          continue;
        }

        const remainingExisting = existingImages.filter((img) => !removedImageIds.includes(img.id));
        const isCover = remainingExisting.length === 0 && i === 0 && !firstNewUrl;

        await insertPropertyImage({ property_id: propertyId, image_url: url, is_cover: isCover });

        if (!firstNewUrl) firstNewUrl = url;
      }

      // 5. Update featured_image if all existing were removed and we uploaded new ones
      const remainingExisting = existingImages.filter((img) => !removedImageIds.includes(img.id));
      if (remainingExisting.length === 0 && firstNewUrl) {
        await updateFeaturedImage(propertyId, firstNewUrl);
      } else if (remainingExisting.length > 0) {
        const cover = remainingExisting.find((img) => img.is_cover) ?? remainingExisting[0];
        await updateFeaturedImage(propertyId, cover.image_url);
      }

      return { someImagesFailed };
    },

    onSuccess: ({ someImagesFailed }) => {
      if (someImagesFailed) {
        toast.warning(t.property.warning.partialImagesUpdate);
      } else {
        toast.success(t.property.success.updated);
      }
      navigate(PATHS.officeProperties);
    },

    onError: (err) => {
      toast.error(err.message || t.property.error.updateFailed);
    },
  });
}
