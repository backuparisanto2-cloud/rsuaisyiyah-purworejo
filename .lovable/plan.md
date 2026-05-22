
# Plan Bertahap — CMS Admin RSU Aisyiyah Purworejo

Scope sangat besar. Saya akan kerjakan **bertahap (6 fase)**. Setiap fase diakhiri dengan preview yang bisa Anda test. Setelah fase selesai dan Anda setujui, lanjut fase berikutnya.

Tema default: **ikut palet existing** (primary biru tua + gold), bisa diubah dari halaman /administrator/theme nanti.
Admin pertama: **rsaisyiyahpurworejo@gmail.com** (di-assign role admin via SQL seed setelah signup).

---

## Fase 1 — Fondasi (yang akan saya kerjakan SEKARANG setelah Anda setujui plan ini)

1. **Aktifkan Lovable Cloud** (database + auth + storage).
2. **Schema dasar + RLS**:
   - `enum app_role` ('admin','editor','user')
   - `user_roles (user_id, role)` + fungsi `has_role()` SECURITY DEFINER
   - `profiles` + trigger `handle_new_user`
   - Storage bucket `media` (public read, write admin-only)
3. **Auth**:
   - Route `/auth` (login + signup email/password, autoconfirm aktif)
   - Hook session listener di root
4. **Layout admin** (`/administrator`):
   - Guard role admin (redirect ke `/auth` jika belum login, ke `/` jika bukan admin)
   - Sidebar kiri (shadcn sidebar, collapsible) berisi link semua modul (placeholder route untuk modul yang belum dibangun)
   - Topbar dengan tombol logout
   - Dashboard kosong dengan ringkasan
5. **Modul Hero Slider** (CRUD pertama, jadi template untuk modul lain):
   - Tabel `hero_slides` (max 5 via trigger) + `hero_settings` (single row)
   - List dengan drag-and-drop reorder (@dnd-kit/sortable), preview thumbnail, toggle aktif
   - Form Dialog (react-hook-form + zod): upload image ke bucket `media`, judul, subjudul, CTA text, CTA link
   - Halaman pengaturan slider: interval (2–15s), autoplay, loop, arrows, dots, efek (fade/slide)
   - Komponen `ImageUpload` reusable (preview, hapus, ganti, validasi ≤5MB)
6. **SQL seed** assign role admin ke `rsaisyiyahpurworejo@gmail.com` (jalan setelah Anda signup pertama kali).
7. **Halaman publik** `/` Hero Slider dipasang ulang menggunakan `embla-carousel-react` + autoplay plugin, baca dari Cloud.

Setelah Fase 1 selesai → Anda signup di `/auth`, saya konfirmasi role admin sudah aktif, lalu kita lanjut Fase 2.

---

## Fase 2 — Modul Konten Statis
Tentang, Jam Besuk, Layanan, FAQ, Kontak/Footer, Mitra Slider. Pola sama dengan Hero Slider (table + dialog + dnd reorder).

## Fase 3 — Modul Kompleks
Jadwal Dokter (nama + spesialisasi + foto + jadwal per hari multi-baris via child table `doctor_schedules`).
Header settings (logo, nama RS, tagline).

## Fase 4 — Menu Builder
`/administrator/menu`, tabel `menu_items` (parent_id, location, dll), tree drag-and-drop @dnd-kit, dialog tambah/edit, preview live, render dropdown di Header publik.

## Fase 5 — Page Builder (Section Order) + Theme
- `/administrator/sections`: drag-reorder + toggle aktif section homepage, tabel `page_sections`. Homepage publik render berdasarkan tabel ini.
- `/administrator/theme`: color picker (primary/secondary/accent/background/foreground HSL), simpan ke `site_theme`, apply ke CSS variables `document.documentElement` di mount → live preview.

## Fase 6 — Seed Data Placeholder
Scrape konten dari https://rsuaisyiyah-purworejo.lovable.app/ (Hero, Tentang, Jam Besuk, Layanan, Jadwal Dokter, Mitra, FAQ, Kontak, Menu) via Firecrawl, masukkan sebagai initial rows agar form admin sudah terisi. (Bisa juga dijalankan parsial di tiap fase saat tabelnya dibuat — saya akan optimalkan.)

---

## Catatan teknis (untuk transparansi)
- Semua tabel: `id uuid pk default gen_random_uuid()`, `created_at`, `updated_at` (trigger), `display_order int`, `is_active bool` bila relevan.
- RLS pattern semua tabel konten:
  - `SELECT` → `true` (publik baca)
  - `INSERT/UPDATE/DELETE` → `has_role(auth.uid(),'admin')`
- Storage `media`: bucket public, policy admin-only untuk insert/update/delete pada `storage.objects where bucket_id='media'`.
- Auth Lovable Cloud: email/password, email confirmation **dimatikan** (autoconfirm) supaya signup admin pertama langsung bisa login.
- Stack server fn pakai `createServerFn` hanya kalau perlu service-role; untuk CRUD admin cukup pakai supabase client browser + RLS (lebih ringan).
- Library baru: `@dnd-kit/core`, `@dnd-kit/sortable`, `embla-carousel-react`, `embla-carousel-autoplay`.

---

## Tindakan Anda setelah Fase 1 selesai
1. Buka `/auth`, **signup** dengan email `rsaisyiyahpurworejo@gmail.com` + password pilihan Anda.
2. Beri tahu saya — saya verifikasi role admin sudah terpasang.
3. Anda login → masuk `/administrator` → coba CRUD Hero Slider.
4. Approve → kita lanjut Fase 2.

Setujui plan ini untuk mulai Fase 1?
