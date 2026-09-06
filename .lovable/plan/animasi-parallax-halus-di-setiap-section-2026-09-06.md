# Animasi Parallax Halus di Setiap Section

Menambahkan efek muncul-bergerak (parallax lembut) saat pengunjung menggulir halaman utama: setiap bagian naik perlahan dan memudar masuk ketika mendekati layar.

## Yang akan terlihat

- Setiap bagian beranda (Tentang, Jam Besuk, Layanan, Berita, Dokter, Instagram, Mitra, FAQ, Kontak, Ringkasan) muncul dengan gerakan naik halus + fade saat digulir.
- Efek hanya berjalan sekali per bagian, tidak berulang-ulang, agar tidak mengganggu.
- Gerakan sangat ringan (jarak ~24px, durasi ~0.6 detik) supaya tetap terasa cepat.
- Di perangkat lemah atau saat pengguna memilih "kurangi animasi", efek dimatikan otomatis dan bagian langsung tampil.

## Detail teknis

1. Komponen baru `src/components/ParallaxSection.tsx`
   - Membungkus children, memakai `IntersectionObserver` (threshold ~0.12, rootMargin bawah negatif kecil) untuk menandai `visible` sekali lalu `disconnect`.
   - Kelas: awal `opacity-0 translate-y-6`, setelah terlihat `opacity-100 translate-y-0`, dengan `transition-[opacity,transform] duration-700 ease-out` dan `will-change` dilepas setelah selesai.
   - Prop `delay` opsional untuk stagger kecil.
   - Menghormati `useLightMode()` dan `prefers-reduced-motion`: jika aktif, render children apa adanya tanpa kelas animasi.
2. `src/routes/index.tsx`
   - Bungkus hasil `renderSection(...)` dengan `ParallaxSection` di dalam map section, tetap kompatibel dengan `LazySection` yang sudah ada untuk mode ringan (LazySection di luar, Parallax di dalam).
   - Hero tidak diubah.
3. `src/styles.css`
   - Tambahkan aturan di blok `prefers-reduced-motion` agar transisi parallax dinonaktifkan.

Tidak ada perubahan data, admin, atau logika lain.
