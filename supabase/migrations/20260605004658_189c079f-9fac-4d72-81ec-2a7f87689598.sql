ALTER TABLE public.about_page 
  ADD COLUMN IF NOT EXISTS cta_label text NOT NULL DEFAULT 'Selengkapnya',
  ADD COLUMN IF NOT EXISTS cta_url text NOT NULL DEFAULT '#layanan';