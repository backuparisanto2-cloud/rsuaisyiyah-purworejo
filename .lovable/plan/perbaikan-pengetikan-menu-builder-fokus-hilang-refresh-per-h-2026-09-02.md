# Perbaikan Pengetikan Menu Builder (Fokus Hilang / Refresh per Huruf)

## Akar Masalah (terkonfirmasi di `src/routes/administrator.menu.tsx`)
1. **Komponen `ItemRow` didefinisikan di dalam `MenuAdmin`** → setiap ketukan huruf memicu re-render, dan React menganggap `ItemRow` sebagai komponen baru → semua input **di-unmount lalu di-mount ulang**, fokus hilang setiap huruf.
2. **Auto-save debounce 800ms + `load()`** → saat berhenti mengetik 800ms, `saveAll()` berjalan lalu memanggil `load()` yang mengeset `loading=true` → seluruh daftar diganti spinner ("refresh") dan state form ditimpa dari server di tengah pengetikan.

## Perbaikan
1. **Pindahkan `ItemRow` keluar dari `MenuAdmin`** menjadi komponen terpisah (props: item, depth, dirtyIds, callbacks). Identitas komponen stabil → input tidak remount, fokus tetap saat mengetik.
2. **Reload di latar belakang tanpa spinner**: tambah parameter `load({ silent })` — reload setelah save tidak mengubah `loading`, sehingga daftar tidak berkedip jadi spinner.
3. **Auto-save tidak menimpa input yang sedang diketik**: setelah save, hanya perbarui `original` (baseline) dari hasil save, dan biarkan `items` apa adanya (tidak di-set ulang dari server kecuali ada perubahan struktural seperti tambah/hapus/urutan).
4. Naikkan debounce auto-save ke ~1500ms dan reset timer setiap ketikan, agar save tidak terjadi di tengah rangkaian pengetikan cepat.

## File yang Diubah
- `src/routes/administrator.menu.tsx` saja.

## Verifikasi
- Playwright: ketik beberapa huruf cepat di kolom Label → fokus tetap, teks tidak hilang, tidak ada spinner muncul di tengah pengetikan; status "Tersimpan" muncul setelah berhenti mengetik.
