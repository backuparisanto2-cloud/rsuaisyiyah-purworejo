
CREATE TABLE public.side_buttons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  url TEXT,
  wa_prolog TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.side_buttons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.side_buttons TO authenticated;
GRANT ALL ON public.side_buttons TO service_role;

ALTER TABLE public.side_buttons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view side buttons"
  ON public.side_buttons FOR SELECT
  USING (true);

CREATE POLICY "Admins manage side buttons"
  ON public.side_buttons FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER side_buttons_set_updated_at
  BEFORE UPDATE ON public.side_buttons
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.side_buttons (key, label, url, wa_prolog, display_order) VALUES
  ('whatsapp',     'WhatsApp',     '6289646710859', 'Hi RSU AISYIYAH Purworejo, saya ingin bertanya...', 1),
  ('instagram',    'Instagram',    'https://www.instagram.com/rsu_aisyiyah', NULL, 2),
  ('youtube',      'YouTube',      'https://www.youtube.com/@rsuaisyiyahpurworejo', NULL, 3),
  ('tiktok',       'TikTok',       'https://www.tiktok.com/@rsu_aisyiyah', NULL, 4),
  ('facebook',     'Facebook',     'https://www.facebook.com/rsuaisyiyahpurworejo', NULL, 5),
  ('accessibility','Aksesibilitas', NULL, NULL, 6);
