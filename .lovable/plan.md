## Perubahan

### 1. Section "Jam Besuk" — kontras putih
File: `src/components/JamBesukSection.tsx`
- Ubah background dari `bg-primary text-primary-foreground` menjadi background putih (`bg-white`) dengan teks gelap (`text-primary-dark`/`text-foreground`).
- Kartu jam besuk pakai border tipis + shadow lembut, ikon jam warna gold, angka rentang jam tetap `text-primary` bold agar tetap menonjol.
- Judul "JAM BESUK RESMI" pakai warna primary, subteks abu-abu.

### 2. Hero — teks SMART lebih kontras
Cek dulu di mana "SMART (Sehat Mutu Amanah Ramah Terampil)" ditampilkan (kemungkinan di `HeroSlider` atau overlay hero). Tambahkan:
- `text-white` + `[-webkit-text-stroke:1px_rgba(0,0,0,0.55)]`
- `drop-shadow-[0_3px_10px_rgba(0,0,0,0.75)]`
- Optional badge/pill semi-transparan gelap di belakang teks agar terbaca di semua warna gambar.

### 3. Tombol samping kanan-tengah (Beranda)
Ganti `SideSocial.tsx` dan pindahkan `AccessibilityWidget` menjadi satu kolom tombol vertikal di kanan-tengah dengan urutan:
WhatsApp, Instagram, YouTube, TikTok, Facebook, Aksesibilitas.

Detail:
- Ambil konfigurasi dari tabel baru `side_buttons` (lihat DB).
- Setiap tombol: warna brand masing-masing, ikon SVG/lucide, ring putih, animasi hover.
- WhatsApp: `https://wa.me/{digits}?text={prolog}` dengan prolog dari DB (default `Hi RSU AISYIYAH ...`).
- Tombol Aksesibilitas tetap membuka panel `AccessibilityWidget` (refactor: pisah trigger dari panel, atau expose lewat context / custom event).
- Jika tombol `is_active=false` → tidak dirender.
- `WhatsAppButton.tsx` kiri-bawah dihapus (opsional) atau tetap — default: **hapus** karena sudah tergabung di kolom kanan. (Konfirmasi jika ingin dipertahankan.)

### 4. Database (migration baru)
Tabel `public.side_buttons`:
- `key` (text unique: `whatsapp|instagram|youtube|tiktok|facebook|accessibility`)
- `label`, `url`, `wa_prolog` (nullable, khusus whatsapp), `is_active` (bool), `display_order` (int)
- RLS: SELECT publik, ALL untuk admin (`has_role(auth.uid(),'admin')`)
- GRANT sesuai konvensi + trigger `updated_at`.
- Seed 6 baris default.

### 5. Halaman admin baru: "Tombol Samping"
File baru: `src/routes/administrator.side-buttons.tsx`
- List draggable (pakai `SortableList`) dengan toggle aktif, edit URL, edit label, dan (khusus WhatsApp) input `wa_prolog`.
- Tambahkan entry menu di sidebar admin (`src/routes/administrator.tsx`).

### Teknis
- Aksesibilitas: refactor `AccessibilityWidget` menjadi `AccessibilityPanel` yang dibuka via prop `open` + state global sederhana (window event `open-a11y`) supaya tombol di `SideButtons` bisa memicunya. `AccessibilityWidget` lama (tombol floating) dihapus dari `index.tsx`.
- Types Supabase akan di-regenerate setelah migration disetujui.

## Pertanyaan
1. `WhatsAppButton` kiri-bawah dihapus atau dipertahankan?
