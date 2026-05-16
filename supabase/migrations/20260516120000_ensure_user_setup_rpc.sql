-- =============================================================================
-- bootstrap_current_user() RPC
-- =============================================================================
-- Idempotent recovery function. Call when a user successfully authenticates
-- but their profiles / user_roles rows are missing (e.g. the handle_new_user
-- trigger failed, or the row was accidentally deleted).
--
-- Safe to call repeatedly — all inserts use ON CONFLICT DO NOTHING.
-- Only ever acts on the authenticated caller; no service-role required.
--
-- After applying this migration, regenerate TypeScript types:
--   supabase gen types typescript --project-id ggsxvvtkmmpsceysttcn \
--     > src/integrations/supabase/types.ts
--
-- To apply:
--   A. Supabase CLI (if linked): supabase db push
--   B. Supabase Studio → SQL Editor: paste and run this file.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.bootstrap_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email   text;
  v_name    text;
  v_phone   text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT
    u.email,
    COALESCE(u.raw_user_meta_data->>'name',  ''),
    COALESCE(u.raw_user_meta_data->>'phone', '')
  INTO v_email, v_name, v_phone
  FROM auth.users u
  WHERE u.id = v_user_id;

  INSERT INTO public.profiles (id, email, name, phone, role)
  VALUES (v_user_id, COALESCE(v_email, ''), v_name, v_phone, 'user')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'user'::user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bootstrap_current_user() FROM public;
GRANT  EXECUTE ON FUNCTION public.bootstrap_current_user() TO authenticated;
