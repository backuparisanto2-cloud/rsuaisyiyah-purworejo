## Refactor `src/routes/index.tsx` + Footer → Live Cloud Data

Tujuan: 5 section di halaman publik (Tentang, Jam Besuk, Layanan, FAQ, Footer/Kontak) baca dari Supabase + realtime, dengan fallback ke konten statis bila tabel kosong.

### Langkah

1. **Buat 5 komponen publik baru** (`src/components/`):
   - `TentangSection.tsx` — fetch `about_page` (singleton), tampilkan title/subtitle/body/image_url.
   - `JamBesukSection.tsx` — fetch `visiting_hours` where `is_active` order `display_order`.
   - `LayananSection.tsx` — fetch `services` where `is_active`, render akordeon + icon via `service-icons.tsx`.
   - `FaqSection.tsx` — fetch `faqs` where `is_active`, render akordeon.
   - `Footer.tsx` — fetch `contact_settings` (singleton), render alamat/telp/WA/email/IG/map/footer_text/social_links.

2. **Pola tiap komponen**:
   - `useEffect` initial fetch → `useState` data.
   - Realtime channel `postgres_changes` event `*` → refetch.
   - Fallback array statis (disalin dari konten lama `index.tsx`) bila hasil kosong → UI tidak pernah blank.
   - Loading skeleton ringan (opsional, tidak block).

3. **Refactor `src/routes/index.tsx`**:
   - Hapus konstanta statis `LAYANAN`, `FAQS`, blok Tentang, Jam Besuk inline.
   - Import + susun: `<HeroSlider/> <TentangSection/> <JamBesukSection/> <LayananSection/> <JadwalDokter/> <MitraSlider/> <FaqSection/>`.
   - Pertahankan urutan & section IDs yang sudah ada agar anchor/nav tidak rusak.

4. **Footer global**:
   - Cek apakah Footer dipasang di `__root.tsx` atau di `index.tsx`. Ganti yang ada dengan `<Footer/>` baru (driven by Cloud). Tidak ubah route lain.

5. **Seed data tambahan** (migration kecil bila perlu): isi `about_page` singleton + `contact_settings` singleton + 4 visiting_hours dari konten statis lama, supaya saat user buka admin sudah ada baseline yang bisa diedit (bukan form kosong).

### Catatan teknis
- Semua query pakai browser `supabase` client (publik read, RLS sudah allow anon).
- Realtime: satu channel per komponen, unsubscribe di cleanup.
- Tidak menyentuh business logic admin yang sudah jadi.
- Tidak ubah `client.ts`, `types.ts`, `routeTree.gen.ts` secara manual.

### Setelah selesai
Fase 2 tuntas: CRUD admin + render publik live untuk 8 modul (Hero, Tentang, Jam Besuk, Layanan, Dokter, Mitra, Kontak, FAQ).
