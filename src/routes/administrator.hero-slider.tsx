import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import ImageUpload from "@/components/admin/ImageUpload";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";

export const Route = createFileRoute("/administrator/hero-slider")({
  component: HeroSliderAdmin,
});

type Slide = {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  cta_text: string | null;
  cta_link: string | null;
  display_order: number;
  is_active: boolean;
};

const empty: Omit<Slide, "id"> = {
  image_url: "",
  title: "",
  subtitle: "",
  cta_text: "",
  cta_link: "",
  display_order: 0,
  is_active: true,
};

function HeroSliderAdmin() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(Slide | (Omit<Slide, "id"> & { id?: string })) | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("hero_slides")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) toast.error(error.message);
    setSlides((data as Slide[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function save() {
    if (!editing) return;
    if (!editing.image_url) { toast.error("Gambar wajib diupload"); return; }
    const payload = {
      image_url: editing.image_url,
      title: editing.title,
      subtitle: editing.subtitle,
      cta_text: editing.cta_text,
      cta_link: editing.cta_link,
      display_order: editing.display_order,
      is_active: editing.is_active,
    };
    const { error } = editing.id
      ? await supabase.from("hero_slides").update(payload).eq("id", editing.id)
      : await supabase.from("hero_slides").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Tersimpan");
    setEditing(null);
    void load();
  }

  async function remove(id: string) {
    if (!confirm("Hapus slide ini?")) return;
    const { error } = await supabase.from("hero_slides").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Terhapus");
    void load();
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = slides.findIndex((s) => s.id === id);
    const swap = slides[idx + dir];
    if (!swap) return;
    const a = slides[idx];
    await Promise.all([
      supabase.from("hero_slides").update({ display_order: swap.display_order }).eq("id", a.id),
      supabase.from("hero_slides").update({ display_order: a.display_order }).eq("id", swap.id),
    ]);
    void load();
  }

  async function toggleActive(s: Slide) {
    await supabase.from("hero_slides").update({ is_active: !s.is_active }).eq("id", s.id);
    void load();
  }

  const canAdd = slides.length < 5;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hero Slider</h1>
          <p className="text-sm text-muted-foreground">{slides.length}/5 slide</p>
        </div>
        <Button disabled={!canAdd} onClick={() => setEditing({ ...empty, display_order: slides.length })}>
          <Plus className="h-4 w-4 mr-1" /> Tambah Slide
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Memuat...</p>
      ) : slides.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">Belum ada slide. Tambahkan slide pertama Anda.</Card>
      ) : (
        <div className="grid gap-3">
          {slides.map((s, i) => (
            <Card key={s.id} className="p-3 flex gap-3 items-center">
              <img src={s.image_url} alt="" className="w-32 h-20 object-cover rounded border" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{s.title || <span className="text-muted-foreground italic">Tanpa judul</span>}</div>
                <div className="text-sm text-muted-foreground truncate">{s.subtitle}</div>
                <div className="text-xs text-muted-foreground mt-1">Urutan: {s.display_order}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => move(s.id, -1)}><ArrowUp className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" disabled={i === slides.length - 1} onClick={() => move(s.id, 1)}><ArrowDown className="h-4 w-4" /></Button>
                </div>
                <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} />
                <Button size="icon" variant="outline" onClick={() => setEditing(s)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="destructive" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit Slide" : "Tambah Slide"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Gambar *</Label>
                <ImageUpload
                  value={editing.image_url}
                  onChange={(url) => setEditing({ ...editing, image_url: url ?? "" })}
                  folder="hero"
                />
              </div>
              <div>
                <Label>Judul</Label>
                <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <Label>Subjudul</Label>
                <Textarea rows={2} value={editing.subtitle ?? ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Teks CTA</Label>
                  <Input value={editing.cta_text ?? ""} onChange={(e) => setEditing({ ...editing, cta_text: e.target.value })} />
                </div>
                <div>
                  <Label>Link CTA</Label>
                  <Input value={editing.cta_link ?? ""} onChange={(e) => setEditing({ ...editing, cta_link: e.target.value })} placeholder="/atau https://..." />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                <Label>Aktif</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Batal</Button>
            <Button onClick={save}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
