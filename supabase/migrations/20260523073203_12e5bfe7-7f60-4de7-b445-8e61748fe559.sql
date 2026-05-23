
CREATE TABLE public.hero_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  logo_url text,
  title_line1 text NOT NULL DEFAULT 'RSU AISYIYAH',
  title_line2 text NOT NULL DEFAULT 'PURWOREJO',
  tagline text NOT NULL DEFAULT 'Keramahan Sebenarnya',
  cta_text text NOT NULL DEFAULT 'Pendaftaran Online',
  badge1 text NOT NULL DEFAULT '★ PARIPURNA',
  badge2 text NOT NULL DEFAULT 'Akreditasi LARSI',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hero_content public read" ON public.hero_content
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "hero_content admin write" ON public.hero_content
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER hero_content_set_updated_at
  BEFORE UPDATE ON public.hero_content
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.hero_content (singleton) VALUES (true);
