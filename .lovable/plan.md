## Tujuan

Halaman admin baru `/administrator/test-page-editor` — visual page builder gaya Elementor (MVP ringkas) yang memakai Global Header, Footer, tema, dan tipografi aplikasi. Hanya admin yang bisa akses. Draft disimpan lokal, dan bisa di-export ke tabel `custom_pages` untuk dipublish sebagai `/p/$slug`.

## Cakupan MVP

**Termasuk:**
- Canvas drag-and-drop dengan live preview
- Panel widget kiri (Dasar, Layout, Media, Reusable RS components)
- Panel properti kanan (edit props widget terpilih)
- Toggle preview Desktop / Tablet / Mobile (mengubah lebar frame canvas)
- Undo / Redo (history stack in-memory)
- Copy / Paste / Duplicate / Delete widget
- Save Draft (localStorage) & Publish (kirim ke `custom_pages`)
- Toggle Header/Footer on/off per halaman
- Mode Source Code (HTML/CSS/JS) dengan two-way sync ke visual tree
- Toolbar Source Code: Copy, Paste, Clear, Format/Beautify, Download `.html`, Upload `.html`
- Toast sonner tiap aksi berhasil/gagal
- Guard admin-only (redirect non-admin)

**Ditunda (fase berikutnya, tidak dibuat sekarang):**
Revision History, Template Library, Import/Export JSON, Auto Save berkala, Layers/Navigator tree, Global Styles editor terpisah.

## Widget yang tersedia

- **Dasar:** Heading, Text, Image, Button, Divider, Spacer
- **Layout:** Section, Columns 2/3/4, Container
- **Media:** Video Embed, Gallery, Icon (lucide)
- **Reusable RS:** JadwalDokter, LayananSection, KontakSection, FaqSection, HeroSlider, MitraSlider, TentangSection, RingkasanSection (dibungkus sebagai "wrapper widget" — props minimal, render komponen existing apa adanya)

## Arsitektur

```text
src/
  routes/
    administrator.test-page-editor.tsx      ← entry route (admin gate + shell)
  components/
    page-editor/
      Editor.tsx                            ← layout 3 kolom (widgets | canvas | props)
      Canvas.tsx                            ← iframe/scaled container + drop zones
      WidgetPanel.tsx                       ← daftar widget draggable
      PropertyPanel.tsx                     ← form props widget terpilih
      DevicePreviewToggle.tsx               ← Desktop/Tablet/Mobile
      Toolbar.tsx                           ← Undo/Redo/Copy/Paste/Duplicate/Save/Publish/Source
      SourceCodeDialog.tsx                  ← editor HTML/CSS/JS + toolbar file
      widgets/
        registry.ts                         ← WidgetDef map (id → render, defaultProps, schema)
        Heading.tsx, Text.tsx, Image.tsx, Button.tsx, Divider.tsx, Spacer.tsx
        Section.tsx, Columns.tsx, Container.tsx
        Video.tsx, Gallery.tsx, IconWidget.tsx
        rs/JadwalDokterWidget.tsx, LayananWidget.tsx, … (thin wrappers)
      hooks/
        useEditorState.ts                   ← tree + selection + history (undo/redo)
        useClipboard.ts
      lib/
        serialize.ts                        ← tree ↔ HTML (dua-arah)
        parseHtml.ts                        ← parser HTML → tree (DOMParser, fallback: raw HTML block)
        beautify.ts                         ← format HTML/CSS/JS (prettier standalone / js-beautify)
        exportToPage.ts                     ← kirim ke custom_pages
```

**State model** (tree JSON):
```ts
type Node = {
  id: string;                    // nanoid
  type: string;                  // widget id
  props: Record<string, unknown>;
  children?: Node[];
};
```

**Two-way sync visual ↔ source:**
- Tree → HTML: `serialize(tree)` menghasilkan HTML semantik + `<style>` untuk CSS custom + `<script>` untuk JS custom.
- HTML → Tree: `parseHtml(html)` mencoba mem-map elemen ke widget registry (`data-widget="heading"` dsb.). Bila tidak dikenali, dibungkus sebagai widget `RawHtml`. Dialog Source Code menampilkan warning bila parse akan menyebabkan fallback RawHtml.

**Draft storage:** `localStorage` key `test-page-editor:draft` (JSON tree + settings). Sandbox murni sampai user menekan Publish/Export.

**Export ke Pages:** Tombol "Kirim ke Pages" membuka dialog input slug + title, lalu insert row baru ke `custom_pages` (tabel sudah ada) berisi HTML hasil `serialize(tree)`; halaman langsung dapat diakses via `/p/$slug` yang sudah ada.

## Guard admin-only

- Route memakai `useAuth()` — jika `role !== 'admin'` tampilkan pesan "Khusus Administrator" dan tombol kembali. Konsisten dengan pola halaman admin lainnya.
- Link di sidebar admin (`administrator.tsx`) hanya render untuk admin.

## Global layout consistency

- Editor shell dibungkus di dalam `<AdministratorLayout>` yang sudah ada (Header admin + sidebar), sama seperti route admin lain.
- Canvas render widget menggunakan token CSS/tema aplikasi (`bg-background`, `text-foreground`, dst.) — tidak ada hardcoded warna. Preview merepresentasikan tampilan asli karena memakai `styles.css` global.
- Preview "publish" nanti otomatis memakai Global `Header` + `Footer` dari `PageLayout` yang sudah dipakai `/p/$slug`, dengan flag `showHeader`/`showFooter` per halaman disimpan di `custom_pages` (kolom baru bila belum ada).

## Dependency baru

- `bun add nanoid` (id widget) — kecil, tanpa efek runtime.
- `bun add js-beautify` untuk format HTML/CSS/JS (bekerja di browser).
- Tidak ada perubahan schema untuk MVP. Jika kolom `show_header`/`show_footer` belum ada di `custom_pages`, tambahkan via migration terpisah saat implementasi (dengan default `true`).

## UX toast (sonner)

Semua aksi berhasil (Save Draft, Publish, Copy, Paste, Duplicate, Format Code, Upload, Download, Clear) memicu `toast.success`. Kegagalan (paste HTML invalid, upload gagal, publish gagal) memicu `toast.error` dengan pesan spesifik.

## Non-goals eksplisit

- Tidak menyentuh menu builder existing / `page_menu_items`.
- Tidak menyentuh `/administrator/pages` — hanya menambah tombol "Buka di Test Page Editor" opsional (bila mudah).
- Tidak mengubah publish flow situs utama.

## Verifikasi

Setelah implementasi: `bun run build`, buka `/administrator/test-page-editor`, drag beberapa widget, cek Undo/Redo, buka Source Code, edit HTML, klik Format, kembali ke Visual, Publish → cek entry di `custom_pages` dan `/p/<slug>` render sesuai.
