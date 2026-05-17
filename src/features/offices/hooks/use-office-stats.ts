import { useQuery } from '@tanstack/react-query';
import { getOfficeStats } from '../api/office.service';

export function useOfficeStats(officeId: string | undefined) {
  return useQuery({
    queryKey: ['office-stats', officeId],
    queryFn: () => getOfficeStats(officeId!),
    enabled: Boolean(officeId),
    staleTime: 60_000,
  });
}
