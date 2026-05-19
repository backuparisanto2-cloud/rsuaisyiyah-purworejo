## Tujuan
Mengganti background hero di halaman utama dengan video baru bertema suasana poliklinik RSU Aisyiyah Purworejo, dilapisi overlay biru (primary) opacity 60%, serta dioptimalkan agar halaman tetap cepat.

## Langkah

1. **Generate video hero**
   - Tool: `videogen--generate_video`
   - Prompt: suasana poliklinik rumah sakit modern Indonesia — pasien antre dengan tenang di lobi poli, perawat berjilbab ramah melayani di meja registrasi, dokter berjas putih berjalan di koridor terang, kursi tunggu rapi, pencahayaan natural hangat, gerakan kamera lambat (slow dolly), sinematik, profesional, bersih.
   - Resolusi `1080p`, aspect ratio `16:9`, durasi `10` detik, `camera_fixed: false`.
   - Simpan ke `src/assets/hero-poli.mp4`.

2. **Optimasi ukuran & format**
   - Setelah video dihasilkan, jalankan `ffmpeg` untuk transcoding 2 varian:
     - `hero-poli.mp4` → H.264, CRF 28, preset slow, `-movflags +faststart`, audio dihapus (`-an`), scale 1280x720 (cukup untuk background blur+overlay), `-pix_fmt yuv420p`.
     - `hero-poli.webm` → VP9, CRF 34, `-an`, 1280x720 (fallback modern lebih ringan).
   - Target ukuran < 1.5 MB tiap file.

3. **Update Hero di `src/routes/index.tsx`**
   - Ganti `div` background image dengan elemen `<video>`:
     ```
     <video autoPlay muted loop playsInline preload="metadata"
            poster={posterImg}
            className="absolute inset-0 w-full h-full object-cover">
       <source src={heroWebm} type="video/webm" />
       <source src={heroMp4} type="video/mp4" />
     </video>
     ```
   - Pertahankan overlay biru: `<div className="absolute inset-0 bg-primary/60" />` (ganti dari `/70` menjadi `/60` sesuai permintaan).
   - Hapus radial gradient dan image Unsplash lama agar video terlihat jelas.
   - Tambahkan `poster` (frame pertama, di-extract via ffmpeg ke `hero-poli-poster.jpg`) untuk LCP cepat sebelum video dimainkan.

4. **Optimasi performa**
   - `preload="metadata"` agar tidak unduh penuh saat first paint.
   - `poster` image (~50KB JPG) jadi LCP candidate, di-preload via `head().links` route index: `{ rel: "preload", as: "image", href: posterUrl, fetchpriority: "high" }`.
   - `muted` + `playsInline` + `autoPlay` agar berjalan di mobile tanpa user interaction.
   - Video tanpa audio track → ukuran lebih kecil & menghindari kebijakan autoplay.
   - Lapisan overlay biru tetap di atas video, konten hero (logo, judul, tombol) di `z-10`.

## Catatan teknis
- Video di-generate AI; suasana mendekati poli rumah sakit Indonesia tapi bukan rekaman asli RSU Aisyiyah Purworejo. Bila perlu otentik, user dapat menyediakan rekaman asli untuk menggantikan file `hero-poli.mp4`.
- Aset video ada di `src/assets/` agar di-hash & di-cache oleh Vite build.
