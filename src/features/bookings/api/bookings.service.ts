import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Booking = Database['public']['Tables']['bookings']['Row'];
export type BookingStatus = Database['public']['Enums']['booking_status'];

export interface BookingProperty {
  id: string;
  title: string;
  reference_id: string;
  property_type: string;
}

export interface BookingCustomer {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface OfficeBooking extends Booking {
  property: BookingProperty | null;
  customer: BookingCustomer | null;
}

/**
 * Returns every booking on properties owned by the current office, newest
 * first. RLS does the office-scoping, so the query itself is unfiltered.
 *
 * Customer details are fetched in a second query rather than embedded:
 * `bookings.user_id` references `auth.users` (not `public.profiles`), so it
 * cannot be embedded via PostgREST, and the `profiles` RLS only exposes rows
 * the caller is allowed to read. Customers therefore degrade gracefully to
 * `null` when the office has no read access to that profile.
 */
export async function listOfficeBookings(): Promise<OfficeBooking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`*, property:property_id ( id, title, reference_id, property_type )`)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as unknown as (Booking & { property: BookingProperty | null })[];

  const userIds = [
    ...new Set(rows.map((r) => r.user_id).filter((id): id is string => Boolean(id))),
  ];
  const customers = new Map<string, BookingCustomer>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email, phone')
      .in('id', userIds);
    for (const p of profiles ?? []) customers.set(p.id, p as BookingCustomer);
  }

  return rows.map((r) => ({
    ...r,
    property: r.property ?? null,
    customer: r.user_id ? (customers.get(r.user_id) ?? null) : null,
  }));
}

/**
 * Calls the SECURITY DEFINER function from Feature 2a. The function enforces
 * who may transition to what; the client just passes intent.
 */
export async function updateBookingStatus(args: {
  bookingId: string;
  newStatus: 'confirmed' | 'rejected' | 'completed';
  note?: string;
}): Promise<Booking> {
  const { data, error } = await supabase.rpc('update_booking_status', {
    p_booking_id: args.bookingId,
    p_new_status: args.newStatus,
    p_note: args.note ?? null,
  });
  if (error) throw error;
  return data as Booking;
}

export interface PropertyBookingRange {
  id: string;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  user_id: string | null;
}

/**
 * Fetch pending + confirmed bookings for a single property — used by the
 * availability calendar to mark already-booked dates.
 */
export async function listBookingsForProperty(propertyId: string): Promise<PropertyBookingRange[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, start_date, end_date, status, user_id')
    .eq('property_id', propertyId)
    .in('status', ['pending', 'confirmed']);
  if (error) throw error;
  return (data ?? []) as PropertyBookingRange[];
}
