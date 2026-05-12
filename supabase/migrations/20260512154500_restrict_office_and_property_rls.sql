-- Enforce admin-only office approval and require approved offices for property management

-- Only approved offices may manage properties.
DROP POLICY IF EXISTS "Office can manage own properties" ON public.properties;
CREATE POLICY "Office can manage own properties" ON public.properties FOR ALL TO authenticated USING (
  office_id IN (
    SELECT id FROM public.offices
    WHERE owner_id = auth.uid() AND status = 'approved'
  )
);

DROP POLICY IF EXISTS "Office can manage own property images" ON public.property_images;
CREATE POLICY "Office can manage own property images" ON public.property_images FOR ALL TO authenticated USING (
  property_id IN (
    SELECT id FROM public.properties
    WHERE office_id IN (
      SELECT id FROM public.offices
      WHERE owner_id = auth.uid() AND status = 'approved'
    )
  )
);

-- Prevent non-admins from changing office approval status.
CREATE OR REPLACE FUNCTION public.ensure_admin_office_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only admins may change office approval status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_admin_office_status_change ON public.offices;
CREATE TRIGGER enforce_admin_office_status_change
BEFORE UPDATE ON public.offices
FOR EACH ROW
EXECUTE FUNCTION public.ensure_admin_office_status_change();
