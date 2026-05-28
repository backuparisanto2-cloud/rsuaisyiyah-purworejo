
ALTER TABLE public.custom_pages
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image_position text NOT NULL DEFAULT 'top',
  ADD COLUMN IF NOT EXISTS show_in_menu boolean NOT NULL DEFAULT true;
