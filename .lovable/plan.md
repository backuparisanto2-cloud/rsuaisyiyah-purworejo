# Seed Hero Slider dari Gambar Eksisting

Mengisi tabel `hero_slides` dengan 4 gambar yang saat ini dipakai di `src/components/HeroSlider.tsx` agar admin langsung melihat data awal di `/administrator/hero-slider` dan halaman publik nantinya bisa membaca dari Cloud.

## Langkah

1. **Upload 4 file gambar dari `src/assets/` ke storage bucket `media`** (folder `hero/`) via `supabase--storage_upload`:
   - `hero-3.png` → urutan 1
   - `hero-2.png` → urutan 2
   - `hero-dental.jpg` → urutan 3
   - `hero-1.png` → urutan 4

2. **Insert 4 baris ke `public.hero_slides`** via `supabase--insert` dengan `public URL` hasil upload, judul/subjudul deskriptif singkat (RS Aisyiyah Purworejo), `display_order` 1–4, `is_active = true`, CTA kosong (admin bisa edit nanti).

## Catatan

- Tidak menyentuh komponen `HeroSlider.tsx` publik (masih pakai import statis). Penggantian render publik dari Cloud akan dilakukan di iterasi berikutnya sesuai Fase 1.
- Trigger `enforce_hero_slides_limit` mengizinkan ≤5 baris — 4 insert aman.
- Jika tabel sudah berisi data, akan diabaikan/ditambah sesuai konfirmasi Anda saat eksekusi.
