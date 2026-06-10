import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageUpload from "@/components/admin/ImageUpload";
import { SortableList, persistOrder } from "@/components/admin/SortableList";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, Pencil, X, ImagePlus, Eye, Undo } from "lucide-react";
import { BlockItem, CardGrid, type RingkasanRow } from "@/components/RingkasanSection";

type SourceType = "custom_page" | "manual";
type ImgPos = "left" | "right" | "top" | "none";
type LayoutType = "block" | "card";

type Row = RingkasanRow;

type PageOpt = { id: string; title: string; slug: string; meta_description: string };

const blank = (): Row => ({
  id: "", source_type: "manual", custom_page_id: null,
  title: "", summary: "", image_url: null, image_position: "right",
  cta_label: "Selengkapnya", cta_href: "", layout: "block",
  display_order: 0, is_active: true,
});

/** Render satu item ringkasan dalam mode preview (tidak dipakai untuk publik). */
function ItemPreview({ row }: { row: Row }) {
  const safe: Row = {
    ...row,
    title: row.title || "Judul Ringkasan",
    summary: row.summary || "Pratinjau ringkasan akan muncul di sini saat Anda mengetik.",
    cta_label: row.cta_label || "Selengkapnya",
  };
  if (safe.layout === "card") return <CardGrid rows={[safe]} />;
  return <BlockItem row={safe} index={0} />;
}

