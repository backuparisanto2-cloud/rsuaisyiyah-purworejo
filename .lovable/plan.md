# Tambah FAQ & Rapikan Menu Navigasi

## Masalah
1. Menu header berisi item & submenu (Dokter Kami, Artikel, Sejarah, Visi-Misi, Paviliun, dll.) yang **tidak ada anchornya** di halaman → klik tidak ke mana-mana.
2. Section "BERITA, INFO TERKINI & PROMO" pakai `id="layanan"` (membingungkan).
3. Belum ada section FAQ.

## Perubahan

### 1. `src/components/Header.tsx` — rapikan menu
Ganti array `NAV` agar hanya berisi section yang nyata, baik untuk desktop maupun mobile (keduanya pakai array yang sama):

- Beranda → `#beranda`
- Tentang Kami → `#tentang`
- Berita & Info → `#layanan`
- Jadwal Dokter → `#jadwal`
- Instagram → `#instagram`
- FAQ → `#faq` (baru)
- Kontak → `#kontak`

Hapus seluruh dropdown `sub` (tidak ada halaman tujuannya). Tutup mobile menu otomatis saat klik (sudah ada).

### 2. `src/routes/index.tsx` — tambah section FAQ
Sisipkan sebelum section `#kontak`:

```tsx
<section id="faq" className="py-20 px-6 bg-muted/30">
  <div className="max-w-4xl mx-auto">
    <p className="text-center text-sm font-semibold tracking-widest text-secondary uppercase">FAQ</p>
    <h2 className="mt-2 text-2xl md:text-3xl font-bold text-center text-primary">
      Pertanyaan yang Sering Diajukan
    </h2>
    <p className="text-center text-muted-foreground mt-2 text-sm">
      Informasi seputar layanan RSU Aisyiyah Purworejo
    </p>
    <Accordion type="single" collapsible className="mt-10 space-y-3">
      {FAQS.map((f, i) => (
        <AccordionItem key={i} value={`item-${i}`} className="bg-white rounded-xl border px-5 shadow-sm">
          <AccordionTrigger className="text-left font-semibold text-primary hover:no-underline">
            {f.q}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            {f.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
</section>
```

Tambah import `Accordion, AccordionItem, AccordionTrigger, AccordionContent` dari `@/components/ui/accordion`.

### 3. Daftar FAQ (10 pertanyaan relevan tentang RSU Aisyiyah Purworejo)

1. **Di mana lokasi RSU Aisyiyah Purworejo?**
   Jl. Jend. Sudirman No. 12, Purworejo, Jawa Tengah. Lihat peta di section Kontak.

2. **Bagaimana cara mendaftar berobat?**
   Klik tombol "Pendaftaran Online" di hero, atau hubungi WhatsApp CS 0896-4671-0859. Bisa juga datang langsung ke loket pendaftaran.

3. **Apakah menerima pasien BPJS Kesehatan?**
   Ya, kami melayani pasien BPJS Kesehatan, asuransi swasta, dan pasien umum.

4. **Jam operasional IGD?**
   IGD buka 24 jam setiap hari, termasuk hari libur.

5. **Kapan jam besuk pasien?**
   Siang 11.00–13.30 WIB dan sore 17.00–19.00 WIB.

6. **Bagaimana cara melihat jadwal dokter?**
   Lihat di section "Jadwal Dokter" pada halaman ini, atau hubungi CS untuk konfirmasi.

7. **Apakah tersedia layanan ramah difabel?**
   Ya, fasilitas kami dirancang ramah difabel mulai dari akses, toilet, hingga pendampingan layanan.

8. **Layanan unggulan apa saja yang tersedia?**
   Paviliun Multazam, Bedah Anak, Uronefrologi, Stem Cell, Rawat Inap, IGD 24 Jam, dan berbagai poli spesialis.

9. **Status akreditasi rumah sakit?**
   Terakreditasi PARIPURNA dan tersertifikasi LARSI.

10. **Bagaimana memberikan kritik & saran?**
    Melalui WhatsApp CS 0896-4671-0859 atau email info@rspkukaranganyar.id.

## Catatan
- Tidak menambah dependency baru — `Accordion` shadcn sudah ada.
- Section `#layanan` tetap dipakai (tidak diubah idnya) supaya tidak merusak link lain.

Setuju? Ketik **Approve plan** untuk saya jalankan.
