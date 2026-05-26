import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, ExternalLink, Pencil, X } from "lucide-react";

export const Route = createFileRoute("/administrator/pages")({
  head: () => ({ meta: [{ title: "Page Builder · Admin" }] }),
  component: PagesAdmin,
});

type Page = {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string;
  is_published: boolean;
  updated_at: string;
};

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

function PagesAdmin() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Page | null>(null);
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
      meta_description: "", is_published: true, updated_at: "",
    });
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
    };
    const res = editing.id
      ? await supabase.from("custom_pages").update(payload).eq("id", editing.id)
      : await supabase.from("custom_pages").insert(payload);
    setSaving(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("Halaman tersimpan");
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Hapus halaman ini?")) return;
    const { error } = await supabase.from("custom_pages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Halaman dihapus");
    load();
  }

  if (editing) {
    return (
      <div className="space-y-4 max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{editing.id ? "Edit Halaman" : "Halaman Baru"}</h1>
          <Button variant="ghost" onClick={() => setEditing(null)}><X className="h-4 w-4 mr-1" />Batal</Button>
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
            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editing.is_published}
                  onCheckedChange={(v) => setEditing({ ...editing, is_published: v })}
                />
                <Label>Publikasikan</Label>
              </div>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Simpan
              </Button>
            </div>
          </CardContent>
        </Card>

        {editing.content && (
          <Card>
            <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
            <CardContent>
              <article
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: editing.content }}
              />
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
          <p className="text-sm text-muted-foreground">Kelola halaman dinamis dengan URL relatif (<code>/p/slug</code>)</p>
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
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{p.title}</span>
                    {!p.is_published && <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Draft</span>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">/p/{p.slug}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="ghost"><ExternalLink className="h-4 w-4" /></Button>
                  </a>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
