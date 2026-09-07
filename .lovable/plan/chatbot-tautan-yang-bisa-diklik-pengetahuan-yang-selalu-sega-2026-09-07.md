# Chatbot: tautan yang bisa diklik + pengetahuan yang selalu segar

## Yang akan dikerjakan

### 1. Tautan di jawaban chatbot bisa diklik
- Tautan ke halaman situs (mis. `/p/rawat-inap`, `/#layanan`) berpindah di dalam aplikasi tanpa memuat ulang halaman, dan panel chat otomatis tertutup setelah berpindah.
- Tautan ke situs luar (http/https ke domain lain), nomor telepon, dan WhatsApp terbuka di tab baru dengan pengaman standar.
- Chatbot diberi instruksi agar menyisipkan tautan halaman yang relevan dalam jawabannya, mis. "Selengkapnya di [Rawat Inap](/p/rawat-inap)".

### 2. Sinkron pengetahuan ikut memuat isi halaman page builder
Saat tombol sinkron dijalankan di panel admin, isi halaman yang sudah terbit (judul, deskripsi, dan teks halaman) ikut dipotong menjadi bagian-bagian dan disimpan sebagai pengetahuan, lengkap dengan tautan halamannya. Ringkasan beranda dan daftar menu navigasi juga ikut disertakan.

### 3. Sinkron otomatis saat konten berubah
Tidak perlu lagi menekan tombol sinkron:
- Setiap perubahan pada layanan, FAQ, Tentang Kami, ringkasan beranda, jam besuk, dokter, kontak, menu, dan halaman page builder menandai pengetahuan sebagai "perlu disegarkan".
- Saat ada pengunjung bertanya, chatbot memeriksa tanda itu; bila konten berubah, pengetahuan disegarkan dulu (maksimal sekali per 30 detik) lalu jawaban dikirim.
- Tombol sinkron manual tetap ada, dan di panel admin ditampilkan waktu sinkron terakhir serta status "ada perubahan belum tersinkron".

Catatan: jawaban chatbot memang sudah membaca data langsung dari database untuk fakta seperti jadwal dokter dan jam besuk, jadi perubahan itu sudah tampil seketika. Bagian yang selama ini butuh klik manual adalah basis pengetahuan yang dipakai pencarian makna (semantic search) — itulah yang kini otomatis.

## Detail teknis

- `src/components/ChatbotPanel.tsx`: tambahkan `components={{ a: ... }}` pada `ReactMarkdown`; internal (`/`, `#`) memakai `useNavigate` dari TanStack Router lalu `onClose()`; sisanya `target="_blank" rel="noopener noreferrer"`.
- `src/routes/api/public/chatbot-chat.ts`: tambah instruksi tautan pada pesan sistem; sebelum menjawab panggil pemeriksaan `knowledge_sync_state` dan jalankan sinkron bila `dirty` dan sinkron terakhir > 30 detik lalu.
- `src/lib/chatbot.functions.ts`: `syncKnowledgeFromWebsite` diperluas — tambah entri dari `custom_pages` (dipotong dengan `chunkText` yang sudah ada), `home_summary_sections`, `menu_items`; setelah insert, embedding otomatis dibuat untuk entri baru; set `knowledge_sync_state.dirty = false`, `last_synced_at = now()`. Logika inti dipindah ke helper yang bisa dipanggil dari server function maupun dari route API.
- Migrasi: tabel `knowledge_sync_state` (baris tunggal: `dirty`, `last_synced_at`) dengan GRANT + RLS (baca untuk anon/authenticated, tulis hanya service role), fungsi trigger `mark_knowledge_dirty()`, dan trigger `AFTER INSERT/UPDATE/DELETE` pada `services`, `faqs`, `about_page`, `home_summary_sections`, `visiting_hours`, `doctors`, `doctor_schedules`, `contact_settings`, `menu_items`, `custom_pages`.
- `src/routes/administrator.chatbot.tsx`: tampilkan waktu sinkron terakhir dan badge "perlu disinkronkan".
