-- Replace has_role-based storage policies with a dedicated SECURITY DEFINER
-- function that avoids any chain-of-trust evaluation issues in the storage engine.

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT role::text = 'admin' FROM public.profiles WHERE id = auth.uid() LIMIT 1
$$;

DROP POLICY IF EXISTS "Admin read office-ids"       ON storage.objects;
DROP POLICY IF EXISTS "Admin read office-documents" ON storage.objects;

CREATE POLICY "Admin read office-ids"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'office-ids'
    AND public.current_user_is_admin()
  );

CREATE POLICY "Admin read office-documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'office-documents'
    AND public.current_user_is_admin()
  );
