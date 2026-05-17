import { useQuery } from '@tanstack/react-query';
import { getCurrentOffice } from '../api/office.service';

export function useCurrentOffice(userId: string | undefined) {
  return useQuery({
    queryKey: ['current-office', userId],
    queryFn: () => getCurrentOffice(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}
