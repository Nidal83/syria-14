import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateCurrentOffice, type OfficePatch } from '../api/office.service';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/providers/AuthProvider';

export function useUpdateOffice() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: (patch: OfficePatch) => updateCurrentOffice(profile!.id, patch),
    onSuccess: () => {
      toast.success(t.office.form.saved);
      queryClient.invalidateQueries({ queryKey: ['current-office', profile?.id] });
    },
    onError: (err: Error) => {
      toast.error(err.message || t.common.error);
    },
  });
}
