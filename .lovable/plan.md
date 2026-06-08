
# Optimasi Homepage untuk Mobile Low-End

Tujuan: homepage tetap utuh secara visual di desktop, tapi jauh lebih ringan di HP murah / koneksi lambat. Fokus: kurangi JS, gambar, video, animasi, dan widget pihak ketiga di mobile.

## Deteksi perangkat ringan

Tambahkan helper `useLightMode()` di `src/hooks/use-light-mode.tsx`:
- `true` jika salah satu: `window.innerWidth < 768`, `navigator.hardwareConcurrency <= 4`, `navigator.deviceMemory <= 4`, `navigator.connection.saveData === true`, atau `effectiveType` `2g`/`3g`, atau `prefers-reduced-motion`.
- Stabil setelah mount (tanpa flicker SSR).

Dipakai komponen-komponen berat untuk memutuskan rendering ringan.

## Perubahan per komponen

1. `src/routes/index.tsx` (HERO)
   - Saat `lightMode`: render satu gambar hero statis (slide pertama) sebagai `<img>` dengan `fetchPriority="high"` — tidak memuat `HeroSlider` (tanpa autoplay interval, tanpa realtime channel hero).
   - Logo hero: `loading="eager"` di mobile, tetap satu `<img>`.
   - Kurangi `min-h` hero di mobile dari `88vh` → `72vh` agar konten cepat terlihat.

2. `src/components/HeroSlider.tsx`
   - Skip subscribe realtime di `lightMode`.
   - Hanya preload slide aktif + berikutnya (`loading="lazy"` untuk sisanya, `decoding="async"`).
   - Matikan autoplay otomatis bila `prefers-reduced-motion` atau `saveData`.

3. `src/components/HeroVideo.tsx`
   - Jika dipakai: di `lightMode` hanya tampilkan poster, jangan pernah load `<video>`.

4. `src/routes/index.tsx` (Instagram section)
   - Di `lightMode`: ganti embed Elfsight (script eksternal berat) dengan CTA tombol "Buka Instagram" + grid 4 thumbnail dari `BeritaInstagram` (sudah ada datanya di Supabase). Embed Elfsight hanya dirender di desktop atau setelah user klik "Muat feed Instagram".

5. `src/components/BeritaInstagram.tsx`
   - `PAGE_SIZE` jadi 6 di `lightMode` (sekarang 10).
   - `limit(20)` query di `lightMode` (sekarang 50).
   - Hapus efek `group-hover:scale-105` & overlay caption di mobile (hemat compositor).
   - `<img>` tambah `decoding="async"` dan `sizes` yang benar.

6. `src/components/ChatbotArini.tsx`
   - Lazy mount: tombol bubble selalu ada, tapi panel chat + `react-markdown` di-`import()` dinamis hanya saat user pertama kali membuka chat. Tidak ada fetch settings sampai dibuka.

7. `src/components/MitraSlider.tsx`, `JadwalDokter.tsx`, `LayananSection.tsx`, `TentangSection.tsx`
   - Bungkus dengan IntersectionObserver wrapper `<LazySection>` (komponen baru, `src/components/LazySection.tsx`): hanya render isi saat mendekati viewport (`rootMargin: "300px"`). Placeholder = div dengan `min-height` agar layout tidak loncat.
   - Berlaku untuk semua section non-hero di mobile.

8. Animasi global
   - Tambah CSS di `src/styles.css`:
     - `@media (prefers-reduced-motion: reduce)` dan `@media (max-width: 767px)` matikan `animate-float`, transisi opacity panjang, dan `backdrop-blur` (berat di GPU lemah).

9. Asset hero
   - Pastikan `@/assets/hero-*.png` dipakai dengan `loading="lazy"` kecuali yang pertama. (Tidak resize file, hanya atribut HTML.)

## Hal yang TIDAK diubah

- Struktur konten, urutan section, dan styling desktop.
- Logika admin / backend / data.
- Tidak menghapus fitur apa pun — hanya menunda atau menyederhanakan rendering di perangkat ringan.

## Verifikasi

- Build sukses.
- Preview di viewport 384×641 (kondisi user sekarang): hero muncul cepat, tidak ada video/embed Elfsight pada load awal, chatbot bubble tampil tapi panel belum dimount, section bawah baru render saat di-scroll.
- Periksa console: tidak ada error baru; jaringan: request awal turun signifikan (tanpa elfsight, tanpa multi hero image).
