## Ringkasan
Tambahkan fitur "Section Ringkasan Beranda" yang dikelola dari Page Builder, mendukung sumber konten hybrid (tarik dari custom page atau isi manual), opsi gambar (atau tanpa gambar), pilihan layout per item (blok besar / kartu grid), dan tiap item jadi section independen yang bisa di-reorder di antara section beranda lain.

## Detail Teknis

### 1. Database — tabel baru `home_summary_sections`
Migration membuat tabel dengan kolom domain:
- `source_type` ('custom_page' | 'manual')
- `custom_page_id` (FK opsional ke custom_pages)
- `title`, `summary` (override / manual)
- `image_url` (nullable), `image_position` ('left' | 'right' | 'top' | 'none')
- `cta_label`, `cta_href`
- `layout` ('block' | 'card')
- `card_group_key` (opsional, untuk mengelompokkan beberapa kartu jadi satu grid berurutan)
- `display_order`, `is_active`

Policies: public read; admin write (pakai `has_role`). GRANT untuk anon, authenticated, service_role sesuai pola tabel sejenis. Trigger `tg_set_updated_at`.

### 2. Integrasi urutan beranda
- Tambah satu entry generik di `home_sections` dengan `key='ringkasan'` (label "Ringkasan").
- Setiap baris `home_summary_sections` aktif dirender sebagai section independen di posisi `ringkasan` pada urutan beranda — tampil berurutan sesuai `display_order` masing-masing.
- Bila perlu independen total per item di antara section lain, langkah berikutnya bisa diperluas; untuk iterasi pertama, satu slot `ringkasan` di home_sections berisi semua item ringkasan berurutan.

### 3. UI Admin — tab baru di Page Builder
`src/routes/administrator.pages.tsx`:
- Tambahkan tab/section "Ringkasan Beranda" di halaman Page Builder.
- Daftar item dengan drag-reorder (`SortableList`), toggle aktif, edit, hapus.
- Form per item:
  - Pilih sumber: custom page (dropdown) atau manual
  - Bila custom page: auto-isi judul + meta_description, bisa di-override
  - Field judul, ringkasan (textarea)
  - `ImageUpload` untuk gambar + radio posisi (kiri/kanan/atas/tanpa gambar)
  - CTA label + href (auto-isi `/p/<slug>` bila sumber custom page)
  - Layout: block (full-width seperti TentangSection) / card (kartu grid)
  - Toggle aktif

### 4. Komponen beranda — `RingkasanSection`
`src/components/RingkasanSection.tsx`:
- Fetch semua row aktif dari `home_summary_sections` urut `display_order`.
- Render dua mode:
  - `block`: section full-width, gambar kiri/kanan/atas/tanpa gambar (mirip TentangSection)
  - `card`: kelompokkan item `card` berurutan menjadi satu grid 2-3 kolom; setiap kartu menampilkan gambar (opsional), judul, ringkasan, tombol CTA
- Tampilkan secara berurutan: blok dan kelompok grid sesuai urutan.

### 5. Wire di `src/routes/index.tsx`
- Tambah case `"ringkasan"` di `renderSection` → `<RingkasanSection />`.
- Tambah ke `DEFAULT_ORDER`.

### 6. Verifikasi
Periksa preview beranda dan admin /administrator/pages, pastikan item baru bisa dibuat (dengan & tanpa gambar), reorder bekerja, dan tampil di beranda sesuai posisi `ringkasan` di Sections admin.