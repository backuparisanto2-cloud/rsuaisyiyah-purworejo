
# Penutup Fase 1 + Fase 2

## A. Penutup Fase 1 — Drag & Drop Urutan Hero Slide

- Tambah `@dnd-kit/core` + `@dnd-kit/sortable` lewat `bun add`.
- Di `/administrator/hero-slider`: tabel slide jadi sortable list. Drag handle di kiri tiap baris.
- Saat drop: hitung ulang `display_order` (1..N) dan batch-update via `supabase.from('hero_slides').upsert([...])`.
- Realtime di komponen publik `HeroSlider.tsx` sudah ada → urutan baru langsung tampil.

## B. Fase 2 — Modul Konten

### Skema baru (1 migrasi)

```text
about_page           (singleton)  title, subtitle, body, image_url
visiting_hours       id, label, time_range, display_order, is_active
faqs                 id, question, answer, display_order, is_active
services             id, title, icon (lucide name), content, display_order, is_active
doctors              id, name, specialty, photo_url, display_order, is_active
doctor_schedules     id, doctor_id (fk), day_of_week (0-6), time_start, time_end, poli
partners             id, name, logo_url, link, display_order, is_active
contact_settings     (singleton)  address, phone, whatsapp, email, instagram, map_embed_url,
                                  footer_text, social_links jsonb
```

Semua tabel:
- RLS aktif. Policy `public read` (anon+authenticated SELECT true) untuk konten yang muncul di website.
- Policy `admin write` (ALL) dengan `has_role(auth.uid(),'admin')`.
- Trigger `tg_set_updated_at` untuk kolom `updated_at`.
- Singleton (`about_page`, `contact_settings`): kolom `singleton boolean default true unique` agar selalu 1 baris.

### Modul admin (route `/administrator/*`)

| Route | Modul | UI |
|---|---|---|
| `/tentang` | About | form singleton: title, subtitle, body (textarea), image (ImageUpload) |
| `/jam-besuk` | Visiting Hours | tabel CRUD + sortable |
| `/faq` | FAQ | tabel CRUD + sortable, toggle aktif |
| `/layanan` | Services | tabel CRUD + sortable, pilih icon dari daftar lucide |
| `/dokter` | Doctors + Schedules | tabel dokter, klik baris → drawer kelola jadwal mingguan |
| `/mitra` | Partners | tabel CRUD + sortable + ImageUpload logo |
| `/kontak` | Contact/Footer | form singleton (alamat, kontak, embed map, sosmed) |

Pola umum tiap halaman:
- List + dialog form (shadcn Dialog) untuk create/edit.
- Sortable via dnd-kit untuk yang punya `display_order`.
- Toggle `is_active` (switch inline).
- Toast sukses/error.
- Sidebar `administrator.tsx`: hapus `disabled` untuk 7 menu di atas; aktifkan link.

### Render publik (`src/routes/index.tsx`)

Ganti data statis menjadi fetch dari Cloud di komponen masing-masing (semua dengan fallback ke konten lama agar tidak blank saat loading):
- `Tentang` section → `about_page` singleton.
- `Jam Besuk` section → query `visiting_hours` order by display_order.
- `Layanan` (akordeon) → `services`, icon di-map dari nama lucide.
- `FAQ` (akordeon) → `faqs`.
- `JadwalDokter.tsx` → join `doctors` + `doctor_schedules`.
- `MitraSlider.tsx` → `partners`.
- Footer + section kontak → `contact_settings` singleton.

Tambah realtime subscription `postgres_changes` di tiap section agar perubahan admin langsung muncul (pola sama seperti `HeroSlider`).

### Seed data awal

Setelah migrasi disetujui, insert data dari konten statis di `src/routes/index.tsx` (LAYANAN, FAQS) + komponen `JadwalDokter`, `MitraSlider` agar admin tidak mulai dari kosong.

## Urutan eksekusi

1. `bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` + sortable hero slider.
2. Migrasi schema 7 tabel + RLS + trigger.
3. Buat 7 route admin + reusable `SortableTable`/`AdminFormDialog` helper.
4. Seed data via `supabase--insert` (logo mitra & foto dokter upload dari `src/assets`).
5. Refactor komponen publik baca dari Cloud + realtime.
6. Aktifkan menu sidebar (hapus flag disabled).

## Catatan teknis

- File baru kecil & fokus (1 route = 1 file).
- Tidak menyentuh `client.ts`, `types.ts`, `auth-*`, `.env`.
- Icon di Services disimpan sebagai nama string (mis. `"Stethoscope"`), di publik dipetakan lewat object `{ Stethoscope, Bed, ... }` dari `lucide-react`.
- Field `social_links` di contact_settings = `jsonb` `[{label,url,icon}]` untuk fleksibilitas.

Total: 1 migrasi + ~10 file route baru + refactor 4 komponen publik.
