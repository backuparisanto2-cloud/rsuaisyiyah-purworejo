import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import ImageUpload from "@/components/admin/ImageUpload";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, ExternalLink, Pencil, X, ImagePlus, ArrowUp, ArrowDown, ChevronUp, ChevronDown, CornerDownRight, Menu as MenuIcon } from "lucide-react";

export const Route = createFileRoute("/administrator/pages")({
  head: () => ({ meta: [{ title: "Page Builder · Admin" }] }),
  component: PagesAdmin,
});

type ImgPos = "top" | "left" | "right" | "bottom" | "inline";
type PageImage = { url: string; position: ImgPos; width: number; caption?: string };

type Page = {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string;
  is_published: boolean;
  image_url: string | null;
  image_position: "top" | "left" | "right" | "bottom";
  show_in_menu: boolean;
  menu_href: string | null;
  images: PageImage[];
  updated_at: string;
};

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

async function syncMenuItem(opts: {
  oldHref?: string;
  href: string;
  title: string;
  show: boolean;
  published: boolean;
}) {
  const { oldHref, href, title, show, published } = opts;
  if (oldHref && oldHref !== href) {
    await supabase.from("menu_items").delete().eq("href", oldHref);
  }
  if (show && published) {
    const { data: existing } = await supabase
      .from("menu_items").select("id").eq("href", href).maybeSingle();
    if (existing) {
      await supabase.from("menu_items").update({ label: title, is_active: true }).eq("id", existing.id);
    } else {
      const { data: maxRow } = await supabase
        .from("menu_items").select("display_order").is("parent_id", null)
        .order("display_order", { ascending: false }).limit(1).maybeSingle();
      const nextOrder = (maxRow?.display_order ?? 0) + 1;
      await supabase.from("menu_items").insert({
        label: title, href, display_order: nextOrder, is_active: true,
      });
    }
  } else {
    await supabase.from("menu_items").delete().eq("href", href);
  }
}

type MenuOpt = { href: string; label: string };

