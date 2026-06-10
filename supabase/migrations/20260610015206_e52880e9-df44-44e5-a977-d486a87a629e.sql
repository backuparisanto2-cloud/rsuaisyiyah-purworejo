
CREATE TABLE public.home_summary_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL DEFAULT 'manual' CHECK (source_type IN ('custom_page','manual')),
  custom_page_id uuid REFERENCES public.custom_pages(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  image_url text,
  image_position text NOT NULL DEFAULT 'right' CHECK (image_position IN ('left','right','top','none')),
  cta_label text NOT NULL DEFAULT 'Selengkapnya',
  cta_href text NOT NULL DEFAULT '',
  layout text NOT NULL DEFAULT 'block' CHECK (layout IN ('block','card')),
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.home_summary_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_summary_sections TO authenticated;
GRANT ALL ON public.home_summary_sections TO service_role;

ALTER TABLE public.home_summary_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "home_summary_sections public read" ON public.home_summary_sections
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "home_summary_sections admin write" ON public.home_summary_sections
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER home_summary_sections_updated_at
  BEFORE UPDATE ON public.home_summary_sections
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.home_sections (key, label, display_order, is_active)
VALUES ('ringkasan', 'Ringkasan Beranda', 10, true)
ON CONFLICT (key) DO NOTHING;
