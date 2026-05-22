## Perubahan HeroSlider.tsx

Ubah render gambar slider agar responsif per device:
- Mobile (`< md`): `object-contain` agar seluruh gambar terlihat tanpa terpotong, ditambah `object-center` agar subjek tetap di tengah.
- Desktop (`md+`): tetap `object-cover` agar mengisi penuh.

Karena Tailwind tidak menyediakan `md:object-cover` langsung (class object-fit tidak punya responsive breakpoint), solusinya:
- Tambahkan class utility kustom di `src/styles.css` untuk `md:object-cover`, atau
- Gunakan wrapper dengan `picture`/`img` yang stylingnya beda per breakpoint.

Pilih pendekatan: wrapper approach - gunakan dua layer gambar (satu untuk mobile, satu untuk desktop) dengan `hidden md:block` dan `md:hidden`, atau gunakan inline style/media query. Pendekatan paling bersih: ubah hero jadi tidak absolute-fill di mobile, melainkan container dengan aspect ratio yang pas, dan gambar object-contain.

## Detail implementasi

1. **HeroSlider.tsx**:
   - Buat container gambar mobile: `relative w-full h-full md:absolute md:inset-1` dengan child `img` class `object-contain object-center mx-auto h-full w-full md:object-cover`.
   - Atau lebih simple: tetap absolute fill, tapi ganti class jadi `object-contain object-center md:object-cover` (Tailwind v4 support responsive object-fit).
   - Verifikasi: `md:object-cover` bekerja di Tailwind v4 (sudah support).

2. **index.tsx hero section**:
   - Sesuaikan padding/alignment agar gambar mobile tetap center.

## Verifikasi
- Preview di viewport 384×642 (mobile): gambar tidak terpotong, subjek center.
- Preview desktop: gambar tetap fill penuh dengan object-cover.