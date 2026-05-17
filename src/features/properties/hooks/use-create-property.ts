import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/lib/i18n/context';
import { PATHS } from '@/routes/paths';
import { getMyOffice, insertProperty, updateFeaturedImage } from '../api/properties.service';
import { uploadPropertyImage, insertPropertyImage } from '../api/property-images.service';
import type { CreatePropertyValues } from '../schemas/property.schema';

interface MutationResult {
  propertyId: string;
  someImagesFailed: boolean;
}

export function useCreateProperty() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  return useMutation<MutationResult, Error, CreatePropertyValues>({
    mutationFn: async (values) => {
      if (!profile?.id) throw new Error('Not authenticated');

      // 1. Get the office this user owns
      const office = await getMyOffice(profile.id);
      if (!office) throw new Error(t.property.error.createFailed);

      // 2. Insert property row (images are handled separately)
      const property = await insertProperty({
        ...values,
        office_id: office.id,
        status: 'active',
        city: '',
        furnished: values.features.includes('furnished'),
      });

      // 3. Upload images in order
      let someImagesFailed = false;
      let firstSuccessUrl: string | null = null;

      for (let i = 0; i < values.images.length; i++) {
        const file = values.images[i];
        const url = await uploadPropertyImage(office.id, property.id, file);

        if (!url) {
          someImagesFailed = true;
          continue;
        }

        await insertPropertyImage({
          property_id: property.id,
          image_url: url,
          is_cover: i === 0 && !firstSuccessUrl,
        });

        if (!firstSuccessUrl) firstSuccessUrl = url;
      }

      // 4. Set featured_image on the property row
      if (firstSuccessUrl) {
        await updateFeaturedImage(property.id, firstSuccessUrl);
      }

      return { propertyId: property.id, someImagesFailed };
    },

    onSuccess: ({ someImagesFailed }) => {
      if (someImagesFailed) {
        toast.warning(t.property.warning.partialImages);
      } else {
        toast.success(t.property.success.created);
      }
      navigate(PATHS.officeProperties);
    },

    onError: (err) => {
      toast.error(err.message || t.property.error.createFailed);
    },
  });
}
