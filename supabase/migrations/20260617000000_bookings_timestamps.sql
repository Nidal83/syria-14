-- ─────────────────────────────────────────────────────────────────
-- Bookings: switch from DATE columns to TIMESTAMPTZ with half-open
-- range conflict detection. Supports day-use and back-to-back
-- bookings sharing a boundary time.
--
-- PRODUCTION-SAFE: backfills existing rows before dropping DATE columns.
-- Originally authored assuming an empty table — revised after confirming
-- 6 live rows exist in production.
--
-- Backfill logic:
--   start_at = (start_date + property.default_checkin_time)  AT TIME ZONE 'UTC'
--   end_at   = (end_date   + property.default_checkout_time) AT TIME ZONE 'UTC'
--   Step 1 sets default_checkin_time = 14:00, default_checkout_time = 12:00
--   on all properties before the UPDATE runs, so every booking gets a
--   sensible time even if the office has not yet customised these fields.
--   Times are UTC — matches Supabase's server timezone default.
--
-- HOW TO APPLY (the agent does NOT run this against the live DB):
--   1. Back up: Supabase Dashboard → Database → Backups.
--   2. Supabase Studio → SQL Editor → paste and run this file.
--   3. Confirm the NOTICE output shows the expected row count.
--   4. Run the SELECT verification block at the bottom.
--   5. Regenerate types:
--        supabase gen types typescript --linked \
--          > src/integrations/supabase/types.ts
--
-- ROLLBACK: docs/diagnostics/rollback-bookings-timestamps.sql
--   NOTE: rolling back day-use bookings (start_date = end_date) is
--   not possible with DATE columns — see rollback file for details.
-- ─────────────────────────────────────────────────────────────────

-- Pre-flight: log current row count so the operator can confirm
-- the backfill touches the expected number of rows.
DO $$
DECLARE v_count bigint;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.bookings;
  RAISE NOTICE 'public.bookings has % row(s) — backfill will run for all of them.', v_count;
END;
$$;

-- ─── Step 1 ────────────────────────────────────────────────────
-- Add property-level time defaults BEFORE the backfill UPDATE so
-- that the JOIN can read default_checkin_time / default_checkout_time.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS default_checkin_time  time DEFAULT '14:00:00',
  ADD COLUMN IF NOT EXISTS default_checkout_time time DEFAULT '12:00:00',
  ADD COLUMN IF NOT EXISTS day_use_allowed        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_booking_hours      int
    CHECK (min_booking_hours IS NULL OR min_booking_hours >= 1);

COMMENT ON COLUMN public.properties.default_checkin_time IS
  'Suggested time the customer can arrive on the start day. UI prefills this.';
COMMENT ON COLUMN public.properties.default_checkout_time IS
  'Suggested time the customer must leave by on the end day. UI prefills this.';
COMMENT ON COLUMN public.properties.day_use_allowed IS
  'When true, bookings shorter than 24h on the same calendar day are accepted.';
COMMENT ON COLUMN public.properties.min_booking_hours IS
  'Minimum booking duration in hours. Relevant when day_use_allowed = true.';

-- ─── Step 2 ────────────────────────────────────────────────────
-- Drop old date-based constraints and index so the DATE columns can
-- be dropped later. The named CHECKs were inline in CREATE TABLE but
-- are still droppable by name.
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_valid_range;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_not_in_past;
DROP INDEX IF EXISTS public.idx_bookings_date_range;

-- ─── Step 3 ────────────────────────────────────────────────────
-- Add NULLABLE timestamp columns first so the backfill UPDATE can
-- populate them while start_date / end_date still exist.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS start_at timestamptz,
  ADD COLUMN IF NOT EXISTS end_at   timestamptz;

-- ─── Step 4 ────────────────────────────────────────────────────
-- Backfill: combine the existing DATE with the property's default
-- check-in/out time. AT TIME ZONE 'UTC' makes the result explicit
-- regardless of the Postgres session timezone.
UPDATE public.bookings b
SET
  start_at = (b.start_date + COALESCE(p.default_checkin_time,  '14:00:00'::time))
               AT TIME ZONE 'UTC',
  end_at   = (b.end_date   + COALESCE(p.default_checkout_time, '12:00:00'::time))
               AT TIME ZONE 'UTC'
FROM public.properties p
WHERE b.property_id = p.id
  AND (b.start_at IS NULL OR b.end_at IS NULL);

