-- ─────────────────────────────────────────────────────────────────
-- ROLLBACK for 20260617000000_bookings_timestamps.sql
--
-- If the timestamp migration causes issues, paste this entire file
-- into Supabase Studio → SQL Editor and run it.
--
-- WARNING: This assumes public.bookings is still empty.
-- If any rows were inserted after applying the forward migration,
-- they will be lost when start_at / end_at are dropped.
-- ─────────────────────────────────────────────────────────────────

-- R1: drop everything added by the forward migration
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_min_duration;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_valid_range;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_not_in_past;
DROP INDEX IF EXISTS public.idx_bookings_property_time;
ALTER TABLE public.bookings DROP COLUMN IF EXISTS start_at;
ALTER TABLE public.bookings DROP COLUMN IF EXISTS end_at;

-- R2: restore the original DATE columns and constraints
ALTER TABLE public.bookings
  ADD COLUMN start_date date,
  ADD COLUMN end_date   date;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_valid_range CHECK (end_date > start_date),
  ADD CONSTRAINT bookings_not_in_past CHECK (start_date >= '2020-01-01');

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

CREATE INDEX IF NOT EXISTS idx_bookings_date_range
  ON public.bookings (property_id, start_date, end_date);

-- R3: restore the columns were nullable after rollback; if the
--     original migration had them NOT NULL, tighten here:
ALTER TABLE public.bookings
  ALTER COLUMN start_date SET NOT NULL,
  ALTER COLUMN end_date   SET NOT NULL;

-- R4: remove the properties columns added by the forward migration
ALTER TABLE public.properties
  DROP COLUMN IF EXISTS default_checkin_time,
  DROP COLUMN IF EXISTS default_checkout_time,
  DROP COLUMN IF EXISTS day_use_allowed,
  DROP COLUMN IF EXISTS min_booking_hours;
