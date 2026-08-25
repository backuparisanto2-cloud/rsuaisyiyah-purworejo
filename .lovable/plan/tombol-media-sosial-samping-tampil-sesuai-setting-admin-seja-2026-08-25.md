# Tombol media sosial samping tampil sesuai setting admin sejak awal

Saat ini komponen tombol samping memulai dengan daftar bawaan berisi 6 tombol (WhatsApp, Instagram, YouTube, TikTok, Facebook, Aksesibilitas), lalu setelah data dari database selesai dimuat di browser, daftar diganti sesuai setting administrator. Akibatnya pengunjung melihat semua tombol dulu, baru berkurang.

## Yang akan dilakukan

1. Hilangkan daftar bawaan sebagai tampilan awal. Tombol hanya dirender dari data setting administrator.
2. Ambil data tombol di sisi server sebelum halaman dikirim, sehingga jumlah tombol sudah benar pada frame pertama (tanpa kedip/berkurang).
3. Selama data belum tersedia (misalnya navigasi sisi klien), tidak menampilkan tombol apa pun ketimbang menampilkan daftar bawaan yang salah.
4. Tetap pertahankan pembaruan realtime: saat admin mengaktifkan/menonaktifkan tombol, halaman terbuka langsung menyesuaikan.

## Detail teknis

- Tambah `src/lib/side-buttons.functions.ts`: server function `getSideButtons` memakai klien publik Supabase (pola yang sama dengan `src/lib/theme.functions.ts`), mengambil baris `side_buttons` dengan `is_active = true` diurutkan `display_order`, plus cache in-memory pendek (~60 detik).
- Panggil di `loader` root (`src/routes/__root.tsx`) bersama tema yang sudah ada, lalu teruskan hasilnya ke `SideButtons` melalui props dari `RootComponent` (atau context) agar dipakai oleh `src/routes/index.tsx` dan `src/routes/p.$slug.tsx` tanpa duplikasi fetch.
- `src/components/SideButtons.tsx`: hapus konstanta `FALLBACK`, mulai dari `initialRows` yang diterima dari server, render `null` bila kosong, dan tetap `subscribe` ke `postgres_changes` tabel `side_buttons` untuk refresh langsung.
- Cache salinan terakhir di `localStorage` sebagai cadangan bila server function gagal, sehingga tetap tidak menampilkan daftar bawaan yang keliru.
