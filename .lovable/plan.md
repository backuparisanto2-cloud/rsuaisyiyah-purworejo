# Tombol Chatbot Aisha Bisa Dipindah (Draggable)

## Tujuan
Tombol lingkaran chatbot bisa digeser/dipindah ke posisi mana pun di layar, baik di smartphone (sentuh) maupun desktop (mouse), tanpa mengganggu fungsi klik untuk membuka chat.

## Yang Akan Dibangun

### 1. Drag dengan Pointer Events (`src/components/ChatbotArini.tsx`)
- Gunakan **Pointer Events** (`onPointerDown/Move/Up`) + `setPointerCapture` agar satu kode menangani sentuhan mobile dan mouse desktop sekaligus.
- Tambahkan `touch-action: none` pada tombol supaya drag tidak bentrok dengan scroll halaman.

### 2. Bedakan Klik vs Geser
- Jika pointer bergerak < 6px: dianggap **klik** → buka panel chat seperti biasa.
- Jika bergerak ≥ 6px: dianggap **drag** → tombol mengikuti jari/kursor, klik dibatalkan.

### 3. Batasi dalam Layar (Clamping)
- Posisi tombol selalu di-clamp agar tetap di dalam viewport (margin 8px dari tepi), termasuk saat rotasi/resize layar.

### 4. Posisi Tersimpan
- Posisi terakhir disimpan ke `localStorage` (`aisha-fab-pos`), jadi setelah refresh/pindah halaman tombol tetap di posisi pilihan pengguna.
- Posisi disimpan sebagai koordinat `left/top` agar bebas di semua sisi layar.

### 5. Snap ke Tepi (opsional, disertakan)
- Saat drag dilepas, tombol otomatis "snap" halus ke tepi kiri atau kanan layar (yang terdekat) dengan transisi — umum untuk FAB agar tidak menutupi konten tengah.

### 6. Panel Chat
- Panel chat tetap muncul dari pojok kanan bawah seperti sekarang (tidak mengikuti posisi tombol) agar layout panel tidak rusak di mobile.

## File yang Diubah
- `src/components/ChatbotArini.tsx` — seluruh logika drag, state posisi, clamping, snap, dan persistensi.

## Verifikasi
- Tes drag via Playwright: geser tombol di viewport mobile (384px) dan desktop (1280px), cek posisi berubah, klik tetap membuka chat, dan posisi bertahan setelah reload.
