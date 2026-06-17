-- ─────────────────────────────────────────────────────────────────
-- Bookings: switch from DATE columns to TIMESTAMPTZ with half-open
-- range conflict detection. Supports day-use and back-to-back
-- bookings sharing a boundary time.
--
-- ASSUMPTION: public.bookings is empty at the time this migration
-- runs. Verified by the user in Supabase Studio before authoring.
-- If rows exist, STOP and write a proper backfill instead.
--
-- HOW TO APPLY (do NOT run this automatically — apply in Studio):
--   1. Back up: Supabase Dashboard → Database → Backups.
--   2. Supabase Studio → SQL Editor → paste and run this file.
--   3. Run the three-INSERT verification block in
--      docs/diagnostics/rollback-bookings-timestamps.sql header.
--   4. Regenerate types:
--        supabase gen types typescript --linked > src/integrations/supabase/types.ts
--
-- ROLLBACK: see docs/diagnostics/rollback-bookings-timestamps.sql
-- ─────────────────────────────────────────────────────────────────

-- Step 1: property-level defaults for the booking UI.
--   These columns let the office set sensible defaults so the
--   customer form can prefill arrival/departure times.
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

-- Step 2: drop old date-based constraints and the column-range index.
--   The inline CHECK constraints (bookings_valid_range, bookings_not_in_past)
--   were created as named constraints inside CREATE TABLE and can be dropped
--   by name. The EXCLUDE (bookings_no_overlap) was added via ALTER TABLE.
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_valid_range;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_not_in_past;
DROP INDEX IF EXISTS public.idx_bookings_date_range;

-- Step 3: drop old date columns.
--   Safe because the table is empty (assumption documented above).
ALTER TABLE public.bookings DROP COLUMN IF EXISTS start_date;
ALTER TABLE public.bookings DROP COLUMN IF EXISTS end_date;

-- Step 4: add timestamp columns.
ALTER TABLE public.bookings
  ADD COLUMN start_at timestamptz NOT NULL,
  ADD COLUMN end_at   timestamptz NOT NULL;

-- Step 5: validity + minimum duration constraints.
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_valid_range
    CHECK (end_at > start_at),
  ADD CONSTRAINT bookings_min_duration
    CHECK (end_at - start_at >= interval '1 hour'),
  ADD CONSTRAINT bookings_not_in_past
    CHECK (start_at >= '2020-01-01'::timestamptz);

-- Step 6: the critical EXCLUDE constraint using a HALF-OPEN range.
--
-- '[)' means start-inclusive, end-exclusive. Two ranges that touch at
-- a single point (A.end_at = B.start_at) do NOT overlap — exactly the
-- property we need: the previous guest's checkout time is the next
-- guest's check-in time. Back-to-back and day-use bookings both work.
--
-- Guarded for idempotency (re-running the migration will not error).
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

-- Step 7: index for calendar lookups by property and time range.
CREATE INDEX IF NOT EXISTS idx_bookings_property_time
  ON public.bookings (property_id, start_at, end_at);

-- ─────────────────────────────────────────────────────────────────
-- VERIFICATION (run in Studio after applying, then DELETE the rows)
-- ─────────────────────────────────────────────────────────────────
--
-- Replace <real-farm-id> and <real-user-id> etc. with actual UUIDs.
--
-- 1. Day-use booking — SHOULD SUCCEED
-- INSERT INTO public.bookings
--   (property_id, user_id, start_at, end_at, status,
--    daily_rate_snapshot, currency, total_price)
-- VALUES
--   ('<real-farm-id>', '<real-user-id>',
--    '2026-08-01 09:00+00', '2026-08-01 21:00+00', 'pending',
--    100, 'USD', 50);
--
-- 2. Back-to-back at boundary — SHOULD ALSO SUCCEED (half-open: [))
-- INSERT INTO public.bookings
--   (property_id, user_id, start_at, end_at, status,
--    daily_rate_snapshot, currency, total_price)
-- VALUES
--   ('<real-farm-id>', '<another-user-id>',
--    '2026-08-01 21:00+00', '2026-08-02 09:00+00', 'pending',
--    100, 'USD', 50);
--
-- 3. Genuinely overlapping — SHOULD FAIL with
--    "conflicting key value violates exclusion constraint"
-- INSERT INTO public.bookings
--   (property_id, user_id, start_at, end_at, status,
--    daily_rate_snapshot, currency, total_price)
-- VALUES
--   ('<real-farm-id>', '<third-user-id>',
--    '2026-08-01 15:00+00', '2026-08-01 23:00+00', 'pending',
--    100, 'USD', 50);
--
-- Clean up test rows:
--   DELETE FROM public.bookings WHERE total_price = 50;
-- ─────────────────────────────────────────────────────────────────
