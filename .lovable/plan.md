# Sprite Chatbot Lebih Ringan & Hapus Titik Hijau

## Masalah
1. Sprite avatar Aisha saat ini berukuran ~970 KB (PNG 14 frame) — berat untuk dimuat di mobile.
2. Di dalam lingkaran avatar tombol mengambang ada titik kecil hijau ber-outline putih (indikator online) yang mengganggu tampilan.

## Yang akan dikerjakan

### 1. Kompresi sprite
- Ambil sprite yang ada, kecilkan tiap frame ke ukuran tampilan wajar (misal 128px per frame, sprite jadi ~1792 px lebar) lalu ekspor sebagai WebP berkualitas tinggi.
- Target ukuran akhir di bawah ~120 KB tanpa penurunan tampak pada lingkaran 64px/48px.
- Unggah sebagai aset baru dan perbarui `src/assets/aisha-sprite.png.asset.json` (pointer diganti ke file baru); aset lama dihapus setelah pointer diperbarui.

### 2. Hapus titik hijau kecil
- Di `src/components/ChatbotArini.tsx`, hapus elemen titik status hijau ber-ring putih di pojok kanan bawah lingkaran avatar.
- Outline hijau tipis pada lingkaran avatar, ukuran, posisi 23px, dan animasi 4 detik tetap tidak berubah.

## Catatan teknis
- Tidak ada perubahan backend/skema. Hanya aset dan dua komponen frontend (`ChatbotArini.tsx`, dan `ChatbotPanel.tsx` hanya jika perlu penyesuaian ukuran background).
