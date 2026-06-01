## Perubahan

### 1. Hapus post Instagram (admin) — perbaiki UX
File: `src/routes/administrator.instagram.tsx`
- Tombol hapus sudah ada, tapi konfirmasi pakai `confirm()` browser yang kadang diblokir. Ganti dengan `AlertDialog` dari shadcn supaya jelas dan reliable.
- Tambah toast sukses setelah delete (`"Post dihapus"`).
- Optimistic update: hapus dari state lokal sebelum reload supaya feedback instan.

### 2. Animasi card Instagram di frontend
File: `src/components/BeritaInstagram.tsx`
- Entry animation per card: `animate-fade-in` dengan stagger delay per index (`style={{ animationDelay: ... }}`).
- Hover effect lebih hidup:
  - `hover:-translate-y-1` + transisi 300ms
  - Ring/glow Instagram-style (`hover:ring-2 hover:ring-pink-400/40`)
  - Shadow lebih dramatis saat hover
- Icon Instagram di pojok: tambah `scale-in` saat hover.
- Caption overlay: slide up dari bawah (translate-y → 0) bukan hanya fade.
- Page transition: saat ganti halaman, grid fade-in ulang dengan `key={page}`.

Semua via Tailwind utilities yang sudah ada di `src/styles.css` — tidak perlu library tambahan.

### 3. Page builder: menu link mengikuti frontend secara relatif
File: `src/routes/administrator.pages.tsx`
- Tambah load `menu_items` (href + label) dari frontend header saat dialog edit terbuka.
- Ubah field "URL Menu" jadi kombinasi:
  - **Select** existing menu href (label menampilkan label menu + href) — opsi pertama "Default: /p/{slug}", lalu daftar menu frontend, lalu "Custom…".
  - Saat pilih existing menu, `menu_href` di-set ke href tersebut (relatif, mis. `/dokter`, `/layanan`).
  - Saat "Custom…" dipilih, tampilkan Input bebas seperti sekarang.
- `normalizeHref()` tetap memastikan path relatif diawali `/`.
- Preview "Menu akan menuju: …" tetap.

Hasil: admin tinggal memilih dari daftar menu yang ada di frontend, link relatif otomatis cocok dengan rute frontend.

## Catatan
- Tidak ada perubahan database.
- Tidak menyentuh logika business lain.