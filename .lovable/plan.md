## Multiuser Admin Panel (admin / editor / reader)

### 1. Database (1 migrasi)
- Tambah nilai `'reader'` ke enum `app_role` (sudah ada: admin, editor, user — nilai `user` dibiarkan untuk backward-compat tapi tidak dipakai UI).
- Fungsi baru `public.is_protected_admin(_user_id uuid)` → `true` jika email user = `rsaisyiyahpurworejo@gmail.com` (akun admin pertama).
- Fungsi `public.has_min_role(_user_id uuid, _min app_role)` (admin > editor > reader) — security definer.
- Trigger pada `user_roles`:
  - cegah `DELETE` / `UPDATE` baris admin milik akun terproteksi
  - cegah penghapusan admin terakhir (selalu sisakan ≥ 1)
- Perbarui RLS pada tabel konten (hero_*, about_page, services, doctors, doctor_schedules, faqs, partners, contact_settings, visiting_hours, menu_items, page_menu_items, custom_pages, home_sections, home_summary_sections, instagram_posts, chatbot_*) → policy write: `has_min_role(auth.uid(), 'editor')`; read tetap publik atau seperti sekarang.
- RLS yang tetap admin-only (write & read sensitif): `user_roles`, `profiles` (untuk admin list), `theme_settings`.
- `profiles`: tambah policy "admin can select all" agar list user bisa baca display_name.

### 2. Server functions (`src/lib/admin-users.functions.ts`)
Semua memakai `requireSupabaseAuth` + cek `has_role(uid, 'admin')`; mutasi pakai `supabaseAdmin` (di-import dalam handler).
- `listUsers()` → gabung `auth.admin.listUsers()` + `user_roles` + `profiles` → `{id, email, displayName, role, isProtected, createdAt}[]`.
- `createUser({email, password, displayName, role})` → `auth.admin.createUser({email_confirm:true})`, insert role.
- `updateUserRole({userId, role})` → blok jika target terproteksi; pastikan masih ada ≥1 admin.
- `resetUserPassword({userId, password})` → `auth.admin.updateUserById`.
- `deleteUser({userId})` → blok jika terproteksi; hapus role + auth user.

Validasi input dengan zod (email, password ≥ 8, role enum).

### 3. Frontend
**`src/hooks/use-auth.tsx`**
- Ganti `isAdmin: boolean` menjadi `role: 'admin'|'editor'|'reader'|null` + helper terhitung `isAdmin`, `canEdit` (admin/editor), `canManageUsers` (admin).
- Query satu role tertinggi dari `user_roles` (urutkan admin>editor>reader).

**`src/routes/administrator.tsx`**
- Izinkan masuk jika `role !== null` (bukan hanya admin).
- Filter `NAV`: item "Tema Warna" & "Pengguna" hanya untuk admin; sisanya tampil untuk editor & reader.
- Tampilkan badge role di sidebar di samping email.

**`src/routes/administrator.users.tsx` (baru, admin only)**
- Tabel user: email, nama, role (select inline), tombol Reset Password, Hapus.
- Tombol "+ Tambah Pengguna" → dialog form (email, password, nama, role).
- Akun terproteksi: kontrol role/hapus dinonaktifkan dengan tooltip.

**Komponen guard `src/components/admin/RoleGate.tsx`**
- `<RoleGate min="editor">` membungkus tombol Simpan/Hapus/Upload di semua halaman admin sehingga reader hanya bisa melihat (tombol di-`disabled` + tooltip "Hanya untuk Editor/Admin"). Diterapkan di form-form yang paling banyak dipakai dulu (Hero, Dokter, FAQ, Layanan, Kontak, Pages, Sections, Summary). Reader tetap bisa menjelajah seluruh panel.

### 4. Detail teknis singkat
- Pastikan `attachSupabaseAuth` sudah terdaftar di `src/start.ts` (cek dulu; tambahkan jika belum).
- Tidak ada perubahan pada `auth.tsx`; redirect setelah login: admin/editor/reader → `/administrator`, lainnya → `/`.
- Trigger admin-terakhir hanya menghitung baris dengan `role='admin'`.

### 5. Berkas yang akan dibuat/diubah
- `supabase/migrations/<ts>_multiuser_roles.sql`
- `src/lib/admin-users.functions.ts` (baru)
- `src/hooks/use-auth.tsx` (refactor)
- `src/routes/administrator.tsx` (gate role + filter nav)
- `src/routes/administrator.users.tsx` (baru)
- `src/components/admin/RoleGate.tsx` (baru) + integrasi di beberapa halaman admin utama
- `src/start.ts` (jika perlu menambah `attachSupabaseAuth`)
