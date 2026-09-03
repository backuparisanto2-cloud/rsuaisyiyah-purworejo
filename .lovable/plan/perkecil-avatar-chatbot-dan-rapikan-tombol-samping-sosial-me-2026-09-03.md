# Perkecil avatar chatbot dan rapikan tombol samping sosial media

## Tujuan
1. Mengecilkan avatar chatbot Aisha sedikit lebih jauh (zoom out ke 0.78) agar proporsi wajah lebih pas di dalam lingkaran.
2. Merapikan tampilan tombol samping sosial media: membuatnya transparan/glassy dan menghilangkan sisa "crop" / ring putih yang terlihat tidak rapi.

## Perubahan yang akan dilakukan

### 1. Avatar chatbot di-zoom out ke 0.78
- `src/components/ChatbotArini.tsx`: tambahkan `transform: scale(0.78)` dan `transformOrigin: center` pada elemen avatar sprite di dalam tombol mengambang.
- `src/components/ChatbotPanel.tsx`: tambahkan transform yang sama pada avatar sprite di header panel chat.
- Tetap pertahankan ukuran lingkaran luar (h-16 w-16 / h-12 w-12) sehingga hanya isi avatar yang mengecil, bukan seluruh tombol.

### 2. Tombol samping sosial media dijadikan transparan dan rapi
- `src/components/SideButtons.tsx`:
  - Hapus background warna solid per tombol (`bgFor`) diganti dengan tampilan transparan/glassy, misalnya `bg-black/40` atau `bg-background/70` dengan `backdrop-blur-sm` agar tetap terbaca di atas berbagai latar halaman.
  - Hapus `ring-2 ring-white/70` yang membuat bingkai putih/crop tidak rapi di sekitar tombol.
  - Pertahankan ikon putih (atau sesuaikontras) dan efek hover `hover:scale-110` agar tetap interaktif.
  - Tetap pertahankan ukuran, spacing, safe-area, scroll, dan perilaku realtime/subscription.

## Verifikasi
- Screenshot tombol chat Aisha dan header panel chat memperlihatkan avatar lebih kecil di dalam lingkaran.
- Screenshot tombol samping di desktop dan mobile menunjukkan tampilan transparan tanpa bingkai putih yang tidak rapi.
