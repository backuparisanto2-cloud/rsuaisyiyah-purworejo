## Ringkasan
Refactor komponen `SideSocial.tsx` agar URL WhatsApp dan Instagram tidak lagi hard-coded, melainkan membaca dari tabel `contact_settings` di Lovable Cloud dengan realtime subscription.

## Detail
1. **File**: `src/components/SideSocial.tsx`
2. **Pola**: Gunakan `useEffect` untuk fetch awal + `postgres_changes` realtime subscription ke tabel `contact_settings` (sama seperti `Footer.tsx` dan `KontakSection.tsx`).
3. **Fallback**: Jika data kosong, gunakan nilai fallback yang sudah ada sekarang (`6289646710859` dan link Instagram RSU Aisyiyah).
4. **WA link**: Bangun `href` dari kolom `whatsapp` (strip non-digit → `https://wa.me/<digits>?text=Halo%20RSU%20Aisyiyah...`). Pesan default tetap sama.
5. **Visibility**: Jika kolom `whatsapp` atau `instagram` kosong, sembunyikan tombol terkait.
6. **Tidak berubah**: Posisi fixed kanan, ikon, styling, dan animasi hover tetap sama.

## Setelah selesai
- Tombol WhatsApp & Instagram di floating sidebar mengikuti data yang diatur di panel admin **Kontak/Footer**.
- Perubahan via admin langsung realtime tanpa reload halaman.