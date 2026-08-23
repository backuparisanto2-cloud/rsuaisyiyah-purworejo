# Perbaikan Tombol Samping (Side Menu) di Semua Ukuran Layar

## Temuan dari pengecekan langsung

- Di beranda, kontainer tombol samping memang ada dan tampil (`position: fixed`, `z-index: 100`), berisi 3 tombol aktif: WhatsApp, Instagram, Aksesibilitas. YouTube, TikTok, dan Facebook statusnya nonaktif di database, jadi memang sengaja tidak muncul.
- Saat di-scroll ke tengah halaman, tombol tetap berada paling depan (tidak tertutup section biasa).
- Ada satu elemen pihak ketiga (widget feed Instagram) yang memakai `z-index: 999999` dan `position: fixed`. Saat overlay/popup-nya aktif, elemen ini pasti menutupi tombol samping — ini satu-satunya penutup nyata yang terkonfirmasi.
- Tombol samping hanya dipasang di beranda. Halaman hasil Page Builder (`/p/<slug>`) tidak memuatnya sama sekali, sehingga di halaman-halaman itu tombol memang "tidak muncul".
- Ada komponen lama `SideSocial` dan `WhatsAppButton` yang memakai posisi tetap serupa; keduanya tidak lagi dipakai di halaman manapun.

## Yang akan dikerjakan

1. Naikkan lapisan tombol samping ke level yang aman di atas widget pihak ketiga, dengan pengecualian: tetap di bawah menu mobile dan dialog (modal pendaftaran, panel chatbot, panel aksesibilitas) supaya tidak menutupi form.
2. Rapikan posisi agar konsisten di mobile, tablet, dan desktop: jarak aman dari tepi kanan, aman terhadap area notch/gesture bar, dan tidak bertabrakan dengan tombol chatbot di kanan bawah maupun tombol pendaftaran.
3. Batasi tinggi tumpukan tombol dan buat bisa scroll internal bila jumlah tombol aktif bertambah, agar di layar pendek tidak terpotong.
4. Tampilkan tombol samping juga di halaman Page Builder (`/p/<slug>`) supaya konsisten dengan beranda.
5. Bersihkan komponen lama yang tidak terpakai (`SideSocial`, `WhatsAppButton`) agar tidak ada duplikasi posisi di masa depan.
6. Uji ulang secara nyata pada tiga viewport (mobile 390px, tablet 820px, desktop 1440px) di beberapa posisi scroll (atas, tengah, bawah), termasuk saat menu mobile terbuka dan saat modal pendaftaran terbuka, lalu lampirkan hasil pengecekan.

## Catatan teknis

- Skala z-index yang dipakai: header `z-30`, dropdown header `z-40`, menu mobile & panel `z-50`, tombol samping akan dipindah ke lapisan khusus di atas widget eksternal, sementara overlay/dialog memakai lapisan lebih tinggi lagi.
- Perubahan hanya pada `src/components/SideButtons.tsx`, `src/routes/p.$slug.tsx`, dan penghapusan dua file komponen lama. Tidak ada perubahan data atau logika bisnis.
- Pengecekan dilakukan dengan browser headless (screenshot + hit-test pada titik tengah tombol) untuk memastikan tombol benar-benar bisa diklik, bukan hanya terlihat.
