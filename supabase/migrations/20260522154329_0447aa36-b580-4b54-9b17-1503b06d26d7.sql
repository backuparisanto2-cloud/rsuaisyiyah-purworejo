
CREATE TABLE public.home_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "home_sections public read" ON public.home_sections
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "home_sections admin write" ON public.home_sections
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER home_sections_updated_at
  BEFORE UPDATE ON public.home_sections
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.home_sections (key, label, display_order) VALUES
  ('tentang',   'Tentang',                   1),
  ('jam_besuk', 'Jam Besuk',                 2),
  ('layanan',   'Layanan',                   3),
  ('berita',    'Berita & Promo (Instagram)', 4),
  ('dokter',    'Jadwal Dokter',             5),
  ('instagram', 'Feed Instagram',            6),
  ('mitra',     'Mitra',                     7),
  ('faq',       'FAQ',                       8),
  ('kontak',    'Kontak',                    9);
