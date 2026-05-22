
ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;
ALTER FUNCTION public.enforce_hero_slides_limit() SET search_path = public;

-- has_role is used by RLS policies which run as the calling role, so anon/authenticated need EXECUTE.
-- Revoke from PUBLIC to satisfy linter, keep grants for the roles RLS actually uses.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

-- handle_new_user only runs as a trigger; revoke from everyone.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_hero_slides_limit() FROM PUBLIC;
