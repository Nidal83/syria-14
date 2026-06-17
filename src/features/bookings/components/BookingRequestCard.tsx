import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { CalendarCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  day_use_allowed: boolean | null;
  min_booking_hours: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return toKey(a) === toKey(b);
}

// "14:00:00" or "14:00" → "14:00" (for <input type="time"> value)
function toHHMM(t: string | null | undefined, fallback: string): string {
  if (!t) return fallback;
  return t.slice(0, 5);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BookingRequestCard({ property }: { property: BookingRequestProperty }) {
  const { t, locale } = useI18n();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { mutate, isPending } = useCreateBooking();

  const isDayUse = property.day_use_allowed === true;

  const [range, setRange] = useState<DateRange | undefined>();
  // Time pickers — initialised from property defaults, editable by the user.
  const [arrivalTime, setArrivalTime] = useState(() =>
    toHHMM(property.default_checkin_time, '14:00'),
  );
  const [departureTime, setDepartureTime] = useState(() =>
    toHHMM(property.default_checkout_time, '12:00'),
  );
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

  // ── Mode detection ──────────────────────────────────────────────────────────
  // Day-use: property allows it AND single day is selected (range.to absent or
  // same day as range.from).
  const isDayUseMode =
    isDayUse && Boolean(range?.from) && (!range?.to || isSameDay(range.from!, range.to));
  // Overnight: range spans at least two different calendar days.
  const isOvernightMode = Boolean(range?.from && range?.to && !isSameDay(range.from!, range.to!));
  const hasSelection = isDayUseMode || isOvernightMode;
  // Waiting for check-out tap (overnight-only property, start chosen, end not).
  const needsCheckout = !isDayUse && Boolean(range?.from) && !range?.to;

  // ── Pricing ─────────────────────────────────────────────────────────────────
  const nightlyRate =
    property.daily_price ??
    (property.weekly_price != null
      ? property.weekly_price / 7
      : property.monthly_price != null
        ? property.monthly_price / 30
        : null);

  // ── Timestamps ──────────────────────────────────────────────────────────────
  // Build ISO timestamps from the calendar date(s) + user-editable time inputs.
  const startISO = hasSelection ? toISOTimestamp(range!.from!, arrivalTime) : null;
  const endISO = isDayUseMode
    ? toISOTimestamp(range!.from!, departureTime) // same calendar day
    : isOvernightMode
      ? toISOTimestamp(range!.to!, departureTime)
      : null;

  // ── Duration / totals ───────────────────────────────────────────────────────
  const nights = isOvernightMode ? countNights(range!.from!, range!.to!) : 0;
  const durationMs =
    isDayUseMode && startISO && endISO
      ? new Date(endISO).getTime() - new Date(startISO).getTime()
      : 0;
  const durationH = durationMs / 3_600_000;
  const isValidTimes = !isDayUseMode || durationMs > 0;

  // Day-use bills 1 × daily rate; overnight bills nights × daily rate.
  const billableNights = isDayUseMode ? 1 : nights;
  const total =
    nightlyRate != null && hasSelection ? computeBookingTotal(nightlyRate, billableNights) : 0;

  // ── Formatters ──────────────────────────────────────────────────────────────
  const dateLocale = locale === 'ar' ? 'ar-SY' : 'en-GB';

  function fmtPrice(value: number): string {
    const currencyLabel =
      t.property.currency[property.currency as keyof typeof t.property.currency] ??
      property.currency;
    return `${Math.round(value).toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US')} ${currencyLabel}`;
  }

  function fmtDate(d: Date): string {
    return d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  function handleSubmit() {
    if (!isAuthenticated) {
      navigate(PATHS.login);
      return;
    }
    if (!startISO || !endISO) {
      toast.error(isDayUse ? t.bookings.customer.selectDate : t.bookings.customer.selectRange);
      return;
    }
    if (nightlyRate == null) {
      toast.error(t.bookings.customer.toast.failed);
      return;
    }

    const startMs = new Date(startISO).getTime();
    const endMs = new Date(endISO).getTime();

    if (endMs <= startMs) {
      toast.error(t.bookings.customer.invalidTimes);
      return;
    }

    if (isDayUseMode) {
      const minMs = (property.min_booking_hours ?? 1) * 3_600_000;
      if (endMs - startMs < minMs) {
        toast.error(
          t.bookings.customer.minHours.replace('{n}', String(property.min_booking_hours ?? 1)),
        );
        return;
      }
    } else {
      const minNights = property.min_booking_days ?? 1;
      if (nights < minNights) {
        toast.error(t.bookings.customer.minNights.replace('{n}', String(minNights)));
        return;
      }
      if (property.max_booking_days != null && nights > property.max_booking_days) {
        toast.error(
          t.bookings.customer.maxNights.replace('{n}', String(property.max_booking_days)),
        );
        return;
      }
    }

    // Client-side overlap guard (the DB EXCLUDE constraint is authoritative).
    const startKey = toKey(range!.from!);
    const endKey = toKey(isDayUseMode ? range!.from! : range!.to!);
    if (expandRange(startKey, endKey).some((k) => booked.has(k))) {
      toast.error(t.bookings.customer.toast.overlap);
      return;
    }

    mutate(
      {
        propertyId: property.id,
        startAt: startISO,
        endAt: endISO,
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

  // ── Submitted state ─────────────────────────────────────────────────────────
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

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <CalendarCheck className="h-5 w-5 text-primary" />
        <h3 className="font-bold">{t.bookings.customer.requestTitle}</h3>
        {isDayUseMode && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {t.bookings.customer.dayUse}
          </span>
        )}
      </div>

      {/* Price tiers */}
      <div className="mb-4">
        {nightlyRate != null && (
          <p className="text-2xl font-extrabold text-primary">
            {fmtPrice(nightlyRate)}{' '}
            <span className="text-sm font-medium text-muted-foreground">
              {t.bookings.customer.perNight}
            </span>
          </p>
        )}
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
          {property.weekly_price != null && (
            <span>
              {t.property.farm.weeklyPrice}: {fmtPrice(property.weekly_price)}
            </span>
          )}
          {property.monthly_price != null && (
            <span>
              {t.property.farm.monthlyPrice}: {fmtPrice(property.monthly_price)}
            </span>
          )}
        </div>
      </div>

      {/* Calendar header */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <Label className="text-sm">{t.bookings.customer.selectDates}</Label>
        {isDayUse && !hasSelection && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {t.bookings.customer.dayUseHint}
          </span>
        )}
      </div>

      {/* Calendar */}
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

      {/* "Select check-out" nudge for overnight-only properties */}
      {needsCheckout && (
        <p className="mb-3 text-center text-xs text-muted-foreground">
          {t.bookings.customer.selectCheckout}
        </p>
      )}

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

      {/* ── Time pickers: Day Use ────────────────────────────────────────────── */}
      {isDayUseMode && (
        <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {t.bookings.customer.arrivalDate}
            </Label>
            <p className="text-sm font-medium">{fmtDate(range!.from!)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {t.bookings.customer.arrivalTime}
            </Label>
            <Input
              type="time"
              dir="ltr"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {t.bookings.customer.departureDate}
            </Label>
            <p className="text-sm font-medium">{fmtDate(range!.from!)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {t.bookings.customer.departureTime}
            </Label>
            <Input
              type="time"
              dir="ltr"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      {/* ── Time pickers: Overnight ──────────────────────────────────────────── */}
      {isOvernightMode && (
        <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t.bookings.customer.arrival}</Label>
            <p className="text-sm font-medium">{fmtDate(range!.from!)}</p>
            <Input
              type="time"
              dir="ltr"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t.bookings.customer.departure}</Label>
            <p className="text-sm font-medium">{fmtDate(range!.to!)}</p>
            <Input
              type="time"
              dir="ltr"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      {/* ── Booking summary ──────────────────────────────────────────────────── */}
      {hasSelection && nightlyRate != null && (
        <div className="mb-4 rounded-xl border border-border/50 bg-muted/30 p-4 text-sm">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.bookings.customer.summary}
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">{t.bookings.customer.arrival}</span>
              <span className="font-medium tabular-nums">
                {fmtDate(range!.from!)} · {arrivalTime}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">
                {t.bookings.customer.departure}
              </span>
              <span className="font-medium tabular-nums">
                {isDayUseMode ? fmtDate(range!.from!) : fmtDate(range!.to!)} · {departureTime}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between border-t border-border/50 pt-3">
            <span className={isValidTimes ? 'text-muted-foreground' : 'text-destructive'}>
              {isDayUseMode
                ? isValidTimes
                  ? t.bookings.customer.duration.replace(
                      '{n}',
                      String(Math.round(durationH * 10) / 10),
                    )
                  : t.bookings.customer.invalidTimes
                : t.bookings.customer.nights.replace('{n}', String(nights))}
            </span>
            {isValidTimes && (
              <span className="text-lg font-bold text-primary">{fmtPrice(total)}</span>
            )}
          </div>
        </div>
      )}

      {/* Note */}
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

      <Button className="w-full gap-2" onClick={handleSubmit} disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isAuthenticated ? t.bookings.customer.request : t.bookings.customer.loginToBook}
      </Button>
    </div>
  );
}
