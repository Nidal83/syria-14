import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBooking, type CreateBookingArgs } from '../api/bookings.service';

/**
 * Submits a pending booking request, then refreshes the user's bookings list
 * and the property's availability calendar so the new range shows as taken.
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: CreateBookingArgs) => createBooking(args),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['property-bookings', variables.propertyId] });
    },
  });
}
