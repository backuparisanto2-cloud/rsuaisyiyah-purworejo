## 1. Logo navbar — diperbesar & hilangkan background hitam

File: `src/components/Header.tsx`

- Hapus `bg-white/5` di pembungkus logo (sumber "background hitam" yang terlihat — sebenarnya transparan tapi berada di atas navbar gelap, jadi tampak hitam).
- Hilangkan juga `p-0.5` agar logo mengisi penuh ring (tidak ada cincin gelap di dalam outline kuning).
- Perbesar ukuran logo:
  - Mobile: `h-16 w-16` (sebelumnya 14)
  - Desktop: `h-20 w-20` (sebelumnya 72px)
- Tinggi navbar dinaikkan: `h-20` → `h-24` agar logo besar tidak terpotong.
- Ring kuning + glow tetap dipertahankan (`ring-[3px] ring-gold` + `shadow-[0_0_18px_rgba(234,179,8,0.55)]`).

## 2. Embed Instagram — ukuran tepat & alternatif tampilan

**Masalah sebenarnya:** iframe resmi `instagram.com/{user}/embed` **dibatasi Instagram hanya menampilkan ±6 post terakhir + header profil**. Memperbesar `height` iframe **tidak** menambah post — hanya menghasilkan area putih kosong di bawahnya (itu yang Anda lihat). Tidak ada parameter resmi untuk menambah jumlah post.

File: `src/routes/index.tsx` (section `#instagram`)

**Perbaikan langsung (default, gratis, tanpa dependency):**
- Turunkan tinggi iframe ke ukuran yang pas dengan konten aslinya: `h-[760px] sm:h-[820px] md:h-[880px]` — supaya 6 post tampil utuh **tanpa ruang putih kosong** dan enak di-scroll di semua ukuran layar.
- Lebar dibatasi `max-w-2xl mx-auto` agar embed tidak terlalu lebar di desktop (embed Instagram dirancang untuk lebar ±540px, melar membuat layout pecah).
- Tambah tombol "Buka di Instagram" yang sudah ada (sudah oke).

**Alternatif tampilan embed (saya rekomendasikan pilih salah satu — jawab di chat berikutnya kalau mau saya implementasi):**

| Opsi | Jumlah post | Biaya | Catatan |
|---|---|---|---|
| **A. Iframe resmi (sekarang)** | 6 post | Gratis | Paling simple. Saya rapikan tingginya. |
| **B. Grid manual 6–12 post** | Manual | Gratis | Saya buat grid 3×3/3×4 berisi link ke post Instagram pilihan Anda. Anda kirim URL post-nya, saya pasang sebagai card dengan gambar + caption pendek. Tampilan paling rapi & cepat dimuat. |
| **C. SnapWidget / LightWidget / Elfsight** | 9–24 post otomatis | Gratis (tier dasar) / berbayar | Auto sync dari Instagram. Perlu daftar akun di pihak ketiga, lalu paste 1 script. Saya bisa pasang setelah Anda kasih embed code-nya. |
| **D. Instagram Graph API + Lovable Cloud** | Tanpa batas, auto sync | Gratis (perlu app Meta) | Paling powerful tapi butuh setup Meta Developer App + token. Effort paling besar. |

**Rencana sekarang:** kerjakan **Opsi A** (rapikan tinggi iframe) supaya tampilan langsung enak. Untuk opsi B/C/D, saya tunggu konfirmasi Anda.

## 3. Tidak ada perubahan lain
Section lain (hero, jadwal dokter, modal, WhatsApp button) tidak disentuh.
