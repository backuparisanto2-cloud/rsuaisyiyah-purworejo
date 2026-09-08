# Chatbot: nomor telepon, WhatsApp, dan email menjadi tautan yang bisa diklik

## Yang akan dikerjakan

Saat menjawab, chatbot akan menampilkan kontak sebagai tautan yang bisa diklik, bukan sekadar teks:

- **Telepon** → tautan `tel:` — sekali klik di ponsel langsung membuka aplikasi telepon dengan nomor terisi.
- **WhatsApp** → tautan `https://wa.me/...` — membuka percakapan WhatsApp di tab/aplikasi baru.
- **Email** → tautan `mailto:` — membuka aplikasi email dengan alamat tujuan terisi.
- Tautan halaman situs tetap berpindah di dalam aplikasi seperti sekarang; tautan luar tetap terbuka di tab baru dengan pengaman standar.

Instruksi kepada chatbot dipertegas: setiap kali menyebut nomor telepon, WhatsApp, atau email dari data kontak rumah sakit, selalu tulis dalam format tautan Markdown, mis. `[0896-4671-0859](https://wa.me/6289646710859)`. Nomor WhatsApp dinormalkan ke format internasional (awalan 0 diubah menjadi 62) sebelum dijadikan tautan, dan boleh ditambah teks pembuka (prolog) bila relevan.

## Detail teknis

- `src/routes/api/public/chatbot-chat.ts`: perluas pesan sistem kedua (baris ~281-287) dengan aturan format kontak:
  - Telepon: `[teks](tel:NNNN)`
  - WhatsApp: `[teks](https://wa.me/62...)` — nomor dari `contact_settings.whatsapp` sudah format internasional; diberi contoh di konteks `[KONTAK]` sebagai tautan siap pakai (`https://wa.me/<digits>`) agar model tidak salah merangkai.
  - Email: `[teks](mailto:alamat)`
  - Di blok `[KONTAK]`, sertakan versi tautan siap pakai: `WhatsApp CS: <no> (tautan: https://wa.me/<digits>)`, `Telepon: <no> (tautan: tel:<digits>)`, `Email: <alamat> (tautan: mailto:<alamat>)`.
- `src/components/ChatbotPanel.tsx`: di `mdComponents.a`, bedakan skema:
  - `tel:` / `mailto:` → tautan biasa tanpa `target="_blank"` (klik langsung menjalankan aplikasi telepon/email).
  - `https://wa.me/...` dan URL luar lain → `target="_blank" rel="noopener noreferrer"` (perilaku saat ini).
  - Internal (`/`, `#`) → navigasi dalam aplikasi (perilaku saat ini, tidak berubah).

Tidak ada perubahan database atau migrasi. Uji di pratinjau: tanyakan "nomor WhatsApp CS" dan "telepon rumah sakit" lalu klik tautannya.
