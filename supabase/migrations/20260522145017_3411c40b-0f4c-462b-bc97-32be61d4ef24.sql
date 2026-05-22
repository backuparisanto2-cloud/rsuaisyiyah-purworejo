
-- ABOUT (singleton)
CREATE TABLE public.about_page (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- VISITING HOURS
CREATE TABLE public.visiting_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  time_range text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- FAQS
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- SERVICES
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  icon text NOT NULL DEFAULT 'Stethoscope',
  content text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- DOCTORS
CREATE TABLE public.doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty text NOT NULL DEFAULT '',
  photo_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- DOCTOR SCHEDULES
CREATE TABLE public.doctor_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  time_start text NOT NULL,
  time_end text NOT NULL,
  poli text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_doctor_schedules_doctor ON public.doctor_schedules(doctor_id);

-- PARTNERS
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text NOT NULL,
  link text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- CONTACT SETTINGS (singleton)
CREATE TABLE public.contact_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  instagram text NOT NULL DEFAULT '',
  map_embed_url text NOT NULL DEFAULT '',
  footer_text text NOT NULL DEFAULT '',
  social_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS + policies + updated_at triggers
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['about_page','visiting_hours','faqs','services','doctors','doctor_schedules','partners','contact_settings']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('CREATE POLICY "%s public read" ON public.%I FOR SELECT TO anon, authenticated USING (true);', t, t);
    EXECUTE format('CREATE POLICY "%s admin write" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (public.has_role(auth.uid(), ''admin''::app_role));', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();', t, t);
  END LOOP;
END$$;

-- Seed singletons (1 row each)
INSERT INTO public.about_page (singleton, title, subtitle, body)
VALUES (true, 'Keramahan Sebenarnya & Mutu Pelayanan Syariah', 'RSU Aisyiyah Purworejo',
  'RSU Aisyiyah Purworejo berdedikasi memberikan pelayanan kesehatan prima berbasis syariah dengan integritas tinggi, mengutamakan keselamatan pasien dan mewujudkan keramahan sebenarnya dalam setiap layanan, termasuk fasilitas ramah difabel.

Kami terus mengembangkan fasilitas berkualitas dan modern, menyediakan layanan spesialis dan subspesialis unggulan, ditunjang peralatan medis berteknologi terkini serta layanan penunjang diagnostik mutakhir.')
ON CONFLICT (singleton) DO NOTHING;

INSERT INTO public.contact_settings (singleton, address, whatsapp, email, instagram, map_embed_url, footer_text)
VALUES (true, 'Jl. Jend. Sudirman No. 12, Purworejo, Jawa Tengah', '6289646710859', 'info@rspkukaranganyar.id', '@rsu_aisyiyah',
  'https://www.google.com/maps?q=RSU+Aisyiyah+Purworejo&output=embed',
  '© RSU Aisyiyah Purworejo. Keramahan Sebenarnya.')
ON CONFLICT (singleton) DO NOTHING;
