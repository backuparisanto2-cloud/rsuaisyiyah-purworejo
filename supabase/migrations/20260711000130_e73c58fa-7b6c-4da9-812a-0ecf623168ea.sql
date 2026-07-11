
CREATE TABLE public.page_editor_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  snapshot JSONB NOT NULL
);

CREATE INDEX page_editor_templates_created_at_idx ON public.page_editor_templates (created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_editor_templates TO authenticated;
GRANT ALL ON public.page_editor_templates TO service_role;

ALTER TABLE public.page_editor_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view templates"
  ON public.page_editor_templates FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert templates"
  ON public.page_editor_templates FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND (created_by IS NULL OR created_by = auth.uid()));

CREATE POLICY "Admins can update templates"
  ON public.page_editor_templates FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete templates"
  ON public.page_editor_templates FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER page_editor_templates_updated_at
  BEFORE UPDATE ON public.page_editor_templates
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
