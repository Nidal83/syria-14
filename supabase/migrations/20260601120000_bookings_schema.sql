-- ─────────────────────────────────────────────────────────────────
-- Bookings + farm-rental schema  (file 1 of 2)
--
-- HOW TO APPLY (the agent does NOT run this against the live DB)
--   1. Back up: Supabase Dashboard → Database → Backups.
--   2. Supabase Studio → SQL Editor → run THIS file first, then
--      20260601120100_bookings_notifications.sql second.
--   3. Regenerate types:
--        supabase gen types typescript --linked > src/integrations/supabase/types.ts
--      to surface the new types in the frontend. Otherwise the property
--      service in prompt 2b/2c will not typecheck.
--
-- Discovery notes (see docs/diagnostics/bookings-schema-plan.md):
--   • property_type is TEXT — a farm listing sets property_type = 'farm'
--     (lowercase, exact). No enum/FK change required.
--   • properties.currency is TEXT NOT NULL DEFAULT 'USD'.
--   • bookings.user_id is nullable (NOT the spec's NOT NULL) so that
--     ON DELETE SET NULL is valid and booking history survives account
--     deletion. The INSERT policy still forces user_id = auth.uid().
-- ─────────────────────────────────────────────────────────────────

-- C2. Required extension for the GiST EXCLUDE constraint.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- C3. property_type is TEXT → 'farm' is just a recognized value.
--     No DDL needed here. (Documented for the record.)

-- C4. Farm pricing + booking-limit columns on properties (all nullable;
--     only farm listings populate them).
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS daily_price       numeric(12,2),
  ADD COLUMN IF NOT EXISTS weekly_price      numeric(12,2),
  ADD COLUMN IF NOT EXISTS monthly_price     numeric(12,2),
  ADD COLUMN IF NOT EXISTS min_booking_days  int CHECK (min_booking_days IS NULL OR min_booking_days >= 1),
  ADD COLUMN IF NOT EXISTS max_booking_days  int CHECK (max_booking_days IS NULL OR max_booking_days >= 1);

-- Sanity: max must be >= min when both set.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'properties_min_le_max_booking_days'
  ) THEN
    ALTER TABLE public.properties
      ADD CONSTRAINT properties_min_le_max_booking_days
      CHECK (
        min_booking_days IS NULL
        OR max_booking_days IS NULL
        OR min_booking_days <= max_booking_days
      );
  END IF;
END;
$$;

-- C5. Booking status enum.
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'pending',
    'confirmed',
    'rejected',
    'cancelled',
    'completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- C6. Bookings table.
--     NOTE: user_id is nullable (see header) so ON DELETE SET NULL is
--     valid and booking history is preserved if the account is deleted.
CREATE TABLE IF NOT EXISTS public.bookings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id           uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id               uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  start_date            date NOT NULL,
  end_date              date NOT NULL,
  status                booking_status NOT NULL DEFAULT 'pending',

  -- Pricing snapshot at booking time. Insulates a confirmed booking
  -- from later property-price changes.
  daily_rate_snapshot   numeric(12,2) NOT NULL,
  currency              text NOT NULL,
  total_price           numeric(12,2) NOT NULL CHECK (total_price >= 0),

  customer_note         text,
  office_note           text,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  confirmed_at          timestamptz,
  rejected_at           timestamptz,
  cancelled_at          timestamptz,
  completed_at          timestamptz,

  CONSTRAINT bookings_valid_range CHECK (end_date > start_date),
  CONSTRAINT bookings_not_in_past CHECK (start_date >= '2020-01-01')
);

-- updated_at auto-bump
CREATE OR REPLACE FUNCTION public.fn_bookings_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_touch_updated_at ON public.bookings;
CREATE TRIGGER trg_bookings_touch_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_bookings_touch_updated_at();

