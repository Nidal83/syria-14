import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updatePropertyStatus, type OfficeProperty } from '../api/properties.service';
import { useI18n } from '@/lib/i18n/context';

export function useToggleVisibility(officeId: string | undefined) {
  const queryClient = useQueryClient();
  const { t } = useI18n();

  return useMutation({
    mutationFn: ({ propertyId, status }: { propertyId: string; status: 'active' | 'hidden' }) =>
      updatePropertyStatus(propertyId, status),

    onMutate: async ({ propertyId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['office-properties', officeId] });
      const previous = queryClient.getQueryData<OfficeProperty[]>(['office-properties', officeId]);
      queryClient.setQueryData<OfficeProperty[]>(['office-properties', officeId], (old) =>
        old ? old.map((p) => (p.id === propertyId ? { ...p, status } : p)) : old,
      );
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['office-properties', officeId], ctx?.previous);
      toast.error(t.common.error);
    },

    onSuccess: (_data, { status }) => {
      toast.success(
        status === 'hidden' ? t.property.actions.hiddenSuccess : t.property.actions.shownSuccess,
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['office-properties', officeId] });
    },
  });
}
