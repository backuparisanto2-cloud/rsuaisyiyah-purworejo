## Perubahan

### 1. Tombol WhatsApp di Side Buttons (kanan layar)
Ganti style tombol WhatsApp di `src/components/SideButtons.tsx` agar sesuai gambar referensi:
- Lingkaran hijau khas WhatsApp (`#25D366`)
- Logo WhatsApp putih di tengah
- Shadow lembut + hover scale
- Ukuran sedikit lebih besar / menonjol dibanding tombol lain agar jadi CTA utama

Tombol lain (Instagram, YouTube, TikTok, FB, Aksesibilitas) tetap seperti sekarang.

### 2. Editor Opacity Background SMART di Admin Hero
Di `src/routes/administrator.hero-content.tsx` bagian card **"Teks SMART"**, tambahkan kontrol baru:
- **Slider "Opasitas Background" (0–100%)** — mengatur transparansi pill/badge di belakang teks SMART
- Preview live persentase

Skema database `hero_content`:
- Tambah kolom `smart_bg_opacity` (numeric, default `0.4`) via migrasi

Frontend `src/routes/index.tsx`:
- Terapkan opacity ke background badge SMART menggunakan `rgba` / `color-mix` berdasarkan nilai `smart_bg_opacity` dari DB (fallback 0.4 bila null).

### Detail teknis
- Migrasi: `ALTER TABLE public.hero_content ADD COLUMN smart_bg_opacity numeric NOT NULL DEFAULT 0.4;`
- Admin form: `<Slider min={0} max={100} step={5}>` dengan label persentase; simpan sebagai `value/100`.
- Badge SMART: `style={{ backgroundColor: \`rgba(0,0,0,${opacity})\` }}` (atau warna badge existing dengan alpha yang diatur).
