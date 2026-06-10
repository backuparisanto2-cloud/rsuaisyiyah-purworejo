
-- 1) Restrict chatbot_settings SELECT to admins; expose only safe fields via SECURITY DEFINER RPC.
DROP POLICY IF EXISTS "chatbot_settings public read" ON public.chatbot_settings;
DROP POLICY IF EXISTS "chatbot_settings admin read" ON public.chatbot_settings;
CREATE POLICY "chatbot_settings admin read"
  ON public.chatbot_settings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.get_public_chatbot_settings()
RETURNS TABLE (name text, avatar_url text, greeting text, quick_questions jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT name, avatar_url, greeting, quick_questions
  FROM public.chatbot_settings
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_public_chatbot_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_chatbot_settings() TO anon, authenticated;

-- 2) page_views: deny client-side writes explicitly (inserts run via service role).
REVOKE INSERT, UPDATE, DELETE ON public.page_views FROM anon, authenticated;
DROP POLICY IF EXISTS "page_views deny client writes" ON public.page_views;
CREATE POLICY "page_views deny client writes"
  ON public.page_views FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- 3) Storage: remove broad public LIST on media bucket. Public file URLs still work
-- because /storage/v1/object/public/<bucket>/<file> does not require an RLS row.
DROP POLICY IF EXISTS "media public read" ON storage.objects;
CREATE POLICY "media public read object"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'media' AND auth.role() = 'service_role');
-- (Public file fetches go through the public storage endpoint and bypass RLS;
-- listing the bucket from the client API is now blocked.)

-- 4) Realtime: default-deny broadcast/presence for non-admin authenticated users.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "realtime admin only" ON realtime.messages;
CREATE POLICY "realtime admin only"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 5) Lock down SECURITY DEFINER helper functions from public/anon execution.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_min_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_protected_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.role_rank(public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_user_roles_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_hero_slides_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.match_chatbot_knowledge(vector, integer, double precision) FROM PUBLIC, anon, authenticated;
