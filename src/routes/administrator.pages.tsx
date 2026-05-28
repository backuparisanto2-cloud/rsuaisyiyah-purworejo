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
import ImageUpload from "@/components/admin/ImageUpload";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, ExternalLink, Pencil, X } from "lucide-react";

export const Route = createFileRoute("/administrator/pages")({
  head: () => ({ meta: [{ title: "Page Builder · Admin" }] }),
  component: PagesAdmin,
});

type ImagePos = "top" | "left" | "right" | "bottom";

type Page = {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string;
  is_published: boolean;
  image_url: string | null;
  image_position: ImagePos;
  show_in_menu: boolean;
  updated_at: string;
};

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

async function syncMenuItem(opts: {
  oldSlug?: string;
  slug: string;
  title: string;
  show: boolean;
  published: boolean;
}) {
  const { oldSlug, slug, title, show, published } = opts;
  // remove old href if slug changed
  if (oldSlug && oldSlug !== slug) {
    await supabase.from("menu_items").delete().eq("href", `/p/${oldSlug}`);
  }
  const href = `/p/${slug}`;
  if (show && published) {
    const { data: existing } = await supabase
      .from("menu_items")
      .select("id")
      .eq("href", href)
      .maybeSingle();
    if (existing) {
      await supabase.from("menu_items").update({ label: title, is_active: true }).eq("id", existing.id);
    } else {
      const { data: maxRow } = await supabase
        .from("menu_items")
        .select("display_order")
        .is("parent_id", null)
        .order("display_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextOrder = (maxRow?.display_order ?? 0) + 1;
      await supabase.from("menu_items").insert({
        label: title, href, display_order: nextOrder, is_active: true,
      });
    }
  } else {
    await supabase.from("menu_items").delete().eq("href", href);
  }
}

function PagesAdmin() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Page | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("custom_pages")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setPages((data ?? []) as Page[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startNew() {
    setEditing({
      id: "", slug: "", title: "", content: "",
      meta_description: "", is_published: true,
      image_url: null, image_position: "top", show_in_menu: true,
      updated_at: "",
    });
    setOriginalSlug("");
  }

  function startEdit(p: Page) {
    setEditing(p);
    setOriginalSlug(p.slug);
  }

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
    };
    const res = editing.id
      ? await supabase.from("custom_pages").update(payload).eq("id", editing.id)
      : await supabase.from("custom_pages").insert(payload);
    if (res.error) { setSaving(false); toast.error(res.error.message); return; }
    await syncMenuItem({
      oldSlug: originalSlug || undefined,
      slug,
      title: editing.title,
      show: editing.show_in_menu,
      published: editing.is_published,
    });
    setSaving(false);
    toast.success("Halaman tersimpan");
    setEditing(null);
    setOriginalSlug("");
    load();
  }

  async function remove(p: Page) {
    if (!confirm("Hapus halaman ini?")) return;
    const { error } = await supabase.from("custom_pages").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    await supabase.from("menu_items").delete().eq("href", `/p/${p.slug}`);
    toast.success("Halaman dihapus");
    load();
  }

  if (editing) {
    const pos = editing.image_position;
    const imgFlex = pos === "left" ? "flex-row" : pos === "right" ? "flex-row-reverse" : pos === "bottom" ? "flex-col-reverse" : "flex-col";
    return (
      <div className="space-y-4 max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{editing.id ? "Edit Halaman" : "Halaman Baru"}</h1>
          <Button variant="ghost" onClick={() => { setEditing(null); setOriginalSlug(""); }}><X className="h-4 w-4 mr-1" />Batal</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Konten</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Judul</Label>
              <Input
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })}
                placeholder="Tentang Kami"
              />
            </div>
            <div>
              <Label>URL Relatif (slug)</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-sm text-muted-foreground">/p/</span>
                <Input
                  value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                  placeholder="tentang-kami"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">URL final: <code>/p/{editing.slug || "..."}</code></p>
            </div>

            <div className="grid sm:grid-cols-[1fr_220px] gap-4">
              <div>
                <Label>Gambar Halaman (opsional)</Label>
                <div className="mt-1.5">
                  <ImageUpload
                    value={editing.image_url}
                    onChange={(url) => setEditing({ ...editing, image_url: url })}
                    folder="pages"
                  />
                </div>
              </div>
              <div>
                <Label>Posisi Gambar</Label>
                <Select
                  value={editing.image_position}
                  onValueChange={(v) => setEditing({ ...editing, image_position: v as ImagePos })}
                >
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Atas</SelectItem>
                    <SelectItem value="bottom">Bawah</SelectItem>
                    <SelectItem value="left">Kiri</SelectItem>
                    <SelectItem value="right">Kanan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Meta Description (SEO)</Label>
              <Textarea
                value={editing.meta_description}
                onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })}
                rows={2}
                maxLength={160}
                placeholder="Deskripsi singkat untuk mesin pencari (maks 160 karakter)"
              />
            </div>
            <div>
              <Label>Konten (HTML didukung)</Label>
              <Textarea
                value={editing.content}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                rows={16}
                className="font-mono text-sm"
                placeholder={'<h2>Sub Judul</h2>\n<p>Paragraf konten...</p>'}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editing.is_published}
                    onCheckedChange={(v) => setEditing({ ...editing, is_published: v })}
                  />
                  <Label>Publikasikan</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editing.show_in_menu}
                    onCheckedChange={(v) => setEditing({ ...editing, show_in_menu: v })}
                  />
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

        {(editing.content || editing.image_url) && (
          <Card>
            <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
            <CardContent>
              <div className={`flex gap-6 ${imgFlex} ${pos === "left" || pos === "right" ? "items-start" : ""}`}>
                {editing.image_url && (
                  <img
                    src={editing.image_url}
                    alt={editing.title}
                    className={`rounded-lg object-cover ${pos === "left" || pos === "right" ? "w-1/3" : "w-full max-h-96"}`}
                  />
                )}
                <article
                  className="prose prose-sm max-w-none dark:prose-invert flex-1"
                  dangerouslySetInnerHTML={{ __html: editing.content }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Page Builder</h1>
          <p className="text-sm text-muted-foreground">Kelola halaman dinamis dengan URL relatif (<code>/p/slug</code>). Halaman yang dipublikasikan otomatis muncul di menu navigasi.</p>
        </div>
        <Button onClick={startNew}><Plus className="h-4 w-4 mr-2" />Halaman Baru</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : pages.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Belum ada halaman. Klik "Halaman Baru" untuk mulai.</CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {pages.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1 flex items-center gap-3">
                  {p.image_url && <img src={p.image_url} alt="" className="h-12 w-12 rounded object-cover shrink-0" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{p.title}</span>
                      {!p.is_published && <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Draft</span>}
                      {p.show_in_menu && p.is_published && <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">Di Menu</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">/p/{p.slug}</div>
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
