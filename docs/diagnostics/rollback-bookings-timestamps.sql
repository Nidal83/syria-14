-- ─────────────────────────────────────────────────────────────────
-- ROLLBACK for 20260617000000_bookings_timestamps.sql
--
-- Paste this entire file into Supabase Studio → SQL Editor if the
-- forward migration needs to be reversed.
--
-- CAVEATS:
--   • Day-use bookings (start_at::date = end_at::date) cannot be
--     represented in the original DATE schema (which required
--     end_date > start_date). Those rows will be deleted in Step R2
--     rather than partially backfilled.
--   • The rollback does NOT restore the original property check-in/
--     check-out time values — those columns are dropped at the end.
--     Any customisations the office made to default_checkin_time /
--     default_checkout_time will be lost.
-- ─────────────────────────────────────────────────────────────────

-- Pre-flight: show what will be deleted vs backfilled.
DO $$
DECLARE
  v_total    bigint;
  v_day_use  bigint;
BEGIN
  SELECT COUNT(*) INTO v_total   FROM public.bookings;
  SELECT COUNT(*) INTO v_day_use FROM public.bookings
   WHERE (start_at AT TIME ZONE 'UTC')::date
       = (end_at   AT TIME ZONE 'UTC')::date;

  RAISE NOTICE 'Total bookings: %. Day-use (same-date, cannot roll back): %.', v_total, v_day_use;
  IF v_day_use > 0 THEN
    RAISE WARNING
      'Rolling back will DELETE % day-use booking row(s) because the '
      'original DATE schema cannot represent same-day start/end.', v_day_use;
  END IF;
END;
$$;

-- R1: drop everything added by the forward migration.
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_min_duration;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_valid_range;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_not_in_past;
DROP INDEX IF EXISTS public.idx_bookings_property_time;

-- R2: delete day-use rows that cannot survive the DATE rollback.
DELETE FROM public.bookings
WHERE (start_at AT TIME ZONE 'UTC')::date
    = (end_at   AT TIME ZONE 'UTC')::date;

-- R3: add DATE columns back as nullable for the reverse backfill.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date   date;

-- R4: reverse backfill — truncate timestamps back to dates.
UPDATE public.bookings
SET
  start_date = (start_at AT TIME ZONE 'UTC')::date,
  end_date   = (end_at   AT TIME ZONE 'UTC')::date
WHERE start_date IS NULL OR end_date IS NULL;

-- R5: drop the TIMESTAMPTZ columns.
ALTER TABLE public.bookings DROP COLUMN IF EXISTS start_at;
ALTER TABLE public.bookings DROP COLUMN IF EXISTS end_at;

-- R6: tighten DATE columns to NOT NULL.
ALTER TABLE public.bookings
  ALTER COLUMN start_date SET NOT NULL,
  ALTER COLUMN end_date   SET NOT NULL;

-- R7: restore the original CHECK constraints.
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_valid_range CHECK (end_date > start_date),
  ADD CONSTRAINT bookings_not_in_past CHECK (start_date >= '2020-01-01');

-- R8: restore the original EXCLUDE constraint (inclusive [] DATE range).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_no_overlap'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_no_overlap
      EXCLUDE USING GIST (
        property_id WITH =,
        daterange(start_date, end_date, '[]') WITH &&
      ) WHERE (status IN ('pending', 'confirmed'));
  END IF;
END;
$$;

-- R9: restore the original date-range index.
CREATE INDEX IF NOT EXISTS idx_bookings_date_range
  ON public.bookings (property_id, start_date, end_date);

-- R10: remove the properties columns added by the forward migration.
ALTER TABLE public.properties
  DROP COLUMN IF EXISTS default_checkin_time,
  DROP COLUMN IF EXISTS default_checkout_time,
  DROP COLUMN IF EXISTS day_use_allowed,
  DROP COLUMN IF EXISTS min_booking_hours;
