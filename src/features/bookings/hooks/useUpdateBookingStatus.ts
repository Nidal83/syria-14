import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBookingStatus } from '../api/bookings.service';

interface Variables {
  bookingId: string;
  newStatus: 'confirmed' | 'rejected' | 'completed';
  note?: string;
  /** Optional: the property whose calendar should also refresh. */
  propertyId?: string;
}

/**
 * Transitions a booking via the SECURITY DEFINER RPC, then refreshes the
 * office inbox and the affected property's calendar.
 */
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, newStatus, note }: Variables) =>
      updateBookingStatus({ bookingId, newStatus, note }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['office-bookings'] });
      if (variables.propertyId) {
        queryClient.invalidateQueries({ queryKey: ['property-bookings', variables.propertyId] });
      }
    },
  });
}
