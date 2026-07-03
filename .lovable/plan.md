## Perubahan

### 1. Kembalikan tombol WhatsApp di SideButtons ke gaya sebelumnya
File: `src/components/SideButtons.tsx`
- Hapus styling khusus WhatsApp (lingkaran besar hijau glossy + pulse + gradient + ring tebal).
- Samakan kembali dengan tombol lain: kotak rounded `h-10 w-10 rounded-xl bg-[#25D366]` + shadow + ring tipis + hover scale.
- Ikon WhatsApp putih ukuran standar (`h-5 w-5`) agar proporsional dengan tombol sosial lainnya.

### 2. Rapikan posisi & ukuran side buttons di mobile
File: `src/components/SideButtons.tsx`
- Kecilkan sedikit di mobile: `h-9 w-9` di mobile, `h-10 w-10` di `sm:`.
- Geser lebih ke tepi & naikkan sedikit dari titik tengah agar tidak menabrak tombol "Pendaftaran Online" / chatbot mengambang: `right-2 sm:right-3`, `top-[42%] sm:top-1/2`.
- Kurangi gap antar tombol di mobile: `gap-2 sm:gap-2.5`.

### 3. Ubah label chatbot "Tanya Arini" → "Tanya Aisha"
File: `src/components/ChatbotArini.tsx`
- Ganti teks `Arini` menjadi `Aisha` pada tombol mengambang.
- Ganti `aria-label` "Buka chat Arini" → "Buka chat Aisha".
- Alt gambar tetap (aset `arini.png` tidak diubah agar tidak menyentuh backend/asset).

Catatan: nama internal komponen/route dan persona chatbot di backend tidak diubah — hanya label UI yang tampil ke pengunjung.
