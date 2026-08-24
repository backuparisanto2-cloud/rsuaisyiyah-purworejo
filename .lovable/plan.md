# Tema tampil instan saat halaman dimuat

Saat ini warna tema baru diterapkan setelah halaman selesai dimuat di browser (data tema diambil lewat JavaScript sesudah render). Akibatnya pengunjung melihat warna default dulu, lalu warna berkedip berubah ke tema yang dipilih admin.

## Yang akan dilakukan

1. Ambil pengaturan tema di sisi server sebelum halaman dikirim, lalu sisipkan warnanya langsung sebagai style di dalam `<head>`. Halaman tampil dengan warna admin sejak frame pertama — tanpa kedip.
2. Simpan salinan tema di browser (localStorage) sebagai cadangan, diterapkan lebih awal jika data server belum tersedia.
3. Tetap pertahankan pembaruan realtime yang sudah ada: saat admin mengubah warna, halaman yang terbuka langsung ikut berubah.
4. Cache tema sisi server sebentar (± 60 detik) agar tidak menambah waktu muat tiap kunjungan.

## Detail teknis

- Tambah `src/lib/theme.functions.ts`: server function `getThemeSettings` memakai klien publik (RLS `theme_settings public read` sudah mengizinkan `anon`), dengan cache in-memory pendek.
- Panggil di `beforeLoad`/`loader` root (`src/routes/__root.tsx`), lalu di `head()` tambahkan `styles: [{ children: ":root{--primary:...;--background:...}" }]` (atau tag style inline) hasil pemetaan kolom → CSS variable, memakai peta yang sama dengan `VAR_MAP` sekarang (termasuk mirror `--card`, `--popover`, `--input`).
- Pindahkan `VAR_MAP` + fungsi `buildCssVars(row)` ke modul bersama agar dipakai server (string CSS) dan klien (apply runtime).
- `src/components/ThemeProvider.tsx`: terima tema awal dari route context, terapkan sinkron (tanpa flash), simpan ke localStorage, dan tetap subscribe realtime `postgres_changes` untuk update langsung.
- Jika query tema gagal, fallback ke nilai default di `src/styles.css` tanpa error.
