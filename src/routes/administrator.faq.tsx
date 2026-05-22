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
import { SortableList, persistOrder } from "@/components/admin/SortableList";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/administrator/faq")({ component: FaqAdmin });

type Row = { id: string; question: string; answer: string; display_order: number; is_active: boolean };
const empty: Omit<Row, "id"> = { question: "", answer: "", display_order: 0, is_active: true };

function FaqAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<(Row | (Omit<Row, "id"> & { id?: string })) | null>(null);

  async function load() {
    const { data } = await supabase.from("faqs").select("*").order("display_order");
    setRows((data as Row[]) ?? []);
  }
  useEffect(() => { void load(); }, []);

  async function save() {
    if (!editing) return;
    const p = { question: editing.question, answer: editing.answer, display_order: editing.display_order, is_active: editing.is_active };
    const { error } = editing.id
      ? await supabase.from("faqs").update(p).eq("id", editing.id)
      : await supabase.from("faqs").insert(p);
    if (error) { toast.error(error.message); return; }
    toast.success("Tersimpan"); setEditing(null); void load();
  }
  async function remove(id: string) {
    if (!confirm("Hapus?")) return;
    await supabase.from("faqs").delete().eq("id", id); void load();
  }
  async function reorder(next: Row[]) { setRows(next); await persistOrder("faqs", next, supabase); void load(); }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">FAQ</h1>
        <Button onClick={() => setEditing({ ...empty, display_order: rows.length + 1 })}><Plus className="h-4 w-4 mr-1" />Tambah</Button>
      </div>
      <SortableList items={rows} onReorder={reorder} renderItem={(r, h) => (
        <Card className="p-3 flex items-center gap-3">
          {h}
          <div className="flex-1 min-w-0"><div className="font-semibold truncate">{r.question}</div><div className="text-sm text-muted-foreground line-clamp-1">{r.answer}</div></div>
          <Switch checked={r.is_active} onCheckedChange={async () => { await supabase.from("faqs").update({ is_active: !r.is_active }).eq("id", r.id); void load(); }} />
          <Button size="icon" variant="outline" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
          <Button size="icon" variant="destructive" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
        </Card>
      )} />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "Tambah"} FAQ</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Pertanyaan</Label><Input value={editing.question} onChange={(e) => setEditing({ ...editing, question: e.target.value })} /></div>
              <div><Label>Jawaban</Label><Textarea rows={4} value={editing.answer} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /><Label>Aktif</Label></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Batal</Button><Button onClick={save}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
