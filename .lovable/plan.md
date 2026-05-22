## 1. Modal detail dokter (klik kartu)
Edit `src/components/JadwalDokter.tsx`:
- Bungkus seluruh kartu `<article>` dalam tombol/handler `onClick={() => setDetail(d)}` (juga aksesibel via keyboard).
- Tombol WhatsApp di dalam kartu dipertahankan dengan `e.stopPropagation()` agar tidak ikut membuka modal.
- Redesign isi modal yang sudah ada:
  - Foto dokter besar di atas (lingkaran/rounded, ~`h-32 w-32` mobile, `h-40 w-40` desktop, object-cover, border emas tipis, shadow).
  - Di bawah foto: badge spesialis (chip kuning), nama dokter (bold italic), tag NEW bila ada.
  - Daftar jadwal ringkas: list rapi (hari di kiri, jam di kanan) dengan separator halus, bukan kartu individual besar.
  - Catatan kecil + tombol WhatsApp full-width seperti sekarang.
- Animasi masuk halus (fade + scale) memakai class yang sudah tersedia.

## 2. Optimasi kartu jadwal untuk HP
Pada grid kartu di `JadwalDokter.tsx`:
- Grid tetap `md:grid-cols-2`, di HP single column dengan `gap-4`.
- Header kuning: padding `px-3 py-2.5`, nama `text-[13px]` di HP / `text-sm md:text-base`.
- Body: ubah jadi `flex gap-3` dengan foto `h-16 w-16 sm:h-20 sm:w-20` agar tidak mendominasi layar 384px.
- Teks jadwal: `text-[12.5px] sm:text-sm`, label hari `min-w-[96px] sm:min-w-[120px]`, izinkan wrap.
- Tombol WA: `text-xs sm:text-sm`, padding `py-2`.
- Pastikan tidak ada horizontal scroll pada viewport 360–414px.

## 3. Hero responsif + urutan slider
`src/components/HeroSlider.tsx`:
- Ubah urutan `SLIDES` menjadi `[hero2, hero3, hero1]`.

`src/routes/index.tsx` section HERO:
- Ganti `min-h-screen` → `min-h-[88vh] sm:min-h-screen` agar di HP tidak terlalu tinggi karena address bar.
- `pt-24` → `pt-20 sm:pt-24`.
- Logo `h-32 w-32` → `h-24 w-24 sm:h-32 sm:w-32`.
- H1 `text-3xl md:text-5xl` → `text-2xl sm:text-4xl md:text-5xl`, padding `px-4`.
- Tagline script `text-2xl md:text-4xl` → `text-xl sm:text-3xl md:text-4xl`.
- Tombol CTA: `text-sm sm:text-base`, padding `px-5 py-2.5 sm:px-6 sm:py-3`, gap chip mengecil di HP.
- Overlay `absolute inset-1` → `inset-0` (tipo kecil; tetap `bg-blue-950/50`).

## Catatan
- Tidak mengubah data jadwal, foto, atau warna brand.
- Tidak menyentuh logika WhatsApp / pendaftaran.
- Komponen `lucide-react` yang sudah dipakai tetap.
