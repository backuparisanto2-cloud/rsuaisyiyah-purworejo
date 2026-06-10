## Ringkasan
Buat komponen layout reusable yang menangani offset header secara otomatis, lalu terapkan di `p.$slug.tsx` dengan breakpoint yang lebih granular agar jarak judul-header konsisten di setiap ukuran layar.

## Detail

### 1. Buat komponen `PageLayout`
Buat file `src/components/PageLayout.tsx` yang:
- Menerima children dan props opsional (pageId untuk Header, className tambahan)
- Menyediakan wrapper `<main>` dengan padding-top responsif yang mengakomodasi header fixed `h-24`
- Menggunakan breakpoint: default, sm, md, lg, xl untuk transisi halus

### 2. Update `p.$slug.tsx`
Ganti wrapper manual `pt-36 md:pt-40` dengan komponen `PageLayout`.

### 3. Penyesuaian breakpoint
Gunakan skala padding yang konsisten:
- Mobile (<640px): `pt-32` (128px) = gap 32px di atas header
- sm (640px+): `sm:pt-36` (144px) = gap 48px
- md (768px+): `md:pt-40` (160px) = gap 64px
- lg (1024px+): `lg:pt-44` (176px) = gap 80px
- xl (1280px+): `xl:pt-44` (176px) = gap 80px

### 4. Verifikasi
Cek preview di beberapa viewport (mobile, tablet, desktop) untuk memastikan judul tidak menempel header di breakpoint manapun.