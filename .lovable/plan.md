## Tujuan

Tiga perbaikan admin panel + frontend:
1. **Page Builder Menu Editor** jadi per-halaman (override), seeded sekali dari menu utama.
2. **Tombol Save eksplisit** di Menu Builder utama & Menu Builder per-halaman; hilangkan auto-save onBlur agar edit lancar.
3. **Search caption** untuk section Berita & Info Terkini di frontend.

---

## 1. Per-Page Menu Override

### Database
Migrasi baru: tabel `page_menu_items` mirror `menu_items` + kolom `page_id uuid` (FK ke `custom_pages`, ON DELETE CASCADE).

```text
page_menu_items
├── id, page_id, label, href, parent_id, display_order, is_active
└── RLS: public read; admin write (sama pola dgn menu_items)
```

GRANT untuk anon/authenticated/service_role. Index `(page_id, display_order)`.

### Seeding & sinkronisasi
- Saat halaman baru dibuat ATAU saat Menu Editor di Page Builder dibuka untuk halaman yang belum punya entri `page_menu_items` → otomatis copy semua row `menu_items` ke `page_menu_items` dgn `page_id = current page`.
- Setelah seeding, editor sepenuhnya independen. Menu utama tidak pernah ditarik ulang otomatis.
- Tombol manual **"Tarik Ulang dari Menu Utama"** (konfirmasi) untuk replace isi.

### Konsumsi di frontend halaman `/p/{slug}`
File `src/routes/p.$slug.tsx`: header navigasi halaman membaca dari `page_menu_items` (filter `page_id`), fallback ke `menu_items` global kalau kosong. Halaman lain (home dll) tetap pakai `menu_items` global.

### Placeholder href auto-prefix `../../`
Di MenuEditor Page Builder: saat user mengetik href yang **bukan** anchor (`#`), absolute (`http(s)://`), protokol (`mailto:`/`tel:`), atau sudah diawali `/` atau `../`, otomatis tambahkan `../../` saat blur/save. Placeholder ditampilkan `../../namamenu` untuk memandu. Logic terisolasi (`normalizePageMenuHref`).

---

## 2. Tombol Save Eksplisit

### `administrator.menu.tsx` (Menu Utama)
- Hilangkan `onBlur → update` per-field.
- Tambah state `dirty` (Map id → patch) di parent.
- Header: tombol **Simpan Perubahan** (disable kalau tidak dirty) + indikator "● Belum tersimpan". Reset/Tambah/Hapus/Move tetap langsung commit (tidak melalui Save).
- Cmd/Ctrl+S binding optional → trigger save.

### Menu Editor di Page Builder
Pakai pola dirty-state yang sama dgn tombol Save di header card editor.

### UX edit lancar
- Hindari focus loss dari re-render: gunakan local component state untuk row input, parent menerima via `onChange` ringan.
- Hapus konfirmasi `confirm()` blocking untuk save; tetap untuk delete.

---

## 3. Search Caption Frontend

`src/components/BeritaInstagram.tsx`:
- Tambah `useState` untuk query string.
- Input search (icon `Search` dari lucide) di atas grid, di-debounce 200ms.
- Filter `rows` berdasarkan `caption.toLowerCase().includes(q.toLowerCase())` sebelum paginasi.
- Reset `page` ke 0 saat query berubah.
- Empty state ketika hasil filter 0: "Tidak ada post yang cocok dengan '{q}'".

---

## File yang Disentuh

### Baru
- `supabase/migrations/<ts>_page_menu_items.sql` — tabel + GRANT + RLS + index.

### Diedit
- `src/integrations/supabase/types.ts` — auto (setelah migrasi).
- `src/routes/administrator.menu.tsx` — explicit save, dirty state.
- `src/routes/administrator.pages.tsx` — MenuEditor jadi per-halaman, dirty state + Save, seeding, auto-prefix `../../`. `startNew()` / `startEdit()` trigger seeding bila kosong. Hapus efek samping `syncMenuItem` yang menyentuh menu global (atau batasi ke `menu_items` global hanya saat halaman baru pertama kali, sebelum per-page override dipakai — TBD: bila per-page menu ada, halaman tidak menambah ke menu global lagi).
- `src/routes/p.$slug.tsx` — header pakai `page_menu_items` (fallback global).
- `src/components/BeritaInstagram.tsx` — search bar caption.

### Tidak diubah
- Tabel `menu_items` (struktur).
- Halaman home & route lain.

---

## Catatan Teknis

- **Seeding idempotent**: cek `count(page_menu_items where page_id=X) = 0` sebelum insert.
- **Cascade delete**: `ON DELETE CASCADE` pada FK `page_id` agar hapus page bersihkan menu-nya.
- **Auto-prefix `../../`** hanya kosmetik di sisi Page Builder; URL final tetap dinormalisasi untuk dipakai sebagai href `<a>` di `p.$slug.tsx` (resolve relatif terhadap URL halaman).
- **Performa search**: jumlah post kecil (≤50, sudah `.limit(50)`), filter di client cukup.

## Out of Scope

- Drag-and-drop reorder menu.
- Search lintas section (hanya caption Instagram).
- Migrasi data lama: page lama yang sudah pernah menambah entry ke `menu_items` global tidak otomatis dibersihkan; user bisa hapus manual di Menu Builder utama.
