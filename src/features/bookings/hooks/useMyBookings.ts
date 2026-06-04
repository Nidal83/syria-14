import { useQuery } from '@tanstack/react-query';
import { listMyBookings } from '../api/bookings.service';

/** Every booking made by the current user, newest first. */
export function useMyBookings() {
  return useQuery({
    queryKey: ['my-bookings'],
    queryFn: listMyBookings,
    staleTime: 30_000,
  });
}
