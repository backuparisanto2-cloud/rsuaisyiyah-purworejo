
## Tujuan

Di halaman admin **Jadwal Dokter** (`/administrator/dokter`), tambahkan kemampuan upload foto/scan jadwal poliklinik. AI merapikan & mengekstrak data terstruktur, hasilnya ditampilkan dalam **dialog preview yang bisa diedit** sebelum disimpan ke database.

Dua tombol akan disediakan:
1. **Import Jadwal (1 Dokter)** — ada di dalam panel jadwal dokter terpilih.
2. **Import Multi-Dokter** — ada di header halaman, mengekstrak banyak dokter sekaligus.

Saat menyimpan, user memilih mode **Replace** (hapus jadwal lama dokter tsb) atau **Append** (tambahkan).

## Alur Pengguna

```text
[Upload gambar JPG/PNG] → [Loading: AI ekstrak] → [Dialog Preview]
   ↓ edit baris (hari, jam, poli, nama, spesialis)
   ↓ pilih: Replace / Append
   ↓ untuk multi-dokter: cocokkan dgn dokter existing (dropdown) atau "Buat dokter baru"
[Simpan] → toast sukses → list refresh
```

## Komponen & File

### Baru
- `src/lib/schedule-ocr.functions.ts` — server function `extractScheduleFromImage`:
  - Input: `{ imageBase64: string; mode: "single" | "multi"; doctorName?: string; doctorSpecialty?: string }`
  - Panggil Lovable AI Gateway (`google/gemini-2.5-flash`, multimodal `image_url`) dengan **tool calling** untuk JSON terstruktur:
    - `single` → `{ schedules: [{ day_of_week: 0..6, time_start: "HH:MM", time_end: "HH:MM", poli: string }] }`
    - `multi` → `{ doctors: [{ name, specialty, schedules: [...] }] }`
  - Handle 429/402 dan kembalikan error ramah.
- `src/components/admin/ScheduleImportDialog.tsx` — komponen dialog yang dipakai kedua mode:
  - Stage 1: upload gambar (drag & drop / file picker), preview thumbnail.
  - Stage 2: tabel hasil ekstraksi yang editable (Select hari, Input time, Input poli; tombol hapus baris & tambah baris). Untuk multi-mode: tiap dokter punya group dengan field nama, spesialis, dropdown "Cocokkan ke existing / Baru".
  - Footer: RadioGroup Replace/Append + tombol Simpan.

### Diedit
- `src/routes/administrator.dokter.tsx`:
  - Tombol "Import Multi-Dokter (AI)" di header.
  - Tombol "Import dari Gambar (AI)" di dalam `SchedulePanel`.
  - Handler simpan: untuk Replace, `delete().eq("doctor_id", id)` lalu `insert(rows)`; untuk Append, `insert(rows)` saja. Untuk multi-mode dokter baru, `insert` ke `doctors` dulu lalu ambil id.

### Tidak diubah
- Tabel database. Tidak ada migrasi DB. Pakai `doctors` & `doctor_schedules` yang ada.
- Storage: gambar tidak disimpan permanen — di-encode base64 di client lalu dikirim ke server fn, tidak diupload ke bucket.

## Catatan Teknis

- **Ukuran gambar**: resize/compress di client (canvas, max 1600px sisi panjang, JPEG q=0.85) sebelum kirim ke server fn agar payload AI hemat.
- **Mapping hari**: AI diminta mengeluarkan `day_of_week` numerik 0–6 (Minggu=0) sesuai konvensi tabel existing.
- **Format jam**: AI menormalkan ke `HH:MM` 24-jam.
- **Server fn auth**: pakai `requireSupabaseAuth` agar hanya admin yang bisa memanggil; key Lovable AI dibaca dari `process.env.LOVABLE_API_KEY` di dalam handler.
- **Verifikasi `attachSupabaseAuth`** sudah terdaftar di `src/start.ts` (dari pekerjaan sebelumnya).

## Out of Scope

- Tidak menyimpan history gambar yang diupload.
- Tidak ada auto-crop/auto-rotate gambar selain compress.
- Tidak menambah kolom DB baru.