function PagesAdmin() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Page | null>(null);
  const [originalHref, setOriginalHref] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [menuOpts, setMenuOpts] = useState<MenuOpt[]>([]);
  const [menuMode, setMenuMode] = useState<"default" | "existing" | "custom">("default");

  async function loadMenuOpts() {
    const { data } = await supabase
      .from("menu_items")
      .select("href,label")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    setMenuOpts(((data ?? []) as MenuOpt[]).filter((m) => m.href && m.href !== "#"));
  }

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("custom_pages").select("*").order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setPages(((data ?? []) as any[]).map((p) => ({
      ...p, images: Array.isArray(p.images) ? p.images : [],
    })) as Page[]);
    setLoading(false);
  }

  useEffect(() => { load(); loadMenuOpts(); }, []);

  function startNew() {
    setEditing({
      id: "", slug: "", title: "", content: "",
      meta_description: "", is_published: true,
      image_url: null, image_position: "top", show_in_menu: true,
      menu_href: null, images: [], updated_at: "",
    });
    setOriginalHref("");
  }

  function startEdit(p: Page) {
    setEditing(p);
    setOriginalHref(p.menu_href || `/p/${p.slug}`);
  }

  function normalizeHref(raw: string | null | undefined, slug: string): string {
    const v = (raw ?? "").trim();
    if (!v) return `/p/${slug}`;
    // keep absolute URLs and in-page anchors as-is
    if (/^https?:\/\//i.test(v) || v.startsWith("#") || v.startsWith("mailto:") || v.startsWith("tel:")) return v;
    return v.startsWith("/") ? v : `/${v}`;
  }

  const finalHref = editing
    ? normalizeHref(editing.menu_href, slugify(editing.slug || editing.title))
    : "";

  async function save() {
    if (!editing) return;
    const slug = slugify(editing.slug || editing.title);
    if (!slug) { toast.error("Slug/judul wajib diisi"); return; }
    if (!editing.title.trim()) { toast.error("Judul wajib diisi"); return; }
    setSaving(true);
    const payload = {
      slug,
      title: editing.title,
      content: editing.content,
      meta_description: editing.meta_description,
      is_published: editing.is_published,
      image_url: editing.image_url,
      image_position: editing.image_position,
      show_in_menu: editing.show_in_menu,
      menu_href: finalHref,
      images: editing.images,
    };
    const res = editing.id
      ? await supabase.from("custom_pages").update(payload).eq("id", editing.id)
      : await supabase.from("custom_pages").insert(payload);
    if (res.error) { setSaving(false); toast.error(res.error.message); return; }
    await syncMenuItem({
      oldHref: originalHref || undefined,
      href: finalHref,
      title: editing.title,
      show: editing.show_in_menu,
      published: editing.is_published,
    });
    setSaving(false);
    toast.success("Halaman tersimpan");
    setEditing(null);
    setOriginalHref("");
    load();
  }

  async function remove(p: Page) {
    if (!confirm("Hapus halaman ini?")) return;
    const { error } = await supabase.from("custom_pages").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    await supabase.from("menu_items").delete().eq("href", p.menu_href || `/p/${p.slug}`);
    toast.success("Halaman dihapus");
    load();
  }

  function updateImage(idx: number, patch: Partial<PageImage>) {
    if (!editing) return;
    const next = [...editing.images];
    next[idx] = { ...next[idx], ...patch };
    setEditing({ ...editing, images: next });
  }
  function addImage(url: string) {
    if (!editing) return;
    setEditing({ ...editing, images: [...editing.images, { url, position: "inline", width: 100 }] });
  }
  function removeImage(idx: number) {
    if (!editing) return;
    setEditing({ ...editing, images: editing.images.filter((_, i) => i !== idx) });
  }
  function moveImage(idx: number, dir: -1 | 1) {
    if (!editing) return;
    const next = [...editing.images];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setEditing({ ...editing, images: next });
  }

  if (editing) {
    return (
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{editing.id ? "Edit Halaman" : "Halaman Baru"}</h1>
            <Button variant="ghost" onClick={() => { setEditing(null); setOriginalHref(""); }}>
              <X className="h-4 w-4 mr-1" />Batal
            </Button>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Konten</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Judul</Label>
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })}
                />
              </div>
              <div>
                <Label>URL Relatif (slug)</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-sm text-muted-foreground">/p/</span>
                  <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>URL Menu (opsional)</Label>
                <Input
                  value={editing.menu_href ?? ""}
                  onChange={(e) => setEditing({ ...editing, menu_href: e.target.value })}
                  placeholder={`/p/${editing.slug || "..."} (default)`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Kosongkan untuk pakai URL halaman. Bisa diisi link eksternal (https://...) atau path lain (mis. <code>/dokter</code>).
                </p>
                <p className="text-xs mt-1">Menu akan menuju: <code>{finalHref}</code></p>
              </div>
              <div>
                <Label>Meta Description (SEO)</Label>
                <Textarea
                  value={editing.meta_description}
                  onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })}
                  rows={2} maxLength={160}
                />
              </div>
              <div>
                <Label>Konten (HTML didukung)</Label>
                <Textarea
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  rows={12} className="font-mono text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={editing.is_published} onCheckedChange={(v) => setEditing({ ...editing, is_published: v })} />
                    <Label>Publikasikan</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={editing.show_in_menu} onCheckedChange={(v) => setEditing({ ...editing, show_in_menu: v })} />
                    <Label>Tampilkan di Menu</Label>
                  </div>
                </div>
                <Button onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Simpan
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Gambar Halaman</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Tambah gambar baru</Label>
                <ImageUpload value={null} onChange={(url) => url && addImage(url)} folder="pages" />
              </div>

              {editing.images.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada gambar. Upload di atas untuk menambah.</p>
              ) : (
                <div className="space-y-3">
                  {editing.images.map((img, idx) => (
                    <div key={idx} className="border rounded-md p-3 flex gap-3">
                      <img src={img.url} alt="" className="h-20 w-20 object-cover rounded shrink-0" />
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Posisi</Label>
                            <Select value={img.position} onValueChange={(v) => updateImage(idx, { position: v as ImgPos })}>
                              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="inline">Inline (dalam konten)</SelectItem>
                                <SelectItem value="top">Atas</SelectItem>
                                <SelectItem value="bottom">Bawah</SelectItem>
                                <SelectItem value="left">Kiri (mengapung)</SelectItem>
                                <SelectItem value="right">Kanan (mengapung)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Lebar: {img.width}%</Label>
                            <Slider value={[img.width]} min={20} max={100} step={5}
                              onValueChange={([v]) => updateImage(idx, { width: v })} className="mt-2" />
                          </div>
                        </div>
                        <Input
                          placeholder="Caption (opsional)"
                          value={img.caption ?? ""}
                          onChange={(e) => updateImage(idx, { caption: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveImage(idx, -1)} disabled={idx === 0}>
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveImage(idx, 1)} disabled={idx === editing.images.length - 1}>
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeImage(idx)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Live Preview</span>
                <span className="text-xs font-normal text-muted-foreground">{finalHref}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 max-h-[80vh] overflow-y-auto bg-background">
                <h1 className="text-2xl font-bold mb-4">{editing.title || "Judul Halaman"}</h1>
                <PagePreview content={editing.content} images={editing.images} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Page Builder</h1>
          <p className="text-sm text-muted-foreground">Kelola halaman dinamis. Halaman yang dipublikasikan otomatis muncul di menu.</p>
        </div>
        <Button onClick={startNew}><Plus className="h-4 w-4 mr-2" />Halaman Baru</Button>
      </div>

      <MenuEditor />


      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : pages.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Belum ada halaman.</CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {pages.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1 flex items-center gap-3">
                  {(p.images[0]?.url || p.image_url) && (
                    <img src={p.images[0]?.url || p.image_url!} alt="" className="h-12 w-12 rounded object-cover shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{p.title}</span>
                      {!p.is_published && <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Draft</span>}
                      {p.show_in_menu && p.is_published && <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">Di Menu</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">/p/{p.slug}{p.menu_href ? ` · menu: ${p.menu_href}` : ""}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="ghost"><ExternalLink className="h-4 w-4" /></Button>
                  </a>
                  <Button size="sm" variant="ghost" onClick={() => startEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function PagePreview({ content, images }: { content: string; images: PageImage[] }) {
  const top = images.filter((i) => i.position === "top");
  const bottom = images.filter((i) => i.position === "bottom");
  const left = images.filter((i) => i.position === "left");
  const right = images.filter((i) => i.position === "right");
  const inline = images.filter((i) => i.position === "inline");

  return (
    <div className="space-y-4">
      {top.map((img, i) => (
        <figure key={`t${i}`} style={{ width: `${img.width}%` }} className="mx-auto">
          <img src={img.url} alt={img.caption ?? ""} className="w-full rounded-lg" />
          {img.caption && <figcaption className="text-xs text-center text-muted-foreground mt-1">{img.caption}</figcaption>}
        </figure>
      ))}
      <div className="prose prose-sm max-w-none dark:prose-invert">
        {left.map((img, i) => (
          <figure key={`l${i}`} className="float-left mr-4 mb-2" style={{ width: `${img.width}%` }}>
            <img src={img.url} alt={img.caption ?? ""} className="w-full rounded" />
            {img.caption && <figcaption className="text-xs text-muted-foreground mt-1">{img.caption}</figcaption>}
          </figure>
        ))}
        {right.map((img, i) => (
          <figure key={`r${i}`} className="float-right ml-4 mb-2" style={{ width: `${img.width}%` }}>
            <img src={img.url} alt={img.caption ?? ""} className="w-full rounded" />
            {img.caption && <figcaption className="text-xs text-muted-foreground mt-1">{img.caption}</figcaption>}
          </figure>
        ))}
        <div dangerouslySetInnerHTML={{ __html: content || "<p class='text-muted-foreground'>Konten akan tampil di sini...</p>" }} />
        <div className="clear-both" />
        {inline.length > 0 && (
          <div className="not-prose space-y-4 mt-4">
            {inline.map((img, i) => (
              <figure key={`i${i}`} style={{ width: `${img.width}%` }} className="mx-auto">
                <img src={img.url} alt={img.caption ?? ""} className="w-full rounded-lg" />
                {img.caption && <figcaption className="text-xs text-center text-muted-foreground mt-1">{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </div>
      {bottom.map((img, i) => (
        <figure key={`b${i}`} style={{ width: `${img.width}%` }} className="mx-auto">
          <img src={img.url} alt={img.caption ?? ""} className="w-full rounded-lg" />
          {img.caption && <figcaption className="text-xs text-center text-muted-foreground mt-1">{img.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}

type MenuItem = {
  id: string;
  label: string;
  href: string;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
};

function MenuEditor() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("menu_items").select("*").order("display_order");
    if (error) toast.error(error.message);
    setItems((data ?? []) as MenuItem[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const roots = items.filter((i) => !i.parent_id).sort((a, b) => a.display_order - b.display_order);
  const childrenOf = (pid: string) =>
    items.filter((i) => i.parent_id === pid).sort((a, b) => a.display_order - b.display_order);

  async function addItem(parent_id: string | null) {
    const siblings = parent_id ? childrenOf(parent_id) : roots;
    const nextOrder = (siblings.at(-1)?.display_order ?? 0) + 1;
    const { error } = await supabase.from("menu_items").insert({
      label: "Menu Baru", href: "#", parent_id, display_order: nextOrder,
    });
    if (error) return toast.error(error.message);
    load();
  }

  async function updateItem(id: string, patch: Partial<MenuItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    const { error } = await supabase.from("menu_items").update(patch).eq("id", id);
    if (error) { toast.error(error.message); load(); }
  }

  async function removeItem(id: string) {
    if (!confirm("Hapus item menu ini? Submenu di bawahnya juga akan terhapus.")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Item menu dihapus");
    load();
  }

  async function move(item: MenuItem, dir: -1 | 1) {
    const siblings = item.parent_id ? childrenOf(item.parent_id) : roots;
    const idx = siblings.findIndex((s) => s.id === item.id);
    const swap = siblings[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("menu_items").update({ display_order: swap.display_order }).eq("id", item.id),
      supabase.from("menu_items").update({ display_order: item.display_order }).eq("id", swap.id),
    ]);
    load();
  }

  function Row({ item, depth }: { item: MenuItem; depth: number }) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 border rounded-md bg-card" style={{ marginLeft: depth * 20 }}>
          {depth > 0 && <CornerDownRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          <div className="flex flex-col gap-0.5 shrink-0">
            <button onClick={() => move(item, -1)} className="hover:text-primary"><ChevronUp className="h-3 w-3" /></button>
            <button onClick={() => move(item, 1)} className="hover:text-primary"><ChevronDown className="h-3 w-3" /></button>
          </div>
          <Input
            value={item.label}
            onChange={(e) => setItems((p) => p.map((x) => x.id === item.id ? { ...x, label: e.target.value } : x))}
            onBlur={() => updateItem(item.id, { label: item.label })}
            placeholder="Label"
            className="flex-1 min-w-0 h-8"
          />
          <Input
            value={item.href}
            onChange={(e) => setItems((p) => p.map((x) => x.id === item.id ? { ...x, href: e.target.value } : x))}
            onBlur={() => updateItem(item.id, { href: item.href })}
            placeholder="#anchor, /p/slug, atau https://..."
            className="flex-1 min-w-0 font-mono text-xs h-8"
          />
          <Switch checked={item.is_active} onCheckedChange={(v) => updateItem(item.id, { is_active: v })} />
          {depth === 0 && (
            <Button size="sm" variant="outline" className="h-8" onClick={() => addItem(item.id)} title="Tambah submenu">
              <Plus className="h-3 w-3" />
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-8" onClick={() => removeItem(item.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
        {childrenOf(item.id).map((c) => <Row key={c.id} item={c} depth={depth + 1} />)}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setOpen((v) => !v)}>
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2"><MenuIcon className="h-4 w-4" /> Menu Navigasi Header</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-normal text-muted-foreground">{items.length} item</span>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Edit label dan link tiap menu. Gunakan <code>#anchor</code> untuk section, <code>/p/slug</code> untuk halaman custom, atau <code>https://...</code> untuk link eksternal.
          </p>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : roots.length === 0 ? (
            <p className="text-center py-6 text-sm text-muted-foreground">Belum ada menu.</p>
          ) : (
            <div className="space-y-2">{roots.map((r) => <Row key={r.id} item={r} depth={0} />)}</div>
          )}
          <Button size="sm" onClick={() => addItem(null)}><Plus className="h-3 w-3 mr-1" />Tambah Menu Utama</Button>
        </CardContent>
      )}
    </Card>
  );
}