export default function SummaryAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [pages, setPages] = useState<PageOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [original, setOriginal] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const quickUploadRef = useRef<HTMLInputElement>(null);
  const [quickTarget, setQuickTarget] = useState<Row | null>(null);

  async function load() {
    setLoading(true);
    const [r1, r2] = await Promise.all([
      supabase.from("home_summary_sections").select("*").order("display_order"),
      supabase.from("custom_pages").select("id,title,slug,meta_description").order("title"),
    ]);
    if (r1.error) toast.error(r1.error.message);
    setRows((r1.data ?? []) as Row[]);
    setPages((r2.data ?? []) as PageOpt[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function toggleActive(r: Row) {
    const { error } = await supabase.from("home_summary_sections").update({ is_active: !r.is_active }).eq("id", r.id);
    if (error) toast.error(error.message); else void load();
  }

  async function remove(r: Row) {
    if (!confirm("Hapus item ringkasan ini?")) return;
    const { error } = await supabase.from("home_summary_sections").delete().eq("id", r.id);
    if (error) toast.error(error.message);
    else { toast.success("Item dihapus"); void load(); }
  }

  async function reorder(next: Row[]) {
    setRows(next);
    await persistOrder("home_summary_sections", next, supabase);
    void load();
  }

  function openEditor(r: Row) {
    setOriginal({ ...r });
    setEditing({ ...r });
  }
  function openNew() {
    const b = blank();
    setOriginal(b);
    setEditing(b);
  }
  function undoChanges() {
    if (!original) return;
    setEditing({ ...original });
    toast.info("Perubahan dikembalikan");
  }
  function pickPage(pageId: string) {
    if (!editing) return;
    const p = pages.find((x) => x.id === pageId);
    if (!p) return;
    setEditing({
      ...editing,
      source_type: "custom_page",
      custom_page_id: p.id,
      title: editing.title || p.title,
      summary: editing.summary || p.meta_description || "",
      cta_href: editing.cta_href || `/p/${p.slug}`,
    });
  }

  async function save() {
    if (!editing) return;
    if (!editing.title.trim()) { toast.error("Judul wajib diisi"); return; }
    setSaving(true);
    const nextOrder = editing.id
      ? editing.display_order
      : (rows.reduce((m, r) => Math.max(m, r.display_order), 0) + 1);
    const payload = {
      source_type: editing.source_type,
      custom_page_id: editing.source_type === "custom_page" ? editing.custom_page_id : null,
      title: editing.title,
      summary: editing.summary,
      image_url: editing.image_position === "none" ? null : editing.image_url,
      image_position: editing.image_position,
      cta_label: editing.cta_label,
      cta_href: editing.cta_href,
      layout: editing.layout,
      display_order: nextOrder,
      is_active: editing.is_active,
    };
    const res = editing.id
      ? await supabase.from("home_summary_sections").update(payload).eq("id", editing.id)
      : await supabase.from("home_summary_sections").insert(payload);
    setSaving(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Tersimpan");
    setEditing(null);
    void load();
  }

  // Quick image swap from list (upload langsung ke bucket media, lalu update row)
  function openQuickUpload(r: Row) {
    setQuickTarget(r);
    quickUploadRef.current?.click();
  }

  async function handleQuickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !quickTarget) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowed.includes(file.type)) return toast.error("Tipe file tidak didukung");
    if (file.size > 5 * 1024 * 1024) return toast.error("Ukuran maksimal 5 MB");
    const path = `ringkasan/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const up = await supabase.storage.from("media").upload(path, file, { upsert: false });
    if (up.error) return toast.error(up.error.message);
    const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
    const newPos = quickTarget.image_position === "none" ? "right" : quickTarget.image_position;
    const { error } = await supabase
      .from("home_summary_sections")
      .update({ image_url: pub.publicUrl, image_position: newPos })
      .eq("id", quickTarget.id);
    if (error) return toast.error(error.message);
    toast.success("Gambar diperbarui");
    setQuickTarget(null);
    void load();
  }

  async function clearImage(r: Row) {
    if (!confirm("Hapus gambar pada item ini?")) return;
    const { error } = await supabase
      .from("home_summary_sections")
      .update({ image_url: null, image_position: "none" })
      .eq("id", r.id);
    if (error) toast.error(error.message);
    else { toast.success("Gambar dihapus"); void load(); }
  }

  if (editing) {
    const isCp = editing.source_type === "custom_page";
    return (
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
        {/* Form */}
        <div className="space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{editing.id ? "Edit Ringkasan" : "Ringkasan Baru"}</h2>
            <Button variant="ghost" onClick={() => setEditing(null)}><X className="h-4 w-4 mr-1" />Batal</Button>
          </div>

          <Card><CardContent className="pt-6 space-y-4">
            <div>
              <Label>Sumber Konten</Label>
              <Select value={editing.source_type} onValueChange={(v: SourceType) =>
                setEditing({ ...editing, source_type: v, custom_page_id: v === "manual" ? null : editing.custom_page_id })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual (isi sendiri)</SelectItem>
                  <SelectItem value="custom_page">Dari Halaman Page Builder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isCp && (
              <div>
                <Label>Pilih Halaman</Label>
                <Select value={editing.custom_page_id ?? ""} onValueChange={pickPage}>
                  <SelectTrigger><SelectValue placeholder="— pilih halaman —" /></SelectTrigger>
                  <SelectContent>
                    {pages.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Judul, ringkasan, dan link tombol bisa di-override di bawah.</p>
              </div>
            )}

            <div>
              <Label>Judul</Label>
              <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </div>

            <div>
              <Label>Ringkasan</Label>
              <Textarea rows={4} value={editing.summary} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Layout</Label>
                <Select value={editing.layout} onValueChange={(v: LayoutType) => setEditing({ ...editing, layout: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block">Blok besar (full-width)</SelectItem>
                    <SelectItem value="card">Kartu (grid)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Posisi Gambar</Label>
                <Select value={editing.image_position} onValueChange={(v: ImgPos) => setEditing({ ...editing, image_position: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa gambar</SelectItem>
                    <SelectItem value="left">Kiri</SelectItem>
                    <SelectItem value="right">Kanan</SelectItem>
                    <SelectItem value="top">Atas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editing.image_position !== "none" && (
              <div>
                <Label>Gambar</Label>
                <ImageUpload
                  value={editing.image_url}
                  onChange={(url) => setEditing({ ...editing, image_url: url })}
                  folder="ringkasan"
                />
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Label Tombol</Label>
                <Input value={editing.cta_label} onChange={(e) => setEditing({ ...editing, cta_label: e.target.value })} />
              </div>
              <div>
                <Label>Link Tombol</Label>
                <Input placeholder="/p/profil atau https://…" value={editing.cta_href}
                  onChange={(e) => setEditing({ ...editing, cta_href: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
              <Label>Aktif</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={undoChanges}>
                <Undo className="h-4 w-4 mr-2" />Batalkan Perubahan
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Simpan
              </Button>
            </div>
          </CardContent></Card>
        </div>

        {/* Live preview */}
        <div className="min-w-0">
          <div className="lg:sticky lg:top-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" /> Pratinjau langsung
            </div>
            <div className="rounded-xl border border-border bg-background overflow-hidden">
              <div className="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b border-border">
                Tampilan di beranda
              </div>
              <div className="overflow-x-auto">
                <div className="origin-top-left scale-[0.85] lg:scale-90 -mb-12">
                  <ItemPreview row={editing} />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Pratinjau diperbarui real-time. Tata letak final mengikuti lebar layar pengunjung.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <input
        ref={quickUploadRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={handleQuickFile}
      />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Ringkasan Beranda</h2>
          <p className="text-sm text-muted-foreground">
            Tampil di beranda pada posisi section "Ringkasan Beranda" (atur urutannya di menu <span className="font-mono">Sections</span>).
          </p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Tambah</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Belum ada item ringkasan.</CardContent></Card>
      ) : (
        <SortableList items={rows} onReorder={reorder} renderItem={(r, h) => (
          <Card>
            <CardContent className="py-3 flex items-center gap-3">
              {h}
              {r.image_url && r.image_position !== "none" ? (
                <img src={r.image_url} alt="" className="h-12 w-12 rounded object-cover shrink-0" />
              ) : (
                <div className="h-12 w-12 rounded bg-muted shrink-0 flex items-center justify-center text-[10px] text-muted-foreground">No img</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold truncate">{r.title || "(tanpa judul)"}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{r.layout === "card" ? "Kartu" : "Blok"}</span>
                  {r.source_type === "custom_page" && (
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">Page</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">{r.summary || "—"}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r)} />
                <Button size="sm" variant="ghost" title="Ganti gambar" onClick={() => openQuickUpload(r)}>
                  <ImagePlus className="h-4 w-4" />
                </Button>
                {r.image_url && (
                  <Button size="sm" variant="ghost" title="Hapus gambar" onClick={() => clearImage(r)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => openEditor(r)}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        )} />
      )}
    </div>
  );
}
