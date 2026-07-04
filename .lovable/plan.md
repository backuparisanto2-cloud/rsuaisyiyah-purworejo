## Masalah

Saat ini setiap halaman baru dari Page Builder membuat **snapshot** dari menu utama (disalin sekali ke tabel `page_menu_items`). Setelah menu utama berubah, snapshot itu tidak ikut berubah — sehingga Anda harus "mencocokkan" secara manual.

## Solusi

Ubah perilakunya jadi **inherit otomatis (relative/live)**: menu halaman baru langsung mengikuti menu utama tanpa disalin. Anda hanya perlu override kalau memang mau menu berbeda untuk halaman tertentu.

`Header.tsx` sebenarnya sudah otomatis fallback ke `menu_items` bila `page_menu_items` kosong — jadi cukup dengan **tidak menyeed** lagi, semua halaman langsung sinkron.

## Perubahan

**1. `src/routes/administrator.pages.tsx` — `MenuEditor`**
- Hapus auto-seed pada `load()`. Jika `page_menu_items` kosong, tampilkan status:
  > "Halaman ini mengikuti Menu Utama secara otomatis. Setiap perubahan di Menu Utama langsung tercermin di sini."
  dengan tombol **"Override / Kustomisasi Menu"** yang baru menyalin dari menu utama saat diklik (memakai logika seed yang sudah ada, dipindah ke fungsi `overrideFromGlobal()`).
- Ubah tombol "Tarik dari Menu Utama" jadi **"Kembalikan ke Menu Utama"** — hapus semua `page_menu_items` untuk halaman itu, lalu balik ke mode inherit.

**2. `src/components/Header.tsx` — rewrite anchor**
- Saat `pageId` diset (berada di halaman custom `/p/...`), href berformat `#anchor` (mis. `#beranda`, `#kontak`) di-rewrite jadi `/#anchor` supaya link menu tetap membuka section di beranda, bukan mencari anchor di halaman custom.

**3. `src/routes/administrator.pages.tsx` — badge daftar halaman**
- Tambah badge kecil "Menu: Ikut Utama" vs "Menu: Custom" agar user tahu status tiap halaman sekilas.

## Catatan

- Tidak ada perubahan skema database — tabel `page_menu_items` tetap ada, hanya dipakai kalau user memilih override.
- Halaman yang sudah terlanjur punya snapshot lama tetap dianggap "Custom" (tidak dihapus otomatis). User bisa menekan "Kembalikan ke Menu Utama" untuk mengubahnya jadi inherit.
