# Tambahkan Foto Dokter ke Kartu Jadwal Poliklinik

## Tujuan
Mengganti placeholder ikon `User` pada setiap kartu dokter di section **JADWAL POLIKLINIK RAWAT JALAN** dengan foto dokter masing-masing. Foto akan di-enhance agar:
- Warna/tone seragam (background hijau muda lembut yang selaras dengan tema kartu)
- Subjek dokter di-crop rapi (head & shoulders / portrait bersih)
- Background asli yang berbeda-beda dihilangkan agar konsisten

## Pemetaan Foto → Dokter
| # | Dokter | File upload |
|---|---|---|
| 1 | dr. Sulistyo Suharto, M.Si.,Med.,Sp.A | image-4.png |
| 2 | dr. Lestari Handayani, Sp.N | image-5.png |
| 3 | dr. Padmi Bektilestari, Sp.PD | image-6.png |
| 4 | dr. Yudha Irla Saputra, Sp.PD, M.M.R | image-7.png |
| 5 | dr. Albert Novriadi, Sp.OG | image-8.png |
| 6 | drg. Idha Widiastuti, SE, MM | image-9.png |
| 7 | dr. Proginova Dian Yudatama, Sp.B | image-10.png |
| 8 | dr. Muhammad Fandi G, Sp.Rad., M.Med.Sc | image-11.png |
| 9 | dr. Arif Setyo Hutomo, Sp.JP | image-12.png |
| 10 | dr. Dianing Pratiwi, M.Med.Sc.PK | image-13.png |

## Langkah Implementasi

1. **Proses tiap foto dengan AI image edit** (`imagegen--edit_image`)
   - Crop ke portrait head & shoulders
   - Ganti background asli dengan background hijau muda lembut yang konsisten (selaras `#3d6b3a` tema section), atau transparan + frame hijau di komponen
   - Penyesuaian warna agar tone seragam
   - Simpan ke `src/assets/dokter/dokter-1.png` … `dokter-10.png`

2. **Update `src/components/JadwalDokter.tsx`**
   - Tambahkan import 10 foto dokter
   - Tambah field `foto` pada tipe `Dokter` dan isi pada tiap entri
   - Ganti blok ikon `User` (kotak 20x20 dengan ikon) menjadi `<img>` foto dokter — tetap ukuran `h-20 w-20`, `rounded-xl`, `object-cover`, border halus hijau, fallback bila gambar gagal

3. **QA visual**
   - Cek preview: foto tampil rapi, tone seragam, tidak terdistorsi, layout kartu tetap balance

## Catatan Teknis
- Tidak mengubah data jadwal, urutan kartu, atau styling kartu lain.
- Tidak menyentuh logika WA / modal detail.
- Ikon `User` dari `lucide-react` akan dihapus dari import jika sudah tidak dipakai.
