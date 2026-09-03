# Avatar chatbot mengisi penuh lingkaran (tanpa area putih)

## Masalah
Frame sprite (`aisha-sprite-v4.webp`, 14 frame @128px) masih menyisakan latar putih/terang di sekitar wajah. Ditambah `transform: scale(0.78)` di `ChatbotArini.tsx` dan `ChatbotPanel.tsx`, gambar mengecil di dalam lingkaran sehingga area putih container terlihat memotong avatar.

## Yang akan dikerjakan

### 1. Rebuild sprite agar konten mengisi penuh frame
- Unduh sprite saat ini (1792 x 128, 14 frame).
- Per frame: deteksi bounding box konten non-putih, crop ketat ke area wajah/kepala dengan margin kecil, lalu resize "cover" ke 128x128 sehingga seluruh frame (termasuk area lingkaran terinscribe) terisi konten, bukan putih.
- Susun ulang menjadi sprite sheet baru 1792 x 128, kompres WebP, unggah sebagai aset baru dan perbarui `src/assets/aisha-sprite.png.asset.json` (file lama dihapus dari CDN lewat `lovable-assets delete`).

### 2. Hapus zoom-out CSS
- `src/components/ChatbotArini.tsx` dan `src/components/ChatbotPanel.tsx`: hapus `transform: scale(0.78)` / `transformOrigin` pada span avatar — sprite memenuhi lingkaran penuh (`inset-0`, backgroundSize 1400% 100% tetap).

### 3. Verifikasi
- Screenshot Playwright (mobile 384px): tombol FAB dan header panel chat — pastikan wajah mengisi lingkaran tanpa cincin putih, frame berganti normal per 4 detik.

## Catatan teknis
- Tidak ada perubahan skema/backend; hanya aset gambar dan 2 file komponen.
- Jika hasil crop membuat wajah terlalu besar/terpotong dagu, margin crop disesuaikan (mis. 6–10%) lalu dirender ulang.
