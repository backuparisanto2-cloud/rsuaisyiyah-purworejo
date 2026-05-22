
INSERT INTO public.about_page (singleton, title, subtitle, body, image_url)
SELECT true,
  'Keramahan Sebenarnya & Mutu Pelayanan Syariah',
  'RSU Aisyiyah Purworejo',
  E'RSU Aisyiyah Purworejo berdedikasi memberikan pelayanan kesehatan prima berbasis syariah dengan integritas tinggi, mengutamakan keselamatan pasien dan mewujudkan keramahan sebenarnya dalam setiap layanan, termasuk fasilitas ramah difabel.\n\nKami terus mengembangkan fasilitas berkualitas dan modern, menyediakan layanan spesialis dan subspesialis unggulan, ditunjang peralatan medis berteknologi terkini serta layanan penunjang diagnostik mutakhir.',
  'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=900&q=70'
WHERE NOT EXISTS (SELECT 1 FROM public.about_page);

INSERT INTO public.contact_settings (singleton, address, phone, whatsapp, email, instagram, map_embed_url, footer_text, social_links)
SELECT true,
  'Jl. Jend. Sudirman No. 12, Purworejo, Jawa Tengah',
  '',
  '6289646710859',
  'info@rspkukaranganyar.id',
  'https://www.instagram.com/rsu_aisyiyah?igsh=MTg0NnhndWs4Ynpl',
  'https://www.google.com/maps?q=RSU+Aisyiyah+Purworejo&output=embed',
  'Keramahan Sebenarnya',
  '[]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.contact_settings);

INSERT INTO public.visiting_hours (label, time_range, display_order, is_active)
SELECT * FROM (VALUES
  ('SIANG', '11.00 – 13.30 WIB', 1, true),
  ('SORE',  '17.00 – 19.00 WIB', 2, true)
) AS v(label, time_range, display_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.visiting_hours);
