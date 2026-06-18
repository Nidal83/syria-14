import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, CalendarX2, Calendar, Home } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { PATHS } from '@/routes/paths';
import { useMyBookings } from '@/features/bookings/hooks/useMyBookings';
import { useCancelBooking } from '@/features/bookings/hooks/useCancelBooking';
import { BookingStatusBadge } from '@/features/bookings/components/BookingStatusBadge';
import { countNights } from '@/features/bookings/lib/dates';
import type { CustomerBooking } from '@/features/bookings/api/bookings.service';

const CANCELLABLE = new Set(['pending', 'confirmed']);

function CustomerBookingCard({
  booking,
  highlighted,
}: {
  booking: CustomerBooking;
  highlighted: boolean;
}) {
  const { t, locale } = useI18n();
  const { mutate, isPending } = useCancelBooking();

  const dateLocale = locale === 'ar' ? 'ar-SY' : 'en-GB';
  const fmt = (d: string) => new Date(d).toLocaleDateString(dateLocale);
  const nights = countNights(new Date(booking.start_at), new Date(booking.end_at));
  const property = booking.property;

  function handleCancel() {
    mutate(
      { bookingId: booking.id, propertyId: booking.property_id },
      {
        onSuccess: () => toast.success(t.bookings.customer.toast.cancelled),
        onError: () => toast.error(t.bookings.customer.toast.failed),
      },
    );
  }

  return (
    <div
      className={cn(
        'flex gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm',
        highlighted && 'ring-2 ring-primary',
      )}
    >
      {/* Thumbnail */}
      <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
        {property?.featured_image ? (
          <img
            src={property.featured_image}
            alt={property.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Home className="h-6 w-6 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          {property?.slug || property?.id ? (
            <Link
              to={PATHS.propertyDetail(property.slug ?? property.id)}
              className="truncate font-semibold hover:text-primary hover:underline"
            >
              {property?.title ?? '—'}
            </Link>
          ) : (
            <p className="truncate font-semibold">{property?.title ?? '—'}</p>
          )}
          <BookingStatusBadge status={booking.status} />
        </div>

        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          {fmt(booking.start_at)} – {fmt(booking.end_at)}
          <span className="text-foreground">
            ·{' '}
            {nights === 0
              ? t.bookings.customer.dayUse
              : t.bookings.customer.nights.replace('{n}', String(nights))}
          </span>
        </p>

        <div className="flex items-center justify-between gap-2 pt-1">
          <p className="font-bold text-primary">
            {booking.total_price.toLocaleString(dateLocale)} {booking.currency}
          </p>

          {CANCELLABLE.has(booking.status) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={isPending}>
                  {isPending && <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" />}
                  {t.bookings.customer.cancel}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.bookings.customer.cancel}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.bookings.customer.cancelConfirm}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.bookings.customer.keepBooking}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t.bookings.customer.cancel}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const { t } = useI18n();
  const { id: highlightedId } = useParams<{ id: string }>();
  const { data: bookings = [], isLoading } = useMyBookings();

  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t.bookings.customer.myBookings}</h1>
        <p className="text-muted-foreground">{t.bookings.customer.mySubtitle}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <CalendarX2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="mb-4 text-muted-foreground">{t.bookings.customer.empty}</p>
          <Button asChild variant="outline">
            <Link to={PATHS.properties}>{t.nav.properties}</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <CustomerBookingCard
              key={booking.id}
              booking={booking}
              highlighted={booking.id === highlightedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
