
-- Helper: rank for roles (admin highest)
CREATE OR REPLACE FUNCTION public.role_rank(_role public.app_role)
RETURNS int
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _role
    WHEN 'admin' THEN 3
    WHEN 'editor' THEN 2
    WHEN 'reader' THEN 1
    ELSE 0
  END;
$$;

-- Has at least the given role
CREATE OR REPLACE FUNCTION public.has_min_role(_user_id uuid, _min public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND public.role_rank(role) >= public.role_rank(_min)
  );
$$;

-- Protected admin = matches the bootstrap admin email
CREATE OR REPLACE FUNCTION public.is_protected_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id
      AND lower(email) = 'rsaisyiyahpurworejo@gmail.com'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_min_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_protected_admin(uuid) FROM PUBLIC, anon;

-- Trigger: protect bootstrap admin & last admin
CREATE OR REPLACE FUNCTION public.guard_user_roles_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining_admins int;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'admin' AND public.is_protected_admin(OLD.user_id) THEN
      RAISE EXCEPTION 'Admin pertama tidak dapat dihapus';
    END IF;
    IF OLD.role = 'admin' THEN
      SELECT count(*) INTO remaining_admins FROM public.user_roles WHERE role = 'admin' AND user_id <> OLD.user_id;
      IF remaining_admins < 1 THEN
        RAISE EXCEPTION 'Harus tersisa minimal satu admin';
      END IF;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'admin' AND NEW.role <> 'admin' AND public.is_protected_admin(OLD.user_id) THEN
      RAISE EXCEPTION 'Role admin pertama tidak dapat diturunkan';
    END IF;
    IF OLD.role = 'admin' AND NEW.role <> 'admin' THEN
      SELECT count(*) INTO remaining_admins FROM public.user_roles WHERE role = 'admin' AND user_id <> OLD.user_id;
      IF remaining_admins < 1 THEN
        RAISE EXCEPTION 'Harus tersisa minimal satu admin';
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_user_roles_changes ON public.user_roles;
CREATE TRIGGER guard_user_roles_changes
  BEFORE UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_roles_changes();

-- Update RLS write policies: allow editor+ to write content tables
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'about_page','chatbot_knowledge','chatbot_settings','contact_settings',
    'custom_pages','doctor_schedules','doctors','faqs','hero_content',
    'hero_settings','hero_slides','home_sections','home_summary_sections',
    'instagram_posts','menu_items','page_menu_items','partners','services',
    'visiting_hours'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || ' admin write', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.has_min_role(auth.uid(), ''editor''::public.app_role)) WITH CHECK (public.has_min_role(auth.uid(), ''editor''::public.app_role))',
      t || ' editor write', t
    );
  END LOOP;
END$$;
