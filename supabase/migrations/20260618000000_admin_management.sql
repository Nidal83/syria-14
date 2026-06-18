-- =============================================================================
-- ADMIN MANAGEMENT MIGRATION
-- =============================================================================
-- Applies to:
--   1. Soft-delete support on profiles (is_active + deleted_at)
--   2. admin_deactivate_user() SECURITY DEFINER RPC
--   3. admin_change_user_role() SECURITY DEFINER RPC
--   4. Add 'suspended' value to office_status enum
--   5. office_members: add status, invited_by, updated_at; widen role constraint
--   6. Lightweight admin_logs table for auditing destructive actions
-- =============================================================================
-- HOW TO APPLY:
--   Supabase Studio → SQL Editor → paste this file → Run
--   Do NOT run supabase db push or supabase db reset.
-- After applying, regenerate TS types:
--   supabase gen types typescript --linked > src/integrations/supabase/types.ts
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Soft-delete support on profiles
-- ─────────────────────────────────────────────────────────────────────────────
-- is_active = false means the admin deactivated/deleted this user.
-- The auth.users row remains so the email slot is preserved, but the user
-- is excluded from all admin queries and cannot access the app (AuthProvider
-- should sign them out when it detects is_active = false).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active   BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ;

-- Add partial index so admin "active users" queries stay fast
CREATE INDEX IF NOT EXISTS idx_profiles_active
  ON public.profiles (created_at DESC)
  WHERE is_active = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. admin_deactivate_user(p_user_id uuid)
-- ─────────────────────────────────────────────────────────────────────────────
-- Safe, audited user deactivation. Only callable by admins.
-- Sets is_active = false and records deleted_at. Does NOT remove the row,
-- so audit trail is preserved and bootstrap_current_user() ON CONFLICT DO
-- NOTHING won't resurrect the profile.

CREATE OR REPLACE FUNCTION public.admin_deactivate_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
BEGIN
  -- Caller must be authenticated admin
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.has_role(v_caller_id, 'admin') THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  -- Prevent admin from deactivating themselves
  IF p_user_id = v_caller_id THEN
    RAISE EXCEPTION 'cannot_deactivate_self';
  END IF;

  -- Soft-delete the profile
  UPDATE public.profiles
  SET
    is_active  = false,
    deleted_at = now(),
    updated_at = now()
  WHERE id = p_user_id;

  -- Log the action
  INSERT INTO public.admin_logs (actor_id, action, target_type, target_id, details)
  VALUES (
    v_caller_id,
    'deactivate_user',
    'profile',
    p_user_id,
    jsonb_build_object('timestamp', now())
  )
  ON CONFLICT DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_deactivate_user(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_deactivate_user(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. admin_change_user_role(p_user_id uuid, p_new_role text)
-- ─────────────────────────────────────────────────────────────────────────────
-- Safe role promotion/demotion. Validates allowed transitions:
--   user         → office | subadmin
--   office       → user | subadmin
--   pending_office → user
--   subadmin     → user | office
--   (admin → * is intentionally NOT allowed without explicit super-admin check)

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
  v_caller_id uuid := auth.uid();
  v_old_role  text;
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

  -- Validate target role is a known non-admin value
  IF p_new_role NOT IN ('user', 'office', 'pending_office', 'subadmin') THEN
    RAISE EXCEPTION 'invalid_role: %', p_new_role;
  END IF;

  -- Read current role
  SELECT role::text INTO v_old_role FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  -- Prevent promoting to / from admin (admin cannot be demoted here)
  IF v_old_role = 'admin' THEN
    RAISE EXCEPTION 'cannot_change_admin_role';
  END IF;

  -- Update profiles.role (this is the denormalized cache)
  UPDATE public.profiles
  SET role       = p_new_role::public.user_role,
      updated_at = now()
  WHERE id = p_user_id;

  -- Sync user_roles table: remove old non-user roles, insert new role
  DELETE FROM public.user_roles
  WHERE user_id = p_user_id AND role <> 'user';

  IF p_new_role <> 'user' THEN
    -- Only insert if it's a valid enum value (subadmin may not exist yet)
    BEGIN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (p_user_id, p_new_role::public.user_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION WHEN invalid_text_representation THEN
      -- subadmin enum value not yet in DB — profiles.role update still succeeded
      NULL;
    END;
  END IF;

  -- Log
  INSERT INTO public.admin_logs (actor_id, action, target_type, target_id, details)
  VALUES (
    v_caller_id,
    'change_role',
    'profile',
    p_user_id,
    jsonb_build_object('old_role', v_old_role, 'new_role', p_new_role, 'timestamp', now())
  )
  ON CONFLICT DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_change_user_role(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_change_user_role(uuid, text) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Add 'suspended' value to office_status enum
-- ─────────────────────────────────────────────────────────────────────────────
-- Cannot use IF NOT EXISTS for enum values; guard with a DO block.

DO $$
BEGIN
  BEGIN
    ALTER TYPE public.office_status ADD VALUE 'suspended';
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- already exists
  END;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. office_members table improvements
-- ─────────────────────────────────────────────────────────────────────────────
-- The table already exists (migration 20260308233050). We add:
--   - status column (active | invited | disabled)
--   - invited_by uuid
--   - updated_at timestamptz
--   - widen role to include named sub-roles (keeping 'member' for backward compat)

ALTER TABLE public.office_members
  ADD COLUMN IF NOT EXISTS status      TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'invited', 'disabled')),
  ADD COLUMN IF NOT EXISTS invited_by  UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT now();

-- Widen role check: drop old constraint, add new one
ALTER TABLE public.office_members
  DROP CONSTRAINT IF EXISTS office_members_role_check;

ALTER TABLE public.office_members
  ADD CONSTRAINT office_members_role_check
    CHECK (role IN ('member', 'office_manager', 'office_staff', 'office_viewer'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. admin_logs table (lightweight audit trail)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
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

-- Only admins can read logs
CREATE POLICY "admin_logs_admin_select"
  ON public.admin_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Logs are inserted only via SECURITY DEFINER RPCs — no direct client INSERT

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Admin DELETE policy on profiles (for direct RPC use; RPC is preferred)
-- ─────────────────────────────────────────────────────────────────────────────
-- We do NOT allow the frontend to hard-delete profiles directly (would bypass
-- the audit log and orphan the auth.users row). The admin_deactivate_user()
-- RPC is the correct path. This policy is intentionally omitted.

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Update bootstrap_current_user to respect is_active
-- ─────────────────────────────────────────────────────────────────────────────
-- If a profile exists with is_active = false (deactivated user), the
-- ON CONFLICT DO NOTHING in bootstrap already prevents resurrection.
-- No change needed to the RPC itself — the soft-delete approach is correct.

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTES FOR HARD-DELETE (requires Edge Function)
-- ─────────────────────────────────────────────────────────────────────────────
-- To permanently remove a user from auth.users (true hard delete), a Supabase
-- Edge Function with SUPABASE_SERVICE_ROLE_KEY is required:
--
--   supabase functions new admin-delete-user
--   // In the function: await supabase.auth.admin.deleteUser(userId)
--
-- The Edge Function should:
--   1. Verify caller is admin (via JWT + user_roles check)
--   2. Call auth.admin.deleteUser(userId)
--   3. The ON DELETE CASCADE on profiles/user_roles handles cleanup
--
-- Until the Edge Function is deployed, admin_deactivate_user() provides a
-- safe and audited alternative that prevents the user from appearing in the
-- admin panel and (with AuthProvider.is_active check) from accessing the app.
