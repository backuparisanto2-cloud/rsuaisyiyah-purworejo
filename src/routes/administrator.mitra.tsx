import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import ImageUpload from "@/components/admin/ImageUpload";
import { SortableList, persistOrder } from "@/components/admin/SortableList";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/administrator/mitra")({ component: MitraAdmin });

type Row = { id: string; name: string; logo_url: string; link: string | null; display_order: number; is_active: boolean };
const empty: Omit<Row, "id"> = { name: "", logo_url: "", link: "", display_order: 0, is_active: true };

function MitraAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<(Row | (Omit<Row, "id"> & { id?: string })) | null>(null);

  async function load() {
    const { data } = await supabase.from("partners").select("*").order("display_order");
    setRows((data as Row[]) ?? []);
  }
  useEffect(() => { void load(); }, []);

  async function save() {
    if (!editing) return;
    if (!editing.logo_url) { toast.error("Logo wajib"); return; }
    const p = { name: editing.name, logo_url: editing.logo_url, link: editing.link, display_order: editing.display_order, is_active: editing.is_active };
    const { error } = editing.id
      ? await supabase.from("partners").update(p).eq("id", editing.id)
      : await supabase.from("partners").insert(p);
    if (error) { toast.error(error.message); return; }
    toast.success("Tersimpan"); setEditing(null); void load();
  }
  async function remove(id: string) {
    if (!confirm("Hapus?")) return;
    await supabase.from("partners").delete().eq("id", id); void load();
  }
  async function reorder(next: Row[]) { setRows(next); await persistOrder("partners", next, supabase); void load(); }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mitra</h1>
        <Button onClick={() => setEditing({ ...empty, display_order: rows.length + 1 })} data-tour="mitra-add"><Plus className="h-4 w-4 mr-1" />Tambah</Button>
      </div>
      <SortableList items={rows} onReorder={reorder} renderItem={(r, h) => (
        <Card className="p-3 flex items-center gap-3">
          {h}
          <img src={r.logo_url} alt="" className="h-12 w-20 object-contain bg-muted rounded" />
          <div className="flex-1 min-w-0"><div className="font-semibold truncate">{r.name}</div><div className="text-xs text-muted-foreground truncate">{r.link}</div></div>
          <Switch checked={r.is_active} onCheckedChange={async () => { await supabase.from("partners").update({ is_active: !r.is_active }).eq("id", r.id); void load(); }} />
          <Button size="icon" variant="outline" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
          <Button size="icon" variant="destructive" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
        </Card>
      )} />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "Tambah"} Mitra</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Logo *</Label><ImageUpload value={editing.logo_url} onChange={(url) => setEditing({ ...editing, logo_url: url ?? "" })} folder="partners" /></div>
              <div><Label>Nama</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Link (opsional)</Label><Input value={editing.link ?? ""} onChange={(e) => setEditing({ ...editing, link: e.target.value })} placeholder="https://..." /></div>
              <div className="flex items-center gap-2"><Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /><Label>Aktif</Label></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Batal</Button><Button onClick={save}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
