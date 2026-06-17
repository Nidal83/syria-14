import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { CalendarCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/providers/AuthProvider';
import { PATHS } from '@/routes/paths';
import { listBookingsForProperty, BookingOverlapError } from '../api/bookings.service';
import { useCreateBooking } from '../hooks/useCreateBooking';
import {
  bookedDateSet,
  countNights,
  computeBookingTotal,
  expandRange,
  toKey,
  toISOTimestamp,
} from '../lib/dates';

export interface BookingRequestProperty {
  id: string;
  title: string;
  daily_price: number | null;
  weekly_price: number | null;
  monthly_price: number | null;
  currency: string;
  min_booking_days: number | null;
  max_booking_days: number | null;
  default_checkin_time: string | null;
  default_checkout_time: string | null;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Customer-facing booking widget for a farm listing. Pick an available date
 * range, see the live total, and submit a pending request. The office then
 * confirms or rejects it from the 2b inbox.
 */
export function BookingRequestCard({ property }: { property: BookingRequestProperty }) {
  const { t, locale } = useI18n();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { mutate, isPending } = useCreateBooking();

  const [range, setRange] = useState<DateRange | undefined>();
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: ranges = [] } = useQuery({
    queryKey: ['property-bookings', property.id],
    queryFn: () => listBookingsForProperty(property.id),
    staleTime: 30_000,
  });

  const booked = useMemo(() => bookedDateSet(ranges), [ranges]);
  const today = useMemo(startOfToday, []);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d;
  }, []);

  // Nightly rate: prefer the daily tier; fall back to a derived rate so a farm
  // priced only weekly/monthly can still be booked (total stays nights × rate).
  const nightlyRate =
    property.daily_price ??
    (property.weekly_price != null
      ? property.weekly_price / 7
      : property.monthly_price != null
        ? property.monthly_price / 30
        : null);

  const nights = range?.from && range?.to ? countNights(range.from, range.to) : 0;
  const total = nightlyRate != null ? computeBookingTotal(nightlyRate, nights) : 0;

  function fmt(value: number): string {
    const currency =
      t.property.currency[property.currency as keyof typeof t.property.currency] ??
      property.currency;
    return `${Math.round(value).toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US')} ${currency}`;
  }

  function handleSubmit() {
    if (!isAuthenticated) {
      navigate(PATHS.login);
      return;
    }
    if (!range?.from || !range?.to) {
      toast.error(t.bookings.customer.selectRange);
      return;
    }
    if (nightlyRate == null) {
      toast.error(t.bookings.customer.toast.failed);
      return;
    }

    const minNights = property.min_booking_days ?? 1;
    if (nights < minNights) {
      toast.error(t.bookings.customer.minNights.replace('{n}', String(minNights)));
      return;
    }
    if (property.max_booking_days != null && nights > property.max_booking_days) {
      toast.error(t.bookings.customer.maxNights.replace('{n}', String(property.max_booking_days)));
      return;
    }

    const startKey = toKey(range.from);
    const endKey = toKey(range.to);
    if (expandRange(startKey, endKey).some((k) => booked.has(k))) {
      toast.error(t.bookings.customer.toast.overlap);
      return;
    }

    mutate(
      {
        propertyId: property.id,
        startAt: toISOTimestamp(range.from, property.default_checkin_time),
        endAt: toISOTimestamp(range.to, property.default_checkout_time),
        dailyRate: Math.round(nightlyRate * 100) / 100,
        currency: property.currency,
        totalPrice: Math.round(total * 100) / 100,
        customerNote: note,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          toast.success(t.bookings.customer.toast.requestSuccess);
        },
        onError: (err) => {
          if (err instanceof BookingOverlapError) {
            toast.error(t.bookings.customer.toast.overlap);
          } else {
            toast.error(t.bookings.customer.toast.failed);
          }
        },
      },
    );
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-5 text-center shadow-card">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-600" />
        <p className="mb-1 font-semibold">{t.bookings.customer.requestSent}</p>
        <p className="mb-4 text-sm text-muted-foreground">{t.bookings.customer.requestSentDesc}</p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(PATHS.accountBookings)}
        >
          {t.bookings.customer.myBookings}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <CalendarCheck className="h-5 w-5 text-primary" />
        <h3 className="font-bold">{t.bookings.customer.requestTitle}</h3>
      </div>

      {/* Price tiers */}
      <div className="mb-4">
        {nightlyRate != null && (
          <p className="text-2xl font-extrabold text-primary">
            {fmt(nightlyRate)}{' '}
            <span className="text-sm font-medium text-muted-foreground">
              {t.bookings.customer.perNight}
            </span>
          </p>
        )}
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
          {property.weekly_price != null && (
            <span>
              {t.property.farm.weeklyPrice}: {fmt(property.weekly_price)}
            </span>
          )}
          {property.monthly_price != null && (
            <span>
              {t.property.farm.monthlyPrice}: {fmt(property.monthly_price)}
            </span>
          )}
        </div>
      </div>

      <Label className="mb-2 block text-sm">{t.bookings.customer.selectDates}</Label>
      <div className="mb-3 flex justify-center rounded-xl border border-border/50">
        <Calendar
          mode="range"
          selected={range}
          onSelect={setRange}
          fromDate={today}
          toDate={maxDate}
          disabled={[{ before: today }, (date: Date) => booked.has(toKey(date))]}
          modifiers={{ booked: (date: Date) => booked.has(toKey(date)) }}
          modifiersClassNames={{ booked: 'line-through opacity-60' }}
        />
      </div>

      {/* Legend */}
      <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
          {t.calendar.legend.available}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          {t.calendar.legend.booked}
        </span>
      </div>

      <div className="mb-4 space-y-2">
        <Label htmlFor="booking-note" className="text-sm">
          {t.bookings.customer.noteLabel}
        </Label>
        <Textarea
          id="booking-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t.bookings.customer.notePlaceholder}
        />
      </div>

      {/* Total */}
      {nights > 0 && nightlyRate != null && (
        <div className="mb-4 flex items-center justify-between border-t border-border/50 pt-3">
          <span className="text-sm text-muted-foreground">
            {t.bookings.customer.nights.replace('{n}', String(nights))}
          </span>
          <span className="text-lg font-bold">{fmt(total)}</span>
        </div>
      )}

      <Button className="w-full gap-2" onClick={handleSubmit} disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isAuthenticated ? t.bookings.customer.request : t.bookings.customer.loginToBook}
      </Button>
    </div>
  );
}
