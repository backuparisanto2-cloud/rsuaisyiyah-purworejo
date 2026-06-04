# Tutorial Tour Admin Panel

Menambahkan mode tur interaktif yang menjelaskan setiap area admin panel, dijalankan saat user menekan tombol "Mulai Tutorial". Pakai library Shepherd.js untuk highlight elemen + popover bertahap.

## Yang akan dibuat

### 1. Tombol pemicu tour
- Tombol ikon (HelpCircle) "Tutorial" di header admin (`src/routes/administrator.tsx`), sebelah tombol Logout.
- Klik tombol = jalankan tour sesuai konteks:
  - Di halaman root `/administrator` (Dashboard) → tour global (orientasi sidebar + alur kerja).
  - Di halaman lain → tour spesifik halaman tersebut (kalau ada), fallback ke tour global jika halaman belum punya skrip tour.
- Tombol di mobile menampilkan ikon saja; di desktop dengan label "Tutorial".

### 2. Infrastruktur tour (`src/lib/tour.ts`)
- Helper `startTour(tourId)` membuat instance `Shepherd.Tour` dengan opsi default (Tailwind-themed, tombol Sebelumnya/Selanjutnya/Lewati, scroll otomatis).
- Registry `TOURS: Record<string, TourBuilder>` memetakan id → fungsi builder steps (agar bisa dipanggil per halaman).
- Tema custom: override CSS Shepherd via `src/styles.css` mengikuti token (`--background`, `--primary`, `--border`, `--radius`).

### 3. Tour global (`tour:global`)
Steps berfokus pada orientasi keseluruhan, dijalankan dari Dashboard:
1. Welcome popover (tengah layar) — ucapan selamat datang + ringkasan.
2. Highlight sidebar (`aside` atau item nav pertama) — "Semua menu admin ada di sini".
3. Highlight grup Konten Hero (Hero Teks, Hero Slider, Pengaturan Slider).
4. Highlight grup Konten Halaman (Tentang, Jam Besuk, Layanan, Dokter, Mitra, FAQ, Kontak).
5. Highlight Berita & Instagram.
6. Highlight Page Builder + Menu Builder + Urutan Section (alat tata letak).
7. Highlight Tema Warna + Chatbot.
8. Highlight tombol "Lihat website" + Logout di header.
9. Penutup — "Klik tombol Tutorial di halaman manapun untuk panduan spesifik".

### 4. Tour per halaman
Setiap halaman admin utama dapat tour singkat (3-6 langkah). Implementasi: tiap route file mendaftarkan tour-nya via `registerTour('tour:menu', buildMenuTour)` (atau builder didefinisikan terpusat di `src/lib/tour.ts` untuk menjaga agar elemen target diidentifikasi dengan `data-tour="..."` attribute yang ditaruh di komponen halaman).

Halaman yang dapat tour pada fase ini:
- **Menu Builder** (`administrator.menu.tsx`): tombol Tambah, baris item (label/href/switch/move/hapus), badge dirty + tombol Simpan, tombol Reset Default.
- **Page Builder** (`administrator.pages.tsx`): daftar halaman, tombol Baru, editor slug/title/content, tab Menu per-halaman dengan tombol "Tarik dari Menu Utama".
- **Hero Slider** (`administrator.hero-slider.tsx`): upload slide, reorder, toggle aktif.
- **Berita & Instagram** (`administrator.instagram.tsx`): input embed Instagram, daftar post, tombol hapus.
- **Jadwal Dokter** (`administrator.dokter.tsx`): import jadwal, edit baris, simpan.
- **Tema Warna** (`administrator.theme.tsx`): pilih palet, preview, simpan.
- **Chatbot** (`administrator.chatbot.tsx`): system prompt, knowledge base, model.

Halaman lain (Tentang, Jam Besuk, Layanan, Mitra, FAQ, Kontak, Hero Teks, Hero Settings, Urutan Section) memakai tour generik 2 langkah otomatis: highlight kartu utama + tombol Simpan, agar konsisten tanpa harus menulis skrip detail tiap halaman.

### 5. Penanda target (`data-tour`)
Daripada selector CSS rapuh, setiap elemen yang jadi target tour ditandai dengan attribute `data-tour="<id>"` (mis. `data-tour="menu-add"`, `data-tour="menu-save"`, `data-tour="sidebar"`, `data-tour="header-view-site"`). Builder tour memilih lewat `[data-tour="<id>"]`.

### 6. UX detail
- Tombol Tutorial selalu aktif (tidak ada gating localStorage karena pemicu manual).
- Saat tour aktif: scroll otomatis ke elemen, overlay gelap, tombol "Lewati" menutup tour.
- Jika elemen target tidak ditemukan (mis. halaman belum siap render), step di-skip dengan toast info ringan agar tour tidak nyangkut.
- Tour responsive: di mobile, sidebar tersembunyi di balik Sheet → langkah yang menargetkan sidebar otomatis membuka Sheet dulu (handler `beforeShowPromise`).
- Ctrl/Cmd+Shift+H sebagai shortcut opsional untuk membuka tour halaman saat ini.

## Detail teknis

### Dependency
- Tambah `shepherd.js` via bun.
- Import CSS Shepherd: `import 'shepherd.js/dist/css/shepherd.css'` di `src/lib/tour.ts` (one-time).

### File yang disentuh
- **Baru**: `src/lib/tour.ts` — registry + builder semua tour, theming.
- **Edit**: `src/routes/administrator.tsx` — tombol Tutorial di header, prop `data-tour` di sidebar/header/nav, integrasi `beforeShowPromise` membuka mobile Sheet.
- **Edit (penambahan `data-tour` saja, tanpa ubah logika)**:
  - `src/routes/administrator.menu.tsx`
  - `src/routes/administrator.pages.tsx`
  - `src/routes/administrator.hero-slider.tsx`
  - `src/routes/administrator.instagram.tsx`
  - `src/routes/administrator.dokter.tsx`
  - `src/routes/administrator.theme.tsx`
  - `src/routes/administrator.chatbot.tsx`
- **Edit**: `src/styles.css` — kelas `.shepherd-element` mengikuti token desain (background, border, shadow, font).

### Mapping pathname → tourId
Di tombol Tutorial: `const tourId = TOURS[pathname] ? pathnameToId(pathname) : 'tour:global'`. Builder generik dipakai untuk halaman tanpa entry khusus.

### Bundle
Shepherd.js ~30KB gzip + CSS — diimpor hanya di route `/administrator/*` (route tree TanStack code-split per file route), jadi tidak membebani halaman publik.

## Di luar lingkup
- Tidak menyimpan progress tour (selalu mulai dari awal).
- Tidak ada video/GIF — hanya teks + highlight.
- Tidak otomatis muncul untuk user baru (pemicu manual saja, sesuai pilihan).
- Tidak menerjemahkan ke bahasa lain (Bahasa Indonesia saja).
