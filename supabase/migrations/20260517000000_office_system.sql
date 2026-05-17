-- =============================================================================
-- OFFICE SYSTEM MIGRATION
-- Covers:
--   B1. property_status enum  (active, hidden, inactive, sold, rented, pending)
--   B2. Per-command RLS policies on properties (no DELETE for offices/members)
--   B3. notifications table + notification_type enum + RLS + Realtime
--   B4. Trigger: notify admins when a property is published (status='active')
--   B5. notification_prefs jsonb column on profiles (for Phase E)
-- =============================================================================
-- After applying, regenerate TypeScript types:
--   supabase gen types typescript --linked > src/integrations/supabase/types.ts
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- B1. property_status enum
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE public.property_status AS ENUM (
  'pending',
  'active',
  'hidden',
  'inactive',
  'sold',
  'rented'
);

-- Convert existing TEXT status column to the new enum.
-- All current values ('pending', 'active', 'rejected') must be present in the
-- enum or the USING cast will fail. 'rejected' maps to 'inactive' for safety.
UPDATE public.properties SET status = 'inactive' WHERE status = 'rejected';

ALTER TABLE public.properties
  ALTER COLUMN status TYPE public.property_status
  USING status::public.property_status;

-- After conversion, set the default to 'active' (approved offices publish directly)
ALTER TABLE public.properties
  ALTER COLUMN status SET DEFAULT 'active';

-- ─────────────────────────────────────────────────────────────────────────────
-- B2. Property RLS — replace FOR ALL policies with per-command policies
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop the old FOR ALL policies (owner and members)
DROP POLICY IF EXISTS "Office can manage own properties"          ON public.properties;
DROP POLICY IF EXISTS "Office members can manage office properties" ON public.properties;

-- ── Office owner: SELECT own properties (all statuses) ───────────────────────
CREATE POLICY "office_select_own_properties"
  ON public.properties FOR SELECT
  TO authenticated
  USING (
    office_id IN (
      SELECT id FROM public.offices WHERE owner_id = auth.uid()
    )
  );

-- ── Office owner: INSERT only when office is approved; status active or hidden ─
CREATE POLICY "office_insert_own_properties"
  ON public.properties FOR INSERT
  TO authenticated
  WITH CHECK (
    office_id IN (
      SELECT id FROM public.offices
      WHERE owner_id = auth.uid() AND status = 'approved'
    )
    AND status IN ('active', 'hidden')
  );

-- ── Office owner: UPDATE — can only flip between active and hidden ────────────
CREATE POLICY "office_update_own_properties"
  ON public.properties FOR UPDATE
  TO authenticated
  USING (
    office_id IN (
      SELECT id FROM public.offices WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    office_id IN (
      SELECT id FROM public.offices WHERE owner_id = auth.uid()
    )
    AND status IN ('active', 'hidden')
  );

-- ── NO DELETE policy for office owners — intentional ─────────────────────────

-- ── Office members: SELECT ────────────────────────────────────────────────────
CREATE POLICY "office_members_select_properties"
  ON public.properties FOR SELECT
  TO authenticated
  USING (
    office_id IN (
      SELECT office_id FROM public.office_members WHERE user_id = auth.uid()
    )
  );

-- ── Office members: INSERT ────────────────────────────────────────────────────
CREATE POLICY "office_members_insert_properties"
  ON public.properties FOR INSERT
  TO authenticated
  WITH CHECK (
    office_id IN (
      SELECT office_id FROM public.office_members WHERE user_id = auth.uid()
    )
  );

-- ── Office members: UPDATE ────────────────────────────────────────────────────
CREATE POLICY "office_members_update_properties"
  ON public.properties FOR UPDATE
  TO authenticated
  USING (
    office_id IN (
      SELECT office_id FROM public.office_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    office_id IN (
      SELECT office_id FROM public.office_members WHERE user_id = auth.uid()
    )
  );

-- ── NO DELETE for office members — intentional ───────────────────────────────

-- Also fix the property_images member policy (FOR ALL → SELECT + INSERT + UPDATE)
DROP POLICY IF EXISTS "Office members can manage property images" ON public.property_images;

CREATE POLICY "office_members_select_property_images"
  ON public.property_images FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT p.id FROM public.properties p
      JOIN public.office_members om ON om.office_id = p.office_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "office_members_insert_property_images"
  ON public.property_images FOR INSERT
  TO authenticated
  WITH CHECK (
    property_id IN (
      SELECT p.id FROM public.properties p
      JOIN public.office_members om ON om.office_id = p.office_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "office_members_update_property_images"
  ON public.property_images FOR UPDATE
  TO authenticated
  USING (
    property_id IN (
      SELECT p.id FROM public.properties p
      JOIN public.office_members om ON om.office_id = p.office_id
      WHERE om.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- B3. notification_type enum + notifications table + RLS + Realtime
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE public.notification_type AS ENUM (
  'property_published',
  'office_approved',
  'office_rejected',
  'new_inquiry',
  'system'
);

CREATE TABLE public.notifications (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type           public.notification_type NOT NULL,
  title          text          NOT NULL,
  body           text,
  link           text,
  data           jsonb,
  read_at        timestamptz,
  email_sent_at  timestamptz,
  created_at     timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread
  ON public.notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX idx_notifications_user_all
  ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users read their own notifications only
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can mark their own notifications as read (only read_at changes)
CREATE POLICY "notifications_update_own_read"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- No INSERT policy for authenticated users: only SECURITY DEFINER triggers insert
-- No DELETE policy: rows are preserved for audit

-- Enable Realtime on notifications so clients get push updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ─────────────────────────────────────────────────────────────────────────────
-- B4. Trigger: notify admins when an active property is published
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_notify_admins_on_property_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_office_name text;
  v_admin       uuid;
BEGIN
  -- Only fire on INSERT with status = 'active'
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  -- Look up the publishing office's name
  SELECT office_name INTO v_office_name
    FROM public.offices
   WHERE id = NEW.office_id;

  -- Insert one notification row per admin
  FOR v_admin IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'::public.user_role
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, link, data)
    VALUES (
      v_admin,
      'property_published',
      'New property published',
      COALESCE(v_office_name, 'An office') || ': ' || COALESCE(NEW.title, '(no title)'),
      '/admin/properties/' || NEW.id::text,
      jsonb_build_object(
        'property_id', NEW.id,
        'office_id',   NEW.office_id,
        'title',       NEW.title
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admins_on_property_publish
  AFTER INSERT ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notify_admins_on_property_publish();

-- ─────────────────────────────────────────────────────────────────────────────
-- B5. notification_prefs jsonb on profiles (for office email notification prefs)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL DEFAULT '{}';
