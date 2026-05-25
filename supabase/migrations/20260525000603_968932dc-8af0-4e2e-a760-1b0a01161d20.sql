ALTER TABLE public.hero_content
  ADD COLUMN IF NOT EXISTS overlay_color text NOT NULL DEFAULT '#0b2545',
  ADD COLUMN IF NOT EXISTS overlay_opacity integer NOT NULL DEFAULT 30;