## Masalah
Header bersifat `fixed` (tinggi ~80px di mobile), sementara halaman page builder (`src/routes/p.$slug.tsx`) hanya memberi `py-12` (48px) di atas konten. Akibatnya judul "Profil" menempel/tertumpuk dengan header navigasi hijau di mobile.

## Perubahan
File: `src/routes/p.$slug.tsx` (baris 100)

Ganti container utama agar memberi ruang yang cukup di bawah header fixed:

```tsx
// dari
<div className="max-w-4xl mx-auto px-4 py-12">

// menjadi
<div className="max-w-4xl mx-auto px-4 pt-28 md:pt-32 pb-12">
```

- `pt-28` (112px) di mobile → memberi ~32px jarak nyaman di bawah header 80px
- `md:pt-32` (128px) di desktop → header lebih besar, perlu sedikit lebih banyak

## Cakupan
Hanya satu file. Semua halaman page builder (`/p/<slug>`) otomatis mendapat jarak yang sama karena render via route file yang sama.

Tidak menyentuh Header, styling global, atau halaman lain.