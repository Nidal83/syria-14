import { useQuery } from '@tanstack/react-query';
import { listOfficeBookings } from '../api/bookings.service';

interface Options {
  /** Skip fetching (e.g. for non-office dashboards). Defaults to enabled. */
  enabled?: boolean;
}

/**
 * All bookings on the current office's properties. Refetches every 30s so the
 * sidebar pending-count badge and the inbox stay current.
 */
export function useOfficeBookings({ enabled = true }: Options = {}) {
  return useQuery({
    queryKey: ['office-bookings'],
    queryFn: listOfficeBookings,
    enabled,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
