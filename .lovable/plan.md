## Rencana Perubahan

### 1. Logo navbar — proporsional, lebih besar, ring kuning bercahaya
File: `src/components/Header.tsx`
- Ukuran logo: `h-14 w-14` di mobile, `h-[72px] w-[72px]` di desktop (≥sm).
- Bungkus `<img>` dengan `<span>` bundar: `rounded-full ring-[3px] ring-gold` + box-shadow lembut warna gold (`shadow-[0_0_18px_rgba(234,179,8,0.55)]`) agar terlihat bercahaya.
- Padding tipis (`p-0.5`) di pembungkus supaya ring tidak menempel ke ikon logo, dan logo tetap proporsional bulat (object-contain, background transparan).
- Tinggi navbar disesuaikan agar logo tidak terpotong (`h-20` tetap, padding internal cukup).

### 2. Embed Instagram — tinggi diperbesar
File: `src/routes/index.tsx` (section `#instagram`)
- Tinggi iframe naik: `h-[900px] md:h-[1100px]` (sebelumnya 720/820) agar 4–5 post terlihat tanpa scroll dalam iframe.
- Lebar tetap `max-w-3xl` sesuai konteks section.

### 3. Section baru: Tabel Jadwal Dokter & Poli
File baru: `src/components/JadwalDokter.tsx`, dipakai di `src/routes/index.tsx` (disisipkan sebelum section Instagram).
- Heading: "JADWAL DOKTER & POLIKLINIK".
- Filter sederhana di atas tabel: dropdown Poli + input cari nama dokter (client-side filter, tanpa backend).
- Tabel responsif (overflow-x-auto di mobile, grid card di breakpoint sangat kecil) dengan kolom:
  - Poli, Dokter, Hari, Jam, Catatan.
- Data dummy ±15 baris (Anda ganti manual nanti) — contoh: Poli Anak / dr. Andi Wibowo, SpA / Senin–Jumat / 09.00–12.00.
- Styling konsisten dengan token: `bg-card`, border, header tabel `bg-primary text-primary-foreground`, baris hover `hover:bg-accent/30`.
- Catatan kecil "Jadwal dapat berubah sewaktu-waktu" di bawah tabel.

### 4. Penyesuaian kecil
- Pastikan tidak mengubah elemen lain (hero video, animasi shine, section lain) selain yang disebut di atas.
- Tidak ada perubahan dependency / routing / backend.

### Detail teknis singkat
- Tidak ada API call ke Instagram (sesuai pilihan Anda).
- Semua data dokter berupa array konstanta dalam komponen, mudah diedit.
- Filter pakai `useState` + `Array.filter`.
