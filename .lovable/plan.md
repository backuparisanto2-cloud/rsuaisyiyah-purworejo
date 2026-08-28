# Perbaikan Avatar Chatbot Aisha

## Masalah

1. Header di form chat masih menampilkan foto lama karena kolom `avatar_url` di pengaturan chatbot diprioritaskan di atas sprite animasi baru.
2. Sprite animasi saat ini masih membawa lingkaran hijau bernomor (1, 2, 3, dst) di pojok kiri atas tiap frame — terlihat jelas di dalam lingkaran avatar.
3. Wajah tidak berada tepat di tengah lingkaran karena tiap frame masih memuat area badan/tangan di sisi kiri.

## Yang akan dikerjakan

### 1. Sprite bersih dan terpusat pada wajah
- Ambil sprite yang ada (3584 x 256, 14 frame), potong ulang tiap frame:
  - buang area kiri-atas yang berisi lingkaran nomor,
  - crop persegi yang berpusat pada kepala/wajah,
  - normalisasi ke ukuran seragam lalu susun kembali jadi satu sprite sheet baru.
- Simpan sebagai aset baru (`aisha-sprite-v3`) dan perbarui `src/assets/aisha-sprite.png.asset.json`.
- Cek visual tiap frame agar tidak ada sisa nomor dan wajah konsisten di tengah.

### 2. Header chat selalu memakai sprite animasi
- Di `src/components/ChatbotPanel.tsx`, hapus percabangan yang mendahulukan `avatar_url`; header selalu merender sprite animasi 14 ekspresi (4 detik per frame), sama seperti tombol mengambang.

### 3. Penyelarasan tampilan lingkaran
- Di `ChatbotArini.tsx` dan `ChatbotPanel.tsx`, samakan penempatan sprite (object/background centering) agar wajah pas di tengah lingkaran pada tombol maupun header, tanpa mengubah ukuran, posisi 23px, atau outline hijau tipis.

## Catatan teknis
- Kolom `avatar_url` tetap ada di database, hanya tidak lagi dipakai untuk avatar chatbot publik; tidak ada perubahan skema atau backend.