-- ─── Step 5 ────────────────────────────────────────────────────
-- Safety guard: abort if any row was not filled (e.g. a booking whose
-- property_id no longer exists in public.properties).
DO $$
DECLARE v_missing bigint;
BEGIN
  SELECT COUNT(*) INTO v_missing
  FROM public.bookings
  WHERE start_at IS NULL OR end_at IS NULL;

  IF v_missing > 0 THEN
    RAISE EXCEPTION
      'Backfill incomplete: % booking row(s) still have NULL start_at or end_at. '
      'Check for bookings referencing a deleted property_id. Migration aborted.',
      v_missing;
  END IF;

  RAISE NOTICE 'Backfill verified: all booking rows have start_at and end_at.';
END;
$$;

-- ─── Step 6 ────────────────────────────────────────────────────
-- Tighten to NOT NULL now that every row is filled.
ALTER TABLE public.bookings
  ALTER COLUMN start_at SET NOT NULL,
  ALTER COLUMN end_at   SET NOT NULL;

-- ─── Step 7 ────────────────────────────────────────────────────
-- Drop old DATE columns. Safe: backfill verified in Step 5.
ALTER TABLE public.bookings DROP COLUMN IF EXISTS start_date;
ALTER TABLE public.bookings DROP COLUMN IF EXISTS end_date;

-- ─── Step 8 ────────────────────────────────────────────────────
-- Validity + minimum duration constraints.
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_valid_range
    CHECK (end_at > start_at),
  ADD CONSTRAINT bookings_min_duration
    CHECK (end_at - start_at >= interval '1 hour'),
  ADD CONSTRAINT bookings_not_in_past
    CHECK (start_at >= '2020-01-01'::timestamptz);

-- ─── Step 9 ────────────────────────────────────────────────────
-- EXCLUDE constraint using a HALF-OPEN range.
-- '[)' = start-inclusive, end-exclusive: two bookings that share only
-- a single point (A.end_at = B.start_at) do NOT conflict. This allows
-- back-to-back bookings and day-use + overnight on the same calendar day.
-- Guarded for idempotency.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_no_overlap'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_no_overlap
      EXCLUDE USING GIST (
        property_id WITH =,
        tstzrange(start_at, end_at, '[)') WITH &&
      ) WHERE (status IN ('pending', 'confirmed'));
  END IF;
END;
$$;

-- ─── Step 10 ───────────────────────────────────────────────────
-- Index for calendar lookups by property and time range.
CREATE INDEX IF NOT EXISTS idx_bookings_property_time
  ON public.bookings (property_id, start_at, end_at);

-- ─────────────────────────────────────────────────────────────────
-- VERIFICATION (run in Studio immediately after applying)
-- ─────────────────────────────────────────────────────────────────
--
-- 1. Confirm backfilled rows look right:
--    SELECT id, start_at, end_at, status FROM public.bookings ORDER BY start_at;
--
-- 2. Day-use booking — SHOULD SUCCEED (replace UUIDs with real values):
-- INSERT INTO public.bookings
--   (property_id, user_id, start_at, end_at, status,
--    daily_rate_snapshot, currency, total_price)
-- VALUES
--   ('<real-farm-id>', '<real-user-id>',
--    '2026-08-01 09:00+00', '2026-08-01 21:00+00', 'pending',
--    100, 'USD', 999);
--
-- 3. Back-to-back at boundary — SHOULD ALSO SUCCEED (half-open [))
-- INSERT INTO public.bookings
--   (property_id, user_id, start_at, end_at, status,
--    daily_rate_snapshot, currency, total_price)
-- VALUES
--   ('<real-farm-id>', '<another-user-id>',
--    '2026-08-01 21:00+00', '2026-08-02 09:00+00', 'pending',
--    100, 'USD', 999);
--
-- 4. Genuinely overlapping — SHOULD FAIL with exclusion constraint error
-- INSERT INTO public.bookings
--   (property_id, user_id, start_at, end_at, status,
--    daily_rate_snapshot, currency, total_price)
-- VALUES
--   ('<real-farm-id>', '<third-user-id>',
--    '2026-08-01 15:00+00', '2026-08-01 23:00+00', 'pending',
--    100, 'USD', 999);
--
-- Clean up test rows:
--   DELETE FROM public.bookings WHERE total_price = 999;
-- ─────────────────────────────────────────────────────────────────
