import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageUpload from "@/components/admin/ImageUpload";
import { SortableList, persistOrder } from "@/components/admin/SortableList";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CalendarDays, Sparkles } from "lucide-react";
import ScheduleImportDialog from "@/components/admin/ScheduleImportDialog";

export const Route = createFileRoute("/administrator/dokter")({ component: DokterAdmin });

type Doctor = { id: string; name: string; specialty: string; photo_url: string | null; display_order: number; is_active: boolean };
type Schedule = { id: string; doctor_id: string; day_of_week: number; time_start: string; time_end: string; poli: string };

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const emptyDoctor: Omit<Doctor, "id"> = { name: "", specialty: "", photo_url: null, display_order: 0, is_active: true };

function DokterAdmin() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [editing, setEditing] = useState<(Doctor | (Omit<Doctor, "id"> & { id?: string })) | null>(null);
  const [scheduleFor, setScheduleFor] = useState<Doctor | null>(null);
  const [multiImport, setMultiImport] = useState(false);
  const [editing, setEditing] = useState<(Doctor | (Omit<Doctor, "id"> & { id?: string })) | null>(null);
  const [scheduleFor, setScheduleFor] = useState<Doctor | null>(null);

  async function load() {
    const { data } = await supabase.from("doctors").select("*").order("display_order");
    setDoctors((data as Doctor[]) ?? []);
  }
  useEffect(() => { void load(); }, []);

  async function save() {
    if (!editing) return;
    const p = { name: editing.name, specialty: editing.specialty, photo_url: editing.photo_url, display_order: editing.display_order, is_active: editing.is_active };
    const { error } = editing.id
      ? await supabase.from("doctors").update(p).eq("id", editing.id)
      : await supabase.from("doctors").insert(p);
    if (error) { toast.error(error.message); return; }
    toast.success("Tersimpan"); setEditing(null); void load();
  }
  async function remove(id: string) {
    if (!confirm("Hapus dokter dan semua jadwalnya?")) return;
    await supabase.from("doctors").delete().eq("id", id); void load();
  }
  async function reorder(next: Doctor[]) { setDoctors(next); await persistOrder("doctors", next, supabase); void load(); }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Jadwal Dokter</h1>
        <Button onClick={() => setEditing({ ...emptyDoctor, display_order: doctors.length + 1 })}><Plus className="h-4 w-4 mr-1" />Tambah Dokter</Button>
      </div>
      <SortableList items={doctors} onReorder={reorder} renderItem={(d, h) => (
        <Card className="p-3 flex items-center gap-3">
          {h}
          {d.photo_url ? <img src={d.photo_url} alt="" className="h-12 w-12 object-cover object-top rounded-full" /> : <div className="h-12 w-12 rounded-full bg-muted" />}
          <div className="flex-1 min-w-0"><div className="font-semibold truncate">{d.name}</div><div className="text-xs text-muted-foreground">{d.specialty}</div></div>
          <Button size="sm" variant="outline" onClick={() => setScheduleFor(d)}><CalendarDays className="h-4 w-4 mr-1" />Jadwal</Button>
          <Switch checked={d.is_active} onCheckedChange={async () => { await supabase.from("doctors").update({ is_active: !d.is_active }).eq("id", d.id); void load(); }} />
          <Button size="icon" variant="outline" onClick={() => setEditing(d)}><Pencil className="h-4 w-4" /></Button>
          <Button size="icon" variant="destructive" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4" /></Button>
        </Card>
      )} />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "Tambah"} Dokter</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Foto</Label><ImageUpload value={editing.photo_url} onChange={(url) => setEditing({ ...editing, photo_url: url })} folder="doctors" /></div>
              <div><Label>Nama</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="dr. ..." /></div>
              <div><Label>Spesialis</Label><Input value={editing.specialty} onChange={(e) => setEditing({ ...editing, specialty: e.target.value })} placeholder="SPESIALIS ANAK" /></div>
              <div className="flex items-center gap-2"><Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /><Label>Aktif</Label></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Batal</Button><Button onClick={save}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {scheduleFor && <SchedulePanel doctor={scheduleFor} onClose={() => setScheduleFor(null)} />}
    </div>
  );
}

function SchedulePanel({ doctor, onClose }: { doctor: Doctor; onClose: () => void }) {
  const [items, setItems] = useState<Schedule[]>([]);
  const [draft, setDraft] = useState<Omit<Schedule, "id" | "doctor_id">>({ day_of_week: 1, time_start: "08:00", time_end: "12:00", poli: "" });

  async function load() {
    const { data } = await supabase.from("doctor_schedules").select("*").eq("doctor_id", doctor.id).order("day_of_week");
    setItems((data as Schedule[]) ?? []);
  }
  useEffect(() => { void load(); }, [doctor.id]);

  async function add() {
    const { error } = await supabase.from("doctor_schedules").insert({ doctor_id: doctor.id, ...draft });
    if (error) { toast.error(error.message); return; }
    setDraft({ day_of_week: 1, time_start: "08:00", time_end: "12:00", poli: "" });
    void load();
  }
  async function del(id: string) { await supabase.from("doctor_schedules").delete().eq("id", id); void load(); }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Jadwal — {doctor.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            {items.length === 0 && <p className="text-sm text-muted-foreground">Belum ada jadwal.</p>}
            {items.map((s) => (
              <Card key={s.id} className="p-2 flex items-center gap-3 text-sm">
                <span className="font-semibold w-20">{DAYS[s.day_of_week]}</span>
                <span>{s.time_start} – {s.time_end}</span>
                <span className="text-muted-foreground flex-1">{s.poli}</span>
                <Button size="icon" variant="ghost" onClick={() => del(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </Card>
            ))}
          </div>
          <div className="border-t pt-3 grid grid-cols-12 gap-2 items-end">
            <div className="col-span-3">
              <Label className="text-xs">Hari</Label>
              <Select value={String(draft.day_of_week)} onValueChange={(v) => setDraft({ ...draft, day_of_week: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-xs">Mulai</Label><Input type="time" value={draft.time_start} onChange={(e) => setDraft({ ...draft, time_start: e.target.value })} /></div>
            <div className="col-span-2"><Label className="text-xs">Selesai</Label><Input type="time" value={draft.time_end} onChange={(e) => setDraft({ ...draft, time_end: e.target.value })} /></div>
            <div className="col-span-3"><Label className="text-xs">Poli/Cat.</Label><Input value={draft.poli} onChange={(e) => setDraft({ ...draft, poli: e.target.value })} /></div>
            <Button className="col-span-2" onClick={add}><Plus className="h-4 w-4 mr-1" />Tambah</Button>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Tutup</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
