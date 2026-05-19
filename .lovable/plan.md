## Tujuan
- Hero video di-lazy load (mulai unduh & putar hanya saat hero terlihat di viewport).
- Regenerate video agar talent (pasien/dokter/perawat) eksplisit orang Indonesia berhijab.
- Overlay biru tua opacity 60% di atas video.
- Perkecil tombol floating WhatsApp & Instagram.
- Wajah Arini di tengah lingkaran (object-position dirapikan).
- Tombol Aksesibilitas dipindah ke kanan bawah, sejajar (vertikal) dengan tombol chatbot Arini.

## Langkah

1. **Regenerate video hero** (`videogen--generate_video`, 1080p 16:9, 10 detik)
   - Prompt: "Indonesian outpatient hospital clinic — Indonesian female patients wearing hijab and Indonesian male patients waiting calmly on neat rows of chairs, Indonesian female nurses wearing white hijab and uniform serving warmly at registration desk, Indonesian doctor in white coat walking through bright corridor, warm natural lighting, slow cinematic dolly camera, professional, clean, modern hospital."
   - Simpan `src/assets/hero-poli-raw2.mp4`, lalu transcode via ffmpeg → `public/video/hero-poli.mp4` (H.264 CRF 28 720p, faststart, no audio), `public/video/hero-poli.webm` (VP9), dan `public/video/hero-poli-poster.jpg`. Timpa file lama.

2. **Lazy load hero video** (`src/routes/index.tsx`)
   - Buat komponen kecil `LazyHeroVideo`: pakai `IntersectionObserver` pada `<section id="beranda">`. Saat `isIntersecting`, baru render `<video>` dengan `<source>`. Sebelum itu hanya tampil `poster` image sebagai `<img>` background (LCP cepat).
   - `preload="none"` (bukan `metadata`) karena sudah di-gate observer.
   - Pastikan tetap `muted autoPlay loop playsInline`.
   - Hapus preload link jika ada (tidak perlu lagi karena lazy).

3. **Overlay biru tua 60%** — Ganti `bg-primary/60` menjadi `bg-primary-dark/60` agar warnanya biru tua lebih pekat.

4. **Perkecil tombol sosial** (`src/components/SideSocial.tsx`)
   - Ubah ukuran dari `h-14 w-14` → `h-10 w-10`, icon `h-7 w-7` → `h-5 w-5`, `rounded-2xl` → `rounded-xl`, gap → `gap-2`, ring tetap.

5. **Wajah Arini di tengah** (`src/components/ChatbotArini.tsx`)
   - Pada tombol floating: tetap `rounded-full overflow-hidden`, ubah `object-center` menjadi `object-top` (wajah biasanya di atas frame); tambah `scale-110` halus jika perlu agar wajah pas. Sama untuk header chat panel.

6. **Tombol aksesibilitas sejajar chatbot** (`src/components/AccessibilityWidget.tsx`)
   - Pindahkan dari `left-4 bottom-24` ke kanan: `right-6 bottom-28` agar berada tepat di atas tombol Arini (yang ada di `bottom-6 right-6`), membentuk kolom vertikal sejajar di kanan bawah.
   - Panel pop-up juga dipindah ke `right-6 bottom-44`.

## Catatan teknis
- Video lama akan ditimpa, sehingga ukuran tetap kecil.
- IntersectionObserver dengan `rootMargin: "200px"` agar video mulai load sedikit sebelum hero benar-benar terlihat (mencegah flash poster saat scroll cepat). Karena hero ada di paling atas, efektif video baru load setelah user benar-benar di halaman (saat halaman dibuka pertama, hero pasti terlihat sehingga akan load — namun ini terjadi setelah render awal, bukan saat parsing HTML; jadi LCP tetap poster image yang ringan).
