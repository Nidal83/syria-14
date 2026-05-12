-- Add office verification document fields and pending_review office status.
ALTER TYPE public.office_status ADD VALUE IF NOT EXISTS 'pending_review';

ALTER TABLE public.offices
  ADD COLUMN IF NOT EXISTS office_slug TEXT,
  ADD COLUMN IF NOT EXISTS verification_document_url TEXT,
  ADD COLUMN IF NOT EXISTS id_document_url TEXT;

ALTER TABLE public.offices
  ADD CONSTRAINT IF NOT EXISTS offices_office_slug_key UNIQUE (office_slug);
