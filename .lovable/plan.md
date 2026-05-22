# Section BERITA, INFO TERKINI & PROMO → 15 Post Instagram Terbaru

## Tujuan
Mengganti card statis `PROMO` di section "BERITA, INFO TERKINI & PROMO" agar menampilkan **15 post terbaru** dari Instagram `@rsu_aisyiyah`.

## Konteks
- Saat ini section memakai array statis `PROMO` (src/routes/index.tsx baris 26 & 124).
- Halaman sudah punya widget Elfsight Instagram Feed terpisah di section `#instagram` yang sukses mengambil data (terlihat di network log: endpoint `widget-data.service.elfsight.com/api/posts` mengembalikan post lengkap dengan caption, thumbnail, link, tanggal, likes).
- Instagram tidak menyediakan API publik tanpa OAuth — perlu perantara.

## Pendekatan yang Direkomendasikan: Pakai endpoint Elfsight yang sudah jalan
Widget Elfsight di project ini sudah terhubung ke akun IG `rsu_aisyiyah` dan mengembalikan JSON post. Kita fetch endpoint yang sama dari server function, lalu render sebagai 15 card di section BERITA.

### Langkah
1. **Server function** `src/lib/instagram.functions.ts` (`createServerFn`, GET):
   - Fetch `https://widget-data.service.elfsight.com/api/posts?sources[]=...&sort=date&limit=15&offset=0` dengan header `x-widget-token` yang sama dengan widget Elfsight project ini.
   - Map respons → `{ id, image, caption, link, publishedAt, likes }[]`.
   - Cache response selama ~10 menit via `Cache-Control` header.

2. **Komponen** `src/components/BeritaInstagram.tsx`:
   - Pakai `useQuery` (TanStack Query) memanggil server function via `useServerFn`.
   - Render grid horizontal scroll (mempertahankan style card existing: gradient, hover, dst).
   - Tiap card: thumbnail IG (object-cover), caption ringkas (truncate 2 baris), tanggal, link ke post IG.
   - Skeleton loader saat fetching; fallback ke array `PROMO` lama jika error.

3. **src/routes/index.tsx**:
   - Hapus mapping `[...PROMO, ...PROMO]`, ganti dengan `<BeritaInstagram />`.
   - Judul section tetap "BERITA, INFO TERKINI & PROMO".

### Risiko & Catatan
- Token Elfsight publik di network bisa kedaluwarsa (`exp` ~48 jam). Untuk produksi lebih stabil sebaiknya pakai opsi alternatif di bawah.
- Endpoint Elfsight tidak resmi untuk pemakaian di luar widget mereka — bisa diblokir sewaktu-waktu.

## Alternatif (lebih tahan lama)
- **Firecrawl connector**: scrape `https://www.instagram.com/rsu_aisyiyah/` tiap request (atau cache). Lebih reliable, butuh enable connector Firecrawl.
- **Instagram Basic Display API**: paling resmi, tapi butuh setup Meta Developer App + token user — overhead tinggi.

## Pertanyaan untuk Anda
1. Pakai pendekatan **Elfsight reuse** (cepat, tanpa setup) atau **Firecrawl** (lebih stabil, perlu connect Firecrawl)?
2. Layout card: tetap **horizontal scroll** seperti sekarang, atau **grid 3 kolom** (5 baris × 3) agar 15 post terlihat sekaligus di desktop?
