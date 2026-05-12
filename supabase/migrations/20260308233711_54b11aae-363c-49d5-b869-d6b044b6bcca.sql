
-- Add missing fields to properties table for full property description
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS features text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS living_rooms integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kitchens integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS view text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ownership_type text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS building_age integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_floors integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contact_phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS whatsapp text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS video_url text NOT NULL DEFAULT '';
