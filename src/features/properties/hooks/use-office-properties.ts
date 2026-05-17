import { useQuery } from '@tanstack/react-query';
import { listOfficeProperties } from '../api/properties.service';

export function useOfficeProperties(officeId: string | undefined) {
  return useQuery({
    queryKey: ['office-properties', officeId],
    queryFn: () => listOfficeProperties(officeId!),
    enabled: Boolean(officeId),
    staleTime: 30_000,
  });
}
