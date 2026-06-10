## Tujuan
Tambah simpan otomatis **draft lokal** (bukan publish ke database) di editor Ringkasan Beranda, sehingga perubahan tidak hilang saat refresh halaman.

## Perilaku
- Saat editor terbuka (`editing != null`), setiap perubahan field dipantau.
- Draft disimpan ke `localStorage` setelah jeda **1,5 detik** sejak perubahan terakhir (debounce), agar tidak menulis di setiap ketikan.
- Indikator kecil di footer editor: "Menyimpan draft…", "Draft tersimpan • HH:MM:SS", atau "Belum ada perubahan".
- Saat editor dibuka:
  - **Item baru** → jika ada draft `new`, tawarkan dialog: "Lanjutkan draft sebelumnya?" (Lanjutkan / Buang).
  - **Edit item lama** → jika ada draft untuk `id` itu DAN berbeda dari data DB, tawarkan dialog yang sama.
- Draft dihapus otomatis setelah **Simpan berhasil**, setelah tombol **Buang draft**, atau setelah pengguna menolak memulihkannya.
- Tombol manual **"Buang draft"** muncul di footer saat ada draft aktif.

## Kunci penyimpanan
- `ringkasan:draft:new` untuk item baru.
- `ringkasan:draft:<row.id>` untuk edit item yang sudah ada.
- Nilai: `{ data: Row, savedAt: number }`.

## Integrasi dengan Undo/Redo yang sudah ada
- Pemulihan draft mengisi `editing` saja; `original` tetap dari DB sehingga **Batalkan Perubahan** mengembalikan ke versi DB (perilaku undo tidak berubah).
- `redo` direset saat draft dipulihkan (konsisten dengan `openEditor`).

## Perubahan file
**`src/components/admin/SummaryAdmin.tsx`** (satu-satunya file yang disentuh)
1. Helper `draftKey(editing)`, `loadDraft(key)`, `saveDraft(key, row)`, `clearDraft(key)`.
2. State baru: `draftSavedAt: number | null`, `draftStatus: 'idle' | 'saving' | 'saved'`.
3. `useEffect` debounce 1500 ms pada `editing` → tulis ke localStorage, update status.
4. Di `openEditor(r)` dan `openNew()`: cek draft, jika ada tampilkan `confirm()` sederhana untuk memulihkan; jika dipulihkan, set `editing` dari draft.
5. Di `save()` sukses dan saat unmount editor via tombol **Batal**: bersihkan draft terkait.
6. Footer editor: tambahkan label status draft + tombol **Buang draft** (disabled jika tidak ada draft).

## Yang TIDAK berubah
- Skema database, RLS, server functions, dan komponen publik `RingkasanSection`.
- Logika Simpan/Undo/Redo/upload gambar tetap sama; autosave hanya lapisan tambahan di sisi klien.
