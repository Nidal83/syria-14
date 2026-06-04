import type { PropertyBookingRange } from '../api/bookings.service';

// ── Local-time date helpers (no TZ drift) ───────────────────────────────────
// Bookings store plain `date` values (YYYY-MM-DD). Parsing them with the Date
// constructor would interpret the string as UTC midnight and shift the day in
// negative-offset timezones, so we build the date in local time explicitly.

export function parseISO(d: string): Date {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day);
}

export function toKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Every calendar day from start to end, inclusive, as `YYYY-MM-DD` keys. */
export function expandRange(start: string, end: string): string[] {
  const out: string[] = [];
  const cur = parseISO(start);
  const last = parseISO(end);
  while (cur <= last) {
    out.push(toKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/**
 * Whole-day difference between two dates (end − start), i.e. the number of
 * nights in a booking. `end_date > start_date` is enforced by the DB, so this
 * is always ≥ 1 for a valid booking.
 */
export function countNights(start: Date, end: Date): number {
  const ms = parseISO(toKey(end)).getTime() - parseISO(toKey(start)).getTime();
  return Math.round(ms / 86_400_000);
}

/** total = nights × daily price. See plan: weekly/monthly are display-only. */
export function computeBookingTotal(dailyPrice: number, nights: number): number {
  return dailyPrice * nights;
}

/**
 * Flatten pending/confirmed booking ranges into the set of occupied
 * `YYYY-MM-DD` keys — used as react-day-picker `disabled` matchers and for
 * pre-submit overlap checks.
 */
export function bookedDateSet(ranges: PropertyBookingRange[]): Set<string> {
  const set = new Set<string>();
  for (const r of ranges) {
    for (const key of expandRange(r.start_date, r.end_date)) set.add(key);
  }
  return set;
}
