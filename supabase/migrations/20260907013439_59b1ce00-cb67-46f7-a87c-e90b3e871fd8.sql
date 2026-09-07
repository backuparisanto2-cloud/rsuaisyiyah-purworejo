CREATE TABLE public.knowledge_sync_state (
  id boolean PRIMARY KEY DEFAULT true,
  dirty boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_sync_state_singleton CHECK (id)
);

GRANT SELECT ON public.knowledge_sync_state TO anon;
GRANT SELECT ON public.knowledge_sync_state TO authenticated;
GRANT ALL ON public.knowledge_sync_state TO service_role;

ALTER TABLE public.knowledge_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read knowledge sync state"
ON public.knowledge_sync_state FOR SELECT
TO anon, authenticated
USING (true);

INSERT INTO public.knowledge_sync_state (id, dirty) VALUES (true, true);

CREATE OR REPLACE FUNCTION public.mark_knowledge_dirty()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.knowledge_sync_state
    SET dirty = true, updated_at = now()
    WHERE id = true;
  RETURN NULL;
END;
$$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'services','faqs','about_page','home_summary_sections','visiting_hours',
    'doctors','doctor_schedules','contact_settings','menu_items','custom_pages'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_mark_knowledge_dirty AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.mark_knowledge_dirty()',
      t
    );
  END LOOP;
END $$;