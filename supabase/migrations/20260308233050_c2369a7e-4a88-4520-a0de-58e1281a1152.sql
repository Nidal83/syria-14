
-- Office sub-users table: allows office owners to add employees
CREATE TABLE public.office_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(office_id, user_id)
);

ALTER TABLE public.office_members ENABLE ROW LEVEL SECURITY;

-- Office owner can manage their members
CREATE POLICY "Office owner can manage members"
  ON public.office_members FOR ALL
  USING (office_id IN (SELECT id FROM public.offices WHERE owner_id = auth.uid()));

-- Members can read their own membership
CREATE POLICY "Members can read own membership"
  ON public.office_members FOR SELECT
  USING (user_id = auth.uid());

-- Admin can manage all members
CREATE POLICY "Admins can manage all members"
  ON public.office_members FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Update properties RLS to also allow office members to manage properties
CREATE POLICY "Office members can manage office properties"
  ON public.properties FOR ALL
  USING (office_id IN (
    SELECT office_id FROM public.office_members WHERE user_id = auth.uid()
  ));

-- Allow office members to manage property images
CREATE POLICY "Office members can manage property images"
  ON public.property_images FOR ALL
  USING (property_id IN (
    SELECT p.id FROM public.properties p
    JOIN public.office_members om ON om.office_id = p.office_id
    WHERE om.user_id = auth.uid()
  ));
