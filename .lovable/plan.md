## Rencana: Navbar Transparan 90%

**Tujuan:** Membuat background navbar (header) sedikit transparan dengan opacity 90% agar konten di belakangnya sedikit terlihat.

**File yang diubah:**
- `src/components/Header.tsx`

**Perubahan teknis:**
- Pada elemen `<header>` baris 56, ubah kelas `bg-primary` menjadi `bg-primary/90`.
- Ini menerapkan opacity 90% hanya pada background color navbar, tanpa mempengaruhi teks, logo, atau elemen di dalamnya.
- Kelas `shadow-md` tetap dipertahankan agar navbar tetap memiliki depth.

**Catatan:** Perubahan ini bersifat lokal di satu file dan tidak memerlukan penambahan package atau perubahan konfigurasi CSS.