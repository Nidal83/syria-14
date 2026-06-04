import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBookingStatus } from '../api/bookings.service';

interface Variables {
  bookingId: string;
  note?: string;
  /** The booking's property, so its availability calendar refreshes too. */
  propertyId?: string;
}

/**
 * Cancels one of the current user's own bookings via the SECURITY DEFINER RPC
 * (which enforces `pending`/`confirmed` → `cancelled`, user-only), then
 * refreshes the user's bookings list and the property's calendar.
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, note }: Variables) =>
      updateBookingStatus({ bookingId, newStatus: 'cancelled', note }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      if (variables.propertyId) {
        queryClient.invalidateQueries({ queryKey: ['property-bookings', variables.propertyId] });
      }
    },
  });
}
