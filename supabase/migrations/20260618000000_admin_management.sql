-- =============================================================================
-- ADMIN MANAGEMENT MIGRATION (rev 2)
-- =============================================================================
-- Changes from rev 1:
--   1. actor_id allows NULL — ON DELETE SET NULL is now consistent
--   2. admin_logs created BEFORE functions that INSERT into it
--   3. 'subadmin' added to user_role enum BEFORE functions that cast to it
--   4. Policy creation is idempotent (DROP IF EXISTS + CREATE)
--   5. admin_deactivate_user raises user_not_found if 0 rows were updated
--   6. admin_change_user_role checks is_active = true before operating
--   7. profiles.updated_at confirmed present (migration 20260513000000)
--   8. office_members alterations all use IF EXISTS / IF NOT EXISTS
--   9. All DDL is re-runnable
-- =============================================================================
-- HOW TO APPLY:
--   Supabase Studio → SQL Editor → paste this file → Run
--   Do NOT run supabase db push or supabase db reset.
-- After applying, regenerate TS types:
--   npx supabase gen types typescript --linked \
--     > src/integrations/supabase/types.ts
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add 'subadmin' to user_role enum
-- ─────────────────────────────────────────────────────────────────────────────
-- Must run before any function that casts text → public.user_role for 'subadmin'.
-- ADD VALUE IF NOT EXISTS is idempotent (PostgreSQL 9.6+).

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'subadmin';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Soft-delete support on profiles
-- ─────────────────────────────────────────────────────────────────────────────
-- profiles.updated_at already exists (migration 20260513000000_v2_clean_schema).
-- ADD COLUMN IF NOT EXISTS makes both additions idempotent.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_active
  ON public.profiles (created_at DESC)
  WHERE is_active = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. admin_logs table
-- ─────────────────────────────────────────────────────────────────────────────
-- Created BEFORE admin_deactivate_user / admin_change_user_role because those
-- functions INSERT into this table.
--
-- actor_id is intentionally nullable: ON DELETE SET NULL keeps the audit row
-- alive when an admin account is later deleted from auth.users. Declaring the
-- column NOT NULL would be contradictory with ON DELETE SET NULL.

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

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. admin_deactivate_user(p_user_id uuid)
-- ─────────────────────────────────────────────────────────────────────────────
-- Raises user_not_found when UPDATE affects 0 rows so the caller knows whether
-- the target actually existed. The audit INSERT only runs on real success.

CREATE OR REPLACE FUNCTION public.admin_deactivate_user(p_user_id uuid)
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

  IF p_user_id = v_caller_id THEN
    RAISE EXCEPTION 'cannot_deactivate_self';
  END IF;

  UPDATE public.profiles
  SET
    is_active  = false,
    deleted_at = now(),
    updated_at = now()
  WHERE id = p_user_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  INSERT INTO public.admin_logs (actor_id, action, target_type, target_id, details)
  VALUES (
    v_caller_id,
    'deactivate_user',
    'profile',
    p_user_id,
    jsonb_build_object('timestamp', now())
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_deactivate_user(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_deactivate_user(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. admin_change_user_role(p_user_id uuid, p_new_role text)
-- ─────────────────────────────────────────────────────────────────────────────
-- Refuses to operate on deactivated profiles (is_active = false). Reactivation
-- is a separate admin action; mixing it with role changes would obscure intent.

CREATE OR REPLACE FUNCTION public.admin_change_user_role(
  p_user_id  uuid,
  p_new_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id uuid    := auth.uid();
  v_old_role  text;
  v_is_active boolean;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.has_role(v_caller_id, 'admin') THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  IF p_user_id = v_caller_id THEN
    RAISE EXCEPTION 'cannot_change_own_role';
  END IF;

  IF p_new_role NOT IN ('user', 'office', 'pending_office', 'subadmin') THEN
    RAISE EXCEPTION 'invalid_role: %', p_new_role;
  END IF;

  SELECT role::text, is_active
    INTO v_old_role, v_is_active
    FROM public.profiles
   WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  IF v_old_role = 'admin' THEN
    RAISE EXCEPTION 'cannot_change_admin_role';
  END IF;

  -- Refuse to change the role of a deactivated account. Reactivate it first.
  IF NOT v_is_active THEN
    RAISE EXCEPTION 'user_not_active';
  END IF;

  UPDATE public.profiles
  SET role       = p_new_role::public.user_role,
      updated_at = now()
  WHERE id = p_user_id;

  -- Remove all non-user role rows for this user, then insert the new one.
  DELETE FROM public.user_roles
  WHERE user_id = p_user_id AND role::text <> 'user';

  IF p_new_role <> 'user' THEN
    BEGIN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (p_user_id, p_new_role::public.user_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION WHEN invalid_text_representation THEN
      -- Enum cast failed (should not happen after section 1 runs).
      NULL;
    END;
  END IF;

  INSERT INTO public.admin_logs (actor_id, action, target_type, target_id, details)
  VALUES (
    v_caller_id,
    'change_role',
    'profile',
    p_user_id,
    jsonb_build_object('old_role', v_old_role, 'new_role', p_new_role, 'timestamp', now())
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_change_user_role(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_change_user_role(uuid, text) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Add 'suspended' value to office_status enum
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TYPE public.office_status ADD VALUE IF NOT EXISTS 'suspended';

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. office_members table improvements
-- ─────────────────────────────────────────────────────────────────────────────
-- Table confirmed present (migration 20260308233050). No role_check constraint
-- existed in the original CREATE TABLE — DROP IF EXISTS is a safe no-op on the
-- first run; DROP + re-ADD makes subsequent runs idempotent.

ALTER TABLE public.office_members
  ADD COLUMN IF NOT EXISTS status     TEXT        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'invited', 'disabled')),
  ADD COLUMN IF NOT EXISTS invited_by UUID        REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.office_members
  DROP CONSTRAINT IF EXISTS office_members_role_check;

ALTER TABLE public.office_members
  ADD CONSTRAINT office_members_role_check
    CHECK (role IN ('member', 'office_manager', 'office_staff', 'office_viewer'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. admin_logs RLS policy (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────
-- DROP IF EXISTS + CREATE makes re-runs safe.

DROP POLICY IF EXISTS "admin_logs_admin_select" ON public.admin_logs;

CREATE POLICY "admin_logs_admin_select"
  ON public.admin_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Logs are written only via SECURITY DEFINER RPCs — no direct client INSERT.
