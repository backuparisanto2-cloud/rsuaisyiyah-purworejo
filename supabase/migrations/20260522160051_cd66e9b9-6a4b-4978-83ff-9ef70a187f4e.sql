
CREATE TABLE public.theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  primary_color text NOT NULL DEFAULT '#062e6e',
  primary_dark text NOT NULL DEFAULT '#001952',
  primary_foreground text NOT NULL DEFAULT '#f8f8f8',
  secondary_color text NOT NULL DEFAULT '#008b45',
  secondary_foreground text NOT NULL DEFAULT '#f8f8f8',
  accent_color text NOT NULL DEFAULT '#d1e7ff',
  accent_foreground text NOT NULL DEFAULT '#08152c',
  gold_color text NOT NULL DEFAULT '#ecbe24',
  background_color text NOT NULL DEFAULT '#ffffff',
  foreground_color text NOT NULL DEFAULT '#08152c',
  muted_color text NOT NULL DEFAULT '#edf2f8',
  muted_foreground text NOT NULL DEFAULT '#596475',
  border_color text NOT NULL DEFAULT '#d4dfeb',
  ring_color text NOT NULL DEFAULT '#062e6e',
  destructive_color text NOT NULL DEFAULT '#e60016',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "theme_settings public read" ON public.theme_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "theme_settings admin write" ON public.theme_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER theme_settings_updated_at
  BEFORE UPDATE ON public.theme_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.theme_settings (singleton) VALUES (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.theme_settings;
