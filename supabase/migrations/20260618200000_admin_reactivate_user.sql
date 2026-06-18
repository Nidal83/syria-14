-- =============================================================================
-- ADMIN REACTIVATE USER
-- =============================================================================
-- Adds admin_reactivate_user() SECURITY DEFINER RPC, the counterpart to
-- admin_deactivate_user() from migration 20260618000000_admin_management.sql.
-- Both write to admin_logs so reactivations have the same audit trail as
-- deactivations.
--
-- APPLY AFTER: 20260618000000_admin_management.sql
--
-- HOW TO APPLY:
--   Supabase Studio → SQL Editor → paste this file → Run
--   Do NOT run supabase db push or supabase db reset.
-- =============================================================================

-- admin_logs safety net (no-op if 20260618000000 already applied)
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,
  target_type TEXT        NOT NULL,
  target_id   UUID,
  details     JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_logs_admin_select" ON public.admin_logs;
CREATE POLICY "admin_logs_admin_select"
  ON public.admin_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- admin_reactivate_user(p_user_id uuid)
-- ─────────────────────────────────────────────────────────────────────────────
-- Restores is_active = true and clears deleted_at.
-- Guards: raises user_not_found if profile missing, user_already_active if
-- is_active is already true (idempotency protection for double-click).

CREATE OR REPLACE FUNCTION public.admin_reactivate_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id uuid    := auth.uid();
  v_is_active boolean;
  v_rows      integer;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.has_role(v_caller_id, 'admin') THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  SELECT is_active INTO v_is_active
    FROM public.profiles
   WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  IF v_is_active = true THEN
    RAISE EXCEPTION 'user_already_active';
  END IF;

  UPDATE public.profiles
  SET
    is_active  = true,
    deleted_at = NULL,
    updated_at = now()
  WHERE id = p_user_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  INSERT INTO public.admin_logs (actor_id, action, target_type, target_id, details)
  VALUES (
    v_caller_id,
    'reactivate_user',
    'profile',
    p_user_id,
    jsonb_build_object('timestamp', now())
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_reactivate_user(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_reactivate_user(uuid) TO authenticated;
