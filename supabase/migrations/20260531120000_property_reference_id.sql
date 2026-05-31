-- ─────────────────────────────────────────────────────────────────
-- HOW TO APPLY (the agent does NOT run this against the live DB)
--   1. Take a manual backup: Supabase Dashboard → Database → Backups.
--   2. Supabase Studio → SQL Editor → paste this entire file → Run.
--   3. Regenerate types:
--        supabase gen types typescript --linked > src/integrations/supabase/types.ts
--      so that reference_id appears on
--      Database['public']['Tables']['properties'].
-- ─────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────
-- Property reference ID — human-readable SY14-NNNNN identifier
-- ─────────────────────────────────────────────────────────────────

-- Sequence backs the numeric portion. Starting at 1 means the very
-- first property published is SY14-00001.
CREATE SEQUENCE IF NOT EXISTS public.properties_reference_seq
  START WITH 1 INCREMENT BY 1;

-- Generator function. Pure SQL — no permissions needed beyond the
-- caller's ability to read the sequence (handled by GRANT below).
CREATE OR REPLACE FUNCTION public.generate_property_reference()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_next bigint;
BEGIN
  v_next := nextval('public.properties_reference_seq');
  RETURN 'SY14-' || LPAD(v_next::text, 5, '0');
END;
$$;

GRANT USAGE ON SEQUENCE public.properties_reference_seq TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_property_reference() TO authenticated;

-- 1) Add the column nullable so existing rows are not rejected.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS reference_id text;

-- 2) Backfill existing rows in chronological order, oldest first.
--    This ensures the oldest listing is SY14-00001 and references
--    line up with listing age.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id
    FROM public.properties
    WHERE reference_id IS NULL
    ORDER BY created_at ASC, id ASC
  LOOP
    UPDATE public.properties
    SET reference_id = public.generate_property_reference()
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- 3) Enforce NOT NULL + UNIQUE.
ALTER TABLE public.properties
  ALTER COLUMN reference_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_reference_id
  ON public.properties (reference_id);

-- 4) Trigger to populate on every future INSERT, including from old
--    client code that doesn't know about this column.
CREATE OR REPLACE FUNCTION public.fn_set_property_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.reference_id IS NULL OR NEW.reference_id = '' THEN
    NEW.reference_id := public.generate_property_reference();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_property_reference ON public.properties;

CREATE TRIGGER trg_set_property_reference
  BEFORE INSERT ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_set_property_reference();

-- After applying this migration:
--   supabase gen types typescript --linked > src/integrations/supabase/types.ts
-- so that reference_id appears on Database['public']['Tables']['properties'].
