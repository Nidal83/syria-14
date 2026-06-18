-- =============================================================================
-- SOFT DELETE STRATEGY
-- =============================================================================
-- Replaces hard delete with status-based soft hiding (offices) and archiving
-- (properties). No data is ever permanently deleted by this code.
--
-- Office statuses:   pending | approved | rejected | suspended | hidden
-- Property statuses: pending | active | hidden | inactive | sold | rented | archived
--
-- APPLY AFTER: 20260618000000_admin_management.sql
-- (Section 2 below creates admin_logs with IF NOT EXISTS, so this migration
-- can also be applied independently in an emergency.)
--
-- HOW TO APPLY:
--   Supabase Studio → SQL Editor → paste this file → Run
--   Do NOT run supabase db push or supabase db reset.
--
-- After applying, regenerate TS types:
--   npx supabase gen types typescript --linked \
--     > src/integrations/supabase/types.ts
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Enum additions
-- ─────────────────────────────────────────────────────────────────────────────
-- ADD VALUE IF NOT EXISTS is idempotent (Postgres 9.6+).

-- Admin has soft-hidden the office (data preserved, invisible to public)
ALTER TYPE public.office_status ADD VALUE IF NOT EXISTS 'hidden';

-- Admin has soft-archived the property (data preserved, invisible to public)
ALTER TYPE public.property_status ADD VALUE IF NOT EXISTS 'archived';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. admin_logs safety net
-- ─────────────────────────────────────────────────────────────────────────────
-- The four RPCs below INSERT into admin_logs. If 20260618000000 has already
-- been applied this CREATE TABLE is a safe no-op. Indexes and policies are
-- likewise idempotent.

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,
  target_type TEXT        NOT NULL,
  target_id   UUID,
  details     JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_actor
  ON public.admin_logs (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_logs_target
  ON public.admin_logs (target_id, created_at DESC);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_logs_admin_select" ON public.admin_logs;
CREATE POLICY "admin_logs_admin_select"
  ON public.admin_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Audit columns on offices
-- ─────────────────────────────────────────────────────────────────────────────
-- previous_status: captured at hide time so Restore returns the office to
--   exactly its pre-hide state — a pending office that gets hidden must NOT
--   be auto-promoted to 'approved' on Restore.
-- hidden_at: immutable audit timestamp, cleared on Restore.

ALTER TABLE public.offices
  ADD COLUMN IF NOT EXISTS previous_status TEXT,
  ADD COLUMN IF NOT EXISTS hidden_at       TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Audit column on properties
-- ─────────────────────────────────────────────────────────────────────────────
-- Restore always goes to 'hidden' (unpublished) so the office reviews before
-- republishing.

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Fix public property read policy (close data-leak for hidden offices)
-- ─────────────────────────────────────────────────────────────────────────────
-- The original policy checked only property.status = 'active', allowing
-- properties of suspended/hidden offices to remain publicly readable.
-- The replacement joins to offices to close this gap.

DROP POLICY IF EXISTS "Anyone can read active properties"   ON public.properties;
DROP POLICY IF EXISTS "public_read_active_properties"       ON public.properties;

CREATE POLICY "public_read_active_properties"
  ON public.properties FOR SELECT
  USING (
    status = 'active'
    AND office_id IN (
      SELECT id FROM public.offices
      WHERE status = 'approved'
        AND is_active = true
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Replace admin FOR ALL policies with per-command (no DELETE for anyone)
-- ─────────────────────────────────────────────────────────────────────────────
-- The original FOR ALL policies granted admins DELETE access. We remove it
-- entirely — no client path can permanently destroy office or property records.

-- ── Offices ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can manage offices"   ON public.offices;
DROP POLICY IF EXISTS "admin_select_offices"         ON public.offices;
DROP POLICY IF EXISTS "admin_insert_offices"         ON public.offices;
DROP POLICY IF EXISTS "admin_update_offices"         ON public.offices;

CREATE POLICY "admin_select_offices"
  ON public.offices FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_insert_offices"
  ON public.offices FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_update_offices"
  ON public.offices FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── Properties ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can manage all properties"   ON public.properties;
DROP POLICY IF EXISTS "admin_select_all_properties"        ON public.properties;
DROP POLICY IF EXISTS "admin_insert_all_properties"        ON public.properties;
DROP POLICY IF EXISTS "admin_update_all_properties"        ON public.properties;

CREATE POLICY "admin_select_all_properties"
  ON public.properties FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_insert_all_properties"
  ON public.properties FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_update_all_properties"
  ON public.properties FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. admin_hide_office(p_office_id uuid)
-- ─────────────────────────────────────────────────────────────────────────────
-- Atomically captures current status → previous_status, sets status='hidden'.
-- Idempotency guard: refuses to hide an already-hidden office.

CREATE OR REPLACE FUNCTION public.admin_hide_office(p_office_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id      uuid    := auth.uid();
  v_current_status text;
  v_rows           integer;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.has_role(v_caller_id, 'admin') THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  SELECT status::text INTO v_current_status
    FROM public.offices
   WHERE id = p_office_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'office_not_found';
  END IF;

  IF v_current_status = 'hidden' THEN
    RAISE EXCEPTION 'already_hidden';
  END IF;

  UPDATE public.offices
  SET
    previous_status = v_current_status,
    status          = 'hidden',
    hidden_at       = now(),
    updated_at      = now()
  WHERE id = p_office_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'office_not_found';
  END IF;

  INSERT INTO public.admin_logs (actor_id, action, target_type, target_id, details)
  VALUES (
    v_caller_id,
    'hide_office',
    'office',
    p_office_id,
    jsonb_build_object(
      'previous_status', v_current_status,
      'timestamp',       now()
    )
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_hide_office(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_hide_office(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. admin_restore_office(p_office_id uuid)
-- ─────────────────────────────────────────────────────────────────────────────
-- Reads previous_status and restores it. Falls back to 'approved' if
-- previous_status is NULL (safety net for rows manually set to hidden).
-- Only operates on offices with status='hidden'.

CREATE OR REPLACE FUNCTION public.admin_restore_office(p_office_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id      uuid    := auth.uid();
  v_prev_status    text;
  v_restore_status text;
  v_rows           integer;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.has_role(v_caller_id, 'admin') THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  SELECT previous_status INTO v_prev_status
    FROM public.offices
   WHERE id = p_office_id
     AND status::text = 'hidden';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'office_not_hidden';
  END IF;

  v_restore_status := COALESCE(v_prev_status, 'approved');

  UPDATE public.offices
  SET
    status          = v_restore_status::public.office_status,
    previous_status = NULL,
    hidden_at       = NULL,
    updated_at      = now()
  WHERE id = p_office_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'office_not_found';
  END IF;

  INSERT INTO public.admin_logs (actor_id, action, target_type, target_id, details)
  VALUES (
    v_caller_id,
    'restore_office',
    'office',
    p_office_id,
    jsonb_build_object(
      'restored_to', v_restore_status,
      'timestamp',   now()
    )
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_restore_office(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_restore_office(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. admin_archive_property(p_property_id uuid)
-- ─────────────────────────────────────────────────────────────────────────────
-- Sets status='archived' and records archived_at. Refuses to archive an
-- already-archived property.

CREATE OR REPLACE FUNCTION public.admin_archive_property(p_property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id      uuid    := auth.uid();
  v_current_status text;
  v_rows           integer;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.has_role(v_caller_id, 'admin') THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  SELECT status::text INTO v_current_status
    FROM public.properties
   WHERE id = p_property_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'property_not_found';
  END IF;

  IF v_current_status = 'archived' THEN
    RAISE EXCEPTION 'already_archived';
  END IF;

  UPDATE public.properties
  SET
    status      = 'archived',
    archived_at = now(),
    updated_at  = now()
  WHERE id = p_property_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'property_not_found';
  END IF;

  INSERT INTO public.admin_logs (actor_id, action, target_type, target_id, details)
  VALUES (
    v_caller_id,
    'archive_property',
    'property',
    p_property_id,
    jsonb_build_object(
      'previous_status', v_current_status,
      'timestamp',       now()
    )
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_archive_property(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_archive_property(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. admin_restore_property(p_property_id uuid)
-- ─────────────────────────────────────────────────────────────────────────────
-- Restores an archived property to 'hidden' (unpublished, not auto-live).
-- Only operates on properties with status='archived'.

CREATE OR REPLACE FUNCTION public.admin_restore_property(p_property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id uuid    := auth.uid();
  v_rows      integer;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.has_role(v_caller_id, 'admin') THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  UPDATE public.properties
  SET
    status      = 'hidden',
    archived_at = NULL,
    updated_at  = now()
  WHERE id = p_property_id
    AND status::text = 'archived';

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'property_not_archived';
  END IF;

  INSERT INTO public.admin_logs (actor_id, action, target_type, target_id, details)
  VALUES (
    v_caller_id,
    'restore_property',
    'property',
    p_property_id,
    jsonb_build_object(
      'restored_to', 'hidden',
      'timestamp',   now()
    )
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_restore_property(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_restore_property(uuid) TO authenticated;
