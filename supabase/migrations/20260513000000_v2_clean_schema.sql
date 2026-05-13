-- =============================================================================
-- V2 CLEAN SCHEMA — Syria Homes Nest Phase 2
-- =============================================================================
-- This migration adds the new role/profile architecture on top of the existing
-- schema. It is designed to be applied incrementally without breaking data.
-- =============================================================================

-- ── 1. Add pending_office to the user_role enum ─────────────────────────────
-- We must rename the old enum and create a new one (Postgres limitation).
ALTER TYPE public.user_role RENAME TO user_role_old;

CREATE TYPE public.user_role AS ENUM ('user', 'pending_office', 'office', 'admin');

-- Re-bind the user_roles table column to the new enum
ALTER TABLE public.user_roles
  ALTER COLUMN role TYPE public.user_role
  USING role::text::public.user_role;

DROP TYPE public.user_role_old;

-- ── 2. Add role + avatar_url + updated_at to profiles ───────────────────────
-- The new AuthProvider reads role from profiles.role directly (simpler & faster
-- than joining user_roles for every auth check).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role         public.user_role NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS avatar_url   TEXT,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ NOT NULL DEFAULT now();

-- Back-fill role from user_roles (prioritise admin > office > user)
UPDATE public.profiles p
SET role = (
  CASE
    WHEN EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'admin')  THEN 'admin'
    WHEN EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'office') THEN 'office'
    ELSE 'user'
  END
)::public.user_role;

-- ── 3. Sync profiles.role with user_roles on write ───────────────────────────
CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET role = (
    CASE
      WHEN EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = NEW.user_id AND r.role = 'admin')  THEN 'admin'
      WHEN EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = NEW.user_id AND r.role = 'office') THEN 'office'
      ELSE 'user'
    END
  )::public.user_role,
  updated_at = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_role_change ON public.user_roles;
CREATE TRIGGER on_user_role_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role();

-- ── 4. Set pending_office role when an office application is submitted ────────
-- When the office record is inserted with status = 'pending_review', flip the
-- applicant's profile role to pending_office.
CREATE OR REPLACE FUNCTION public.set_pending_office_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending_review' THEN
    UPDATE public.profiles
    SET role = 'pending_office', updated_at = now()
    WHERE id = NEW.owner_id;
  ELSIF NEW.status = 'approved' THEN
    -- Grant office role in user_roles (triggers sync_profile_role)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.owner_id, 'office')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF NEW.status = 'rejected' THEN
    -- Remove office role and demote back to user
    DELETE FROM public.user_roles WHERE user_id = NEW.owner_id AND role = 'office';
    UPDATE public.profiles
    SET role = 'user', updated_at = now()
    WHERE id = NEW.owner_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_office_status_change ON public.offices;
CREATE TRIGGER on_office_status_change
  AFTER INSERT OR UPDATE OF status ON public.offices
  FOR EACH ROW EXECUTE FUNCTION public.set_pending_office_role();

-- ── 5. office_applications — explicit application workflow table ───────────────
-- Mirrors the key fields of offices table but is specifically for the application
-- document trail. Approved offices get a corresponding entry in the offices table.
CREATE TABLE IF NOT EXISTS public.office_applications (
  id                 UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  office_name        TEXT NOT NULL,
  office_slug        TEXT UNIQUE,
  phone              TEXT NOT NULL,
  city               TEXT NOT NULL DEFAULT '',
  description        TEXT NOT NULL DEFAULT '',
  logo_url           TEXT,
  document_url       TEXT,
  id_document_url    TEXT,
  status             TEXT NOT NULL DEFAULT 'pending_review'
                     CHECK (status IN ('pending_review', 'approved', 'rejected')),
  rejection_reason   TEXT,
  reviewed_by        UUID REFERENCES auth.users(id),
  reviewed_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.office_applications ENABLE ROW LEVEL SECURITY;

-- Users can see their own application
CREATE POLICY "Users can view own application"
  ON public.office_applications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own application
CREATE POLICY "Users can insert own application"
  ON public.office_applications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins have full access
CREATE POLICY "Admins can manage applications"
  ON public.office_applications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── 6. Add missing columns to offices ────────────────────────────────────────
ALTER TABLE public.offices
  ADD COLUMN IF NOT EXISTS office_slug  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS whatsapp     TEXT,
  ADD COLUMN IF NOT EXISTS logo_url     TEXT,
  ADD COLUMN IF NOT EXISTS description  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address      TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_active    BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ NOT NULL DEFAULT now();

-- ── 7. Add slug + SEO fields to properties ───────────────────────────────────
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS slug             TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS category         TEXT NOT NULL DEFAULT 'residential',
  ADD COLUMN IF NOT EXISTS currency         TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS district         TEXT,
  ADD COLUMN IF NOT EXISTS latitude         NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude        NUMERIC,
  ADD COLUMN IF NOT EXISTS amenities        JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS featured_image   TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp         TEXT,
  ADD COLUMN IF NOT EXISTS meta_title       TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ NOT NULL DEFAULT now();

-- ── 8. Supabase Storage buckets ───────────────────────────────────────────────
-- Run these separately from the SQL editor or Supabase CLI:
--   supabase storage create office-logos
--   supabase storage create office-documents
--   supabase storage create office-ids
--   supabase storage create property-images
-- (Cannot be created via SQL migrations)

-- ── 9. Update handle_new_user to set role on profiles ─────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    'user'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ── 10. RLS: Allow admins to read all profiles ────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Admins can update any profile'
  ) THEN
    CREATE POLICY "Admins can update any profile"
      ON public.profiles FOR UPDATE TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
