## Perubahan

### 1. Perbesar tulisan "RSU AISYIYAH PURWOREJO" di Navbar
File: `src/components/Header.tsx`

Naikkan ukuran font wordmark (mobile & desktop) tanpa membuat teks terpotong:
- Mobile: `RSU` → 10px, `AISYIYAH` → 14px bold, `PURWOREJO` → 11px (sebelumnya 8/11/9px). Logo dinaikkan dari 36px → 40px, `max-width` dilonggarkan dari 160px → 190px.
- Desktop (≥sm): `RSU` → 12px, `AISYIYAH` → 18px bold, `PURWOREJO` → 14px (sebelumnya 10/14/12px). Logo tetap 56px.
- Pertahankan `whitespace-nowrap`, tracking yang sudah ada, dan efek `shine-text` (animasi tetap mulus karena container fleksibel).

### 2. Embed Instagram resmi RSU Aisyiyah Purworejo
File: `src/routes/index.tsx`

Ganti grid "highlight" placeholder yang sekarang (gambar Unsplash) dengan **embed Instagram resmi** di section `#instagram`:
- Gunakan iframe widget pihak ketiga **SnapWidget** (`snapwidget.com`) — gratis, tanpa API key, menampilkan feed terbaru langsung dari akun `@rsu_aisyiyah`. Iframe responsif (rasio 1:1 di mobile, lebar penuh di desktop), `loading="lazy"`, `scrolling="no"`.
- Sumber: `https://snapwidget.com/embed/...` dengan parameter username `rsu_aisyiyah`, layout grid 3×2, 6 post terbaru.
- Tetap pertahankan judul, tagline `@rsu_aisyiyah`, dan tombol CTA "Kunjungi Instagram Kami" yang sudah ada (link diperbarui ke URL baru: `https://www.instagram.com/rsu_aisyiyah?igsh=MWVqZDVtODdreXVqbg==`).
- Hapus konstanta `IG_HIGHLIGHTS` yang tidak terpakai lagi.

## Catatan teknis
- SnapWidget mengizinkan free widget tanpa registrasi untuk profil publik; jika iframe gagal dimuat (mis. ad-block), fallback CTA tombol tetap menampilkan akses ke Instagram.
- Tidak ada perubahan dependency, tidak ada API/backend baru.
- Tinggi navbar (`h-20`) tetap; ukuran baru masih muat dalam tinggi tersebut.