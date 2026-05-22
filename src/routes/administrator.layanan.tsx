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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SortableList, persistOrder } from "@/components/admin/SortableList";
import { SERVICE_ICON_NAMES, ServiceIcon } from "@/lib/service-icons";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/administrator/layanan")({ component: LayananAdmin });

type Row = { id: string; title: string; icon: string; content: string; display_order: number; is_active: boolean };
const empty: Omit<Row, "id"> = { title: "", icon: "Stethoscope", content: "", display_order: 0, is_active: true };

function LayananAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<(Row | (Omit<Row, "id"> & { id?: string })) | null>(null);

  async function load() {
    const { data } = await supabase.from("services").select("*").order("display_order");
    setRows((data as Row[]) ?? []);
  }
  useEffect(() => { void load(); }, []);

  async function save() {
    if (!editing) return;
    const p = { title: editing.title, icon: editing.icon, content: editing.content, display_order: editing.display_order, is_active: editing.is_active };
    const { error } = editing.id
      ? await supabase.from("services").update(p).eq("id", editing.id)
      : await supabase.from("services").insert(p);
    if (error) { toast.error(error.message); return; }
    toast.success("Tersimpan"); setEditing(null); void load();
  }
  async function remove(id: string) {
    if (!confirm("Hapus?")) return;
    await supabase.from("services").delete().eq("id", id); void load();
  }
  async function reorder(next: Row[]) { setRows(next); await persistOrder("services", next, supabase); void load(); }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Layanan</h1>
        <Button onClick={() => setEditing({ ...empty, display_order: rows.length + 1 })}><Plus className="h-4 w-4 mr-1" />Tambah</Button>
      </div>
      <SortableList items={rows} onReorder={reorder} renderItem={(r, h) => (
        <Card className="p-3 flex items-center gap-3">
          {h}
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><ServiceIcon name={r.icon} className="h-5 w-5" /></div>
          <div className="flex-1 min-w-0"><div className="font-semibold truncate">{r.title}</div><div className="text-xs text-muted-foreground line-clamp-1">{r.content}</div></div>
          <Switch checked={r.is_active} onCheckedChange={async () => { await supabase.from("services").update({ is_active: !r.is_active }).eq("id", r.id); void load(); }} />
          <Button size="icon" variant="outline" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
          <Button size="icon" variant="destructive" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
        </Card>
      )} />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "Tambah"} Layanan</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Judul</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div>
                <Label>Ikon</Label>
                <Select value={editing.icon} onValueChange={(v) => setEditing({ ...editing, icon: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_ICON_NAMES.map((n) => (
                      <SelectItem key={n} value={n}>
                        <span className="flex items-center gap-2"><ServiceIcon name={n} className="h-4 w-4" />{n}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Isi</Label><Textarea rows={5} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /><Label>Aktif</Label></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Batal</Button><Button onClick={save}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