-- C7. Indexes.
CREATE INDEX IF NOT EXISTS idx_bookings_property_status
  ON public.bookings (property_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_user_status
  ON public.bookings (user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_date_range
  ON public.bookings (property_id, start_date, end_date);

-- C8. EXCLUDE constraint — overlapping pending/confirmed bookings on the
--     same property are physically impossible, even under concurrent
--     inserts. No application-level locking required.
--     Guarded so re-applying the migration does not error.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_no_overlap'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_no_overlap
      EXCLUDE USING GIST (
        property_id  WITH =,
        daterange(start_date, end_date, '[]') WITH &&
      ) WHERE (status IN ('pending', 'confirmed'));
  END IF;
END;
$$;

-- Note: When a booking moves to rejected/cancelled/completed, it stops
-- blocking new bookings. That's the correct behaviour: only active
-- reservations should hold the calendar.

-- C9. RLS.
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- User reads their own
DROP POLICY IF EXISTS "bookings_select_own_user" ON public.bookings;
CREATE POLICY "bookings_select_own_user"
  ON public.bookings FOR SELECT
  USING (user_id = auth.uid());

-- Office reads all bookings on their properties
DROP POLICY IF EXISTS "bookings_select_office" ON public.bookings;
CREATE POLICY "bookings_select_office"
  ON public.bookings FOR SELECT
  USING (
    property_id IN (
      SELECT p.id FROM public.properties p
      JOIN public.offices o ON o.id = p.office_id
      WHERE o.owner_id = auth.uid()
    )
  );

-- Admin reads everything (relies on existing has_role function)
DROP POLICY IF EXISTS "bookings_select_admin" ON public.bookings;
CREATE POLICY "bookings_select_admin"
  ON public.bookings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::user_role));

-- User creates a booking for themselves; starts pending; cannot set
-- a status other than pending.
DROP POLICY IF EXISTS "bookings_insert_own" ON public.bookings;
CREATE POLICY "bookings_insert_own"
  ON public.bookings FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
  );

-- NO direct UPDATE policy. All status transitions go through the
-- SECURITY DEFINER function below. This is intentional — the function
-- enforces who can transition to what, in one place.

-- NO DELETE policy. Bookings are immutable history.

-- C10. Status-transition function (the ONLY way to change status).
CREATE OR REPLACE FUNCTION public.update_booking_status(
  p_booking_id uuid,
  p_new_status booking_status,
  p_note       text DEFAULT NULL
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_booking  public.bookings;
  v_caller   uuid := auth.uid();
  v_is_owner_office boolean;
  v_is_owner_user   boolean;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Load + lock the row
  SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'booking_not_found';
  END IF;

  -- Determine caller's relationship to this booking
  v_is_owner_user := (v_booking.user_id = v_caller);
  v_is_owner_office := EXISTS (
    SELECT 1
      FROM public.properties p
      JOIN public.offices o ON o.id = p.office_id
     WHERE p.id = v_booking.property_id
       AND o.owner_id = v_caller
  );

  -- Permission matrix:
  --   pending  → confirmed   : office only
  --   pending  → rejected    : office only
  --   pending  → cancelled   : user only
  --   confirmed → cancelled  : user only (with consequences UI shows)
  --   confirmed → completed  : office only
  --   anything → same status : no-op, error
  IF v_booking.status = p_new_status THEN
    RAISE EXCEPTION 'no_status_change';
  END IF;

  IF p_new_status = 'confirmed' AND NOT (v_booking.status = 'pending' AND v_is_owner_office) THEN
    RAISE EXCEPTION 'forbidden_transition';
  END IF;

  IF p_new_status = 'rejected' AND NOT (v_booking.status = 'pending' AND v_is_owner_office) THEN
    RAISE EXCEPTION 'forbidden_transition';
  END IF;

  IF p_new_status = 'cancelled' AND NOT (v_booking.status IN ('pending', 'confirmed') AND v_is_owner_user) THEN
    RAISE EXCEPTION 'forbidden_transition';
  END IF;

  IF p_new_status = 'completed' AND NOT (v_booking.status = 'confirmed' AND v_is_owner_office) THEN
    RAISE EXCEPTION 'forbidden_transition';
  END IF;

  -- Apply transition
  UPDATE public.bookings
    SET status        = p_new_status,
        confirmed_at  = CASE WHEN p_new_status = 'confirmed' THEN now() ELSE confirmed_at END,
        rejected_at   = CASE WHEN p_new_status = 'rejected'  THEN now() ELSE rejected_at END,
        cancelled_at  = CASE WHEN p_new_status = 'cancelled' THEN now() ELSE cancelled_at END,
        completed_at  = CASE WHEN p_new_status = 'completed' THEN now() ELSE completed_at END,
        office_note   = CASE WHEN p_new_status IN ('confirmed', 'rejected') AND p_note IS NOT NULL THEN p_note ELSE office_note END,
        customer_note = CASE WHEN p_new_status = 'cancelled' AND v_is_owner_user AND p_note IS NOT NULL THEN p_note ELSE customer_note END
    WHERE id = p_booking_id
    RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_booking_status(uuid, booking_status, text) FROM public;
GRANT  EXECUTE ON FUNCTION public.update_booking_status(uuid, booking_status, text) TO authenticated;
