CREATE TABLE public.page_menu_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id uuid NOT NULL REFERENCES public.custom_pages(id) ON DELETE CASCADE,
  label text NOT NULL,
  href text NOT NULL DEFAULT '#',
  parent_id uuid NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_menu_items_page ON public.page_menu_items(page_id, display_order);

GRANT SELECT ON public.page_menu_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_menu_items TO authenticated;
GRANT ALL ON public.page_menu_items TO service_role;

ALTER TABLE public.page_menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_menu_items public read"
ON public.page_menu_items FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "page_menu_items admin write"
ON public.page_menu_items FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER page_menu_items_set_updated_at
BEFORE UPDATE ON public.page_menu_items
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();