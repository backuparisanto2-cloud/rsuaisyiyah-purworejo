
CREATE TABLE public.page_editor_revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('draft','publish')),
  label TEXT,
  slug TEXT,
  title TEXT,
  snapshot JSONB NOT NULL
);

CREATE INDEX page_editor_revisions_created_at_idx ON public.page_editor_revisions (created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.page_editor_revisions TO authenticated;
GRANT ALL ON public.page_editor_revisions TO service_role;

ALTER TABLE public.page_editor_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view revisions"
  ON public.page_editor_revisions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert revisions"
  ON public.page_editor_revisions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND (created_by IS NULL OR created_by = auth.uid()));

CREATE POLICY "Admins can delete revisions"
  ON public.page_editor_revisions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
