CREATE TABLE public.custom_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_pages public read published"
ON public.custom_pages FOR SELECT
TO anon, authenticated
USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "custom_pages admin write"
ON public.custom_pages FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_updated_at_custom_pages
BEFORE UPDATE ON public.custom_pages
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_custom_pages_slug ON public.custom_pages(slug);