import { useState } from 'react';
import { Phone, Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { BookingStatusBadge } from './BookingStatusBadge';
import type { OfficeBooking } from '../api/bookings.service';

interface Props {
  booking: OfficeBooking;
  onConfirm: (booking: OfficeBooking) => void;
  onReject: (booking: OfficeBooking) => void;
}

function nightsBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

export function BookingListItem({ booking, onConfirm, onReject }: Props) {
  const { t, locale } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const dateLocale = locale === 'ar' ? 'ar-SY' : 'en-GB';
  const fmt = (d: string) => new Date(d).toLocaleDateString(dateLocale);
  const nights = nightsBetween(booking.start_date, booking.end_date);
  const customerName = booking.customer?.name || t.bookings.list.customer;
  const phone = booking.customer?.phone;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left — property + customer + dates */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{booking.property?.title ?? '—'}</p>
            {booking.property?.reference_id && (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                {booking.property.reference_id}
              </code>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{customerName}</span>
            {phone && (
              <>
                {' · '}
                <a href={`tel:${phone}`} dir="ltr" className="text-primary hover:underline">
                  {phone}
                </a>
              </>
            )}
          </p>

          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {fmt(booking.start_date)} – {fmt(booking.end_date)}
            <span className="text-foreground">
              · {t.bookings.list.nights.replace('{n}', String(nights))}
            </span>
          </p>
        </div>

        {/* Middle — price + note */}
        <div className="min-w-0 space-y-1 sm:max-w-[14rem] sm:text-end">
          <p className="font-bold text-primary">
            {booking.total_price.toLocaleString(dateLocale)} {booking.currency}
          </p>
          {booking.customer_note && (
            <p className={cn('text-xs text-muted-foreground', !expanded && 'line-clamp-2')}>
              {booking.customer_note}
            </p>
          )}
        </div>

        {/* Right — status + actions */}
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <BookingStatusBadge status={booking.status} />
          <div className="flex flex-wrap gap-2">
            {booking.status === 'pending' && (
              <>
                <Button size="sm" onClick={() => onConfirm(booking)}>
                  {t.bookings.actions.confirm}
                </Button>
                <Button size="sm" variant="outline" onClick={() => onReject(booking)}>
                  {t.bookings.actions.reject}
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              {t.bookings.actions.details}
              <ChevronDown
                className={cn('ms-1 h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Details */}
      {expanded && (
        <dl className="mt-4 grid gap-x-6 gap-y-2 border-t border-border/60 pt-4 text-sm sm:grid-cols-2">
          {booking.customer?.email && (
            <div className="flex items-center gap-1.5">
              <dt className="text-muted-foreground">{t.bookings.list.customer}:</dt>
              <dd dir="ltr">{booking.customer.email}</dd>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <dd dir="ltr">{phone}</dd>
            </div>
          )}
          {booking.customer_note && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">{t.bookings.list.note}:</dt>
              <dd className="whitespace-pre-line">{booking.customer_note}</dd>
            </div>
          )}
          {booking.office_note && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">{t.bookings.reject.noteLabel}:</dt>
              <dd className="whitespace-pre-line">{booking.office_note}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
