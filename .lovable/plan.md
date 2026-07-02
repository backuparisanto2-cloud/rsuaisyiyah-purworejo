
## Perubahan Tampilan (Hero Section)

Perbesar badge "SMART — Sehat · Mutu · Amanah · Ramah · Terampil" di `src/routes/index.tsx`:
- Ukuran teks default dinaikkan (dari `text-xs sm:text-sm` menjadi konfigurasi via admin, default `text-base sm:text-xl`)
- Padding pill diperbesar mengikuti ukuran font
- Warna, jenis font, dan ukuran dibuat dinamis mengikuti setting admin (inline style dari kolom database)

## Editor Baru di Admin Hero (`/administrator/hero-content`)

Tambah satu Card baru "Teks SMART" berisi:
- **Teks SMART** (kata utama, mis. "SMART")
- **Deskripsi SMART** (mis. "Sehat · Mutu · Amanah · Ramah · Terampil")
- **Warna teks SMART** (color picker)
- **Warna teks deskripsi** (color picker)
- **Jenis font** (dropdown: Default/Sans, Serif, Script, Mono, Display)
- **Ukuran font** (slider 12–48 px, terapkan responsif otomatis)

Tambah Card baru "Tombol Pendaftaran Online":
- **Nomor WhatsApp tujuan** (contoh: `6289646710859`)
- **Prolog pesan WhatsApp** (opsional, default: "Hi RSU AISYIYAH ...")

Pratinjau di halaman admin ikut memperlihatkan hasil styling SMART secara real-time.

## Data Model

Migrasi menambah kolom di tabel `hero_content`:
- `smart_word` TEXT (default "SMART")
- `smart_desc` TEXT (default "— Sehat · Mutu · Amanah · Ramah · Terampil")
- `smart_color` TEXT (default "#D4AF37" / gold)
- `smart_desc_color` TEXT (default "#FFFFFF")
- `smart_font_family` TEXT (default "sans")
- `smart_font_size` INTEGER (default 18)
- `pendaftaran_wa_number` TEXT (default "6289646710859")
- `pendaftaran_wa_prolog` TEXT (default "Hi RSU AISYIYAH Purworejo, saya ingin mendaftar.")

## Integrasi Frontend

- `src/routes/index.tsx`: render badge SMART pakai kolom baru + style inline (color, fontFamily, fontSize).
- `src/components/PendaftaranModal.tsx`: terima prop `waNumber` dan `waProlog` (atau ambil dari `hero_content`), gunakan pada URL WhatsApp dan awali pesan dengan prolog.
- Realtime channel sudah mendengarkan `hero_content`, jadi perubahan otomatis muncul.

## Files

- Migration: kolom baru di `hero_content`
- Edit `src/routes/administrator.hero-content.tsx` (form + preview)
- Edit `src/routes/index.tsx` (render dinamis SMART + oper WA ke modal)
- Edit `src/components/PendaftaranModal.tsx` (pakai WA number & prolog dari props)
