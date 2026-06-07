## Tujuan

Saat ini chatbot Arini hanya memakai pencocokan kata kunci sederhana terhadap basis pengetahuan, sehingga sering memberi jawaban yang kaku atau jatuh ke fallback. Tujuan: ubah menjadi asisten AI sungguhan yang memahami konteks percakapan, menjawab dalam bahasa alami, dan tetap berpijak pada data resmi rumah sakit.

## Apa yang berubah untuk pengguna

- Jawaban ditulis ulang dalam bahasa alami, ramah, dan sesuai persona "Arini".
- Mengingat percakapan sebelumnya (mis. "tadi saya tanya jadwal dr. X, kalau hari Sabtu bagaimana?").
- Menjawab pertanyaan yang tidak persis cocok kata kunci (sinonim, salah ketik, bahasa Jawa ringan).
- Jawaban mengalir bertahap (streaming) sehingga terasa responsif.
- Tetap menyertakan tautan/kontak yang relevan: WhatsApp CS, halaman layanan, jadwal dokter.
- Indikator "sedang mengetik" dan tombol berhenti.

## Pengaman & batasan

- Hanya menjawab seputar RSU Aisyiyah Purworejo + kesehatan umum ringan; menolak halus topik di luar itu.
- Tidak memberi diagnosis medis — selalu mengarahkan ke layanan/CS untuk keluhan klinis.
- Tetap memakai basis pengetahuan (`chatbot_knowledge`) + data dokter/jadwal/jam besuk/kontak terbaru sebagai sumber kebenaran. Bila tidak ada data, AI mengakui tidak tahu, bukan mengarang.
- Rate-limit per sesi browser (mis. maks 20 pesan / 5 menit) untuk mencegah penyalahgunaan kredit.
- Tangani error 429 (terlalu banyak permintaan) dan 402 (kredit habis) dengan pesan ramah.

## Panel admin

Halaman `administrator/chatbot` ditambah:
- Saklar **Mode AI** (on/off). Jika off, kembali ke pencocokan kata kunci lama (fallback aman).
- Editor **System prompt** (persona + aturan jawab) dengan default yang sudah diisi.
- Slider **Kreativitas** (temperature 0.2–0.9, default 0.4).
- Daftar **Pertanyaan cepat** yang bisa diedit (menggantikan konstanta `QUICK` hardcoded).
- Pilihan **Model** sederhana: Cepat (`gemini-3-flash-preview`, default) / Cerdas (`gemini-2.5-pro`).

## Rincian teknis

1. **Migrasi DB** — tambah kolom di `chatbot_settings`:
   - `ai_enabled` boolean default true
   - `system_prompt` text (default persona Arini)
   - `temperature` numeric default 0.4
   - `model` text default `google/gemini-3-flash-preview`
   - `quick_questions` jsonb default daftar saat ini
   - `max_messages_per_session` int default 20

2. **Server route streaming** baru: `src/routes/api/public/chatbot-chat.ts` (POST).
   - Input: `{ messages: {role, content}[] }`, divalidasi Zod (panjang konten, jumlah pesan ≤ 12 terakhir).
   - Ambil `chatbot_settings` + top-N entri pengetahuan paling relevan via skor kata kunci sederhana di server (cepat, tanpa embedding) untuk dimasukkan sebagai konteks system.
   - Lampirkan ringkasan data live: kontak, jam besuk, daftar dokter aktif + jadwal hari ini.
   - Panggil Lovable AI Gateway dengan `stream: true`, model dari settings.
   - Teruskan SSE ke client; tangani 429/402.
   - Rate-limit sederhana berbasis IP + cookie sesi (in-memory map per worker; tidak butuh KV).
   - `verify_jwt = false` (chat publik untuk pengunjung).

3. **Server fn admin** untuk update settings + quick questions (sudah ada pola serupa di `chatbot.functions.ts`, ditambah `updateChatbotSettings`).

4. **`ChatbotArini.tsx`** — perbarui:
   - Hapus `findAnswer` keyword matching dari path utama; pakai `fetch` streaming ke `/api/public/chatbot-chat`.
   - Render markdown ringan (sudah memuat `react-markdown` jika belum, tambahkan).
   - State `messages` simpan riwayat lengkap; kirim 12 pesan terakhir ke server.
   - Persist riwayat di `sessionStorage` agar pop-up tidak kehilangan konteks saat ditutup-buka.
   - Indikator typing, tombol "Hentikan" (AbortController), tombol "Mulai percakapan baru".
   - Quick questions diambil dari settings.
   - Fallback ke jawaban keyword lama bila `ai_enabled = false` atau request gagal total.

5. **System prompt default** berisi:
   - Persona Arini (sopan, salam Islami opsional, Bahasa Indonesia).
   - Selalu jawab ringkas (≤ 4 kalimat) kecuali diminta detail.
   - Sertakan kontak CS WhatsApp untuk pertanyaan janji temu/keluhan.
   - Tolak halus permintaan diagnosis medis.
   - Boleh menjawab "saya belum punya informasi itu" — tidak boleh mengarang jadwal/nomor.

6. **Sinkronisasi pengetahuan** — fungsi `syncKnowledgeFromWebsite` yang sudah ada tetap dipakai; tidak perlu embedding di tahap ini (skor kata kunci server-side cukup untuk volume entri saat ini).

## Yang TIDAK dikerjakan di plan ini

- Vector embeddings / pgvector (bisa jadi peningkatan lanjutan kalau KB tumbuh > 500 entri).
- Voice input / TTS.
- Eskalasi otomatis ke operator manusia (tetap arahkan ke WhatsApp CS).
- Multi-bahasa selain Bahasa Indonesia.

## Verifikasi setelah implementasi

- Buka chatbot di halaman publik → kirim pertanyaan umum ("jadwal poli anak hari Sabtu", "berapa nomor IGD", "saya batuk 3 hari apa yang harus saya lakukan") dan pastikan jawaban masuk akal + streaming.
- Test pertanyaan di luar konteks ("siapa presiden Indonesia") → ditolak halus.
- Matikan Mode AI di admin → chatbot kembali memakai keyword matching tanpa error.
- Cek panel admin: ubah persona / quick questions, refresh halaman publik, perubahan terlihat.
