import type { PropertyBookingRange } from '../api/bookings.service';

// ── Local-time date-key helpers ──────────────────────────────────────────────
// These operate on YYYY-MM-DD strings built from the user's local clock.
// Used for calendar date selection (react-day-picker) and range arithmetic.

export function parseISO(d: string): Date {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day);
}

export function toKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// ── Timestamp ↔ date-key helpers ─────────────────────────────────────────────

/**
 * Extract a YYYY-MM-DD date key from a timestamptz ISO string using the UTC
 * date components. Supabase runs UTC, so this matches how the DB stores times.
 */
export function tsToDateKey(ts: string): string {
  const d = new Date(ts);
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${d.getUTCFullYear()}-${m}-${day}`;
}

/**
 * Build a UTC ISO timestamp from a calendar date + a Postgres `time` string
 * (e.g. '14:00:00'). Date components are read in local time because
 * react-day-picker produces dates in the user's timezone; the resulting UTC
 * timestamp is what the DB stores.
 */
export function toISOTimestamp(date: Date, timeStr: string | null | undefined): string {
  const parts = (timeStr ?? '14:00:00').split(':').map(Number);
  const h = parts[0] ?? 14;
  const m = parts[1] ?? 0;
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0),
  ).toISOString();
}

// ── Range helpers ─────────────────────────────────────────────────────────────

/** Every calendar day from start to end, inclusive, as YYYY-MM-DD keys. */
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
 * Calendar-day difference between two dates (end − start). Normalises to
 * local midnight before comparing so the result is always a whole number.
 * `end_at > start_at` is enforced by the DB constraint.
 */
export function countNights(start: Date, end: Date): number {
  const ms = parseISO(toKey(end)).getTime() - parseISO(toKey(start)).getTime();
  return Math.round(ms / 86_400_000);
}

/** total = nights × daily price. Weekly/monthly tiers are display-only. */
export function computeBookingTotal(dailyPrice: number, nights: number): number {
  return dailyPrice * nights;
}

/**
 * Flatten pending/confirmed booking ranges into the set of occupied
 * YYYY-MM-DD date keys. Bookings now store timestamptz; tsToDateKey extracts
 * the UTC date from each endpoint. Both endpoints are included (inclusive),
 * which is conservative but correct for day-level calendar display — the DB
 * half-open EXCLUDE constraint is the authoritative overlap checker.
 */
export function bookedDateSet(ranges: PropertyBookingRange[]): Set<string> {
  const set = new Set<string>();
  for (const r of ranges) {
    for (const key of expandRange(tsToDateKey(r.start_at), tsToDateKey(r.end_at))) {
      set.add(key);
    }
  }
  return set;
}
