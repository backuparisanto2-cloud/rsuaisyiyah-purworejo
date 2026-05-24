import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { extractScheduleFromImage } from "@/lib/schedule-ocr.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Sparkles, Upload } from "lucide-react";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

type ScheduleRow = { day_of_week: number; time_start: string; time_end: string; poli: string };
type DoctorBlock = {
  name: string;
  specialty: string;
  schedules: ScheduleRow[];
  matchId: string; // "__new__" or existing doctor id
};

type Props = {
  open: boolean;
  onClose: () => void;
  mode: "single" | "multi";
  /** Required for single mode */
  doctorId?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  /** existing doctors (for multi-mode matching) */
  existingDoctors?: { id: string; name: string; specialty: string }[];
  onSaved: () => void;
};

async function fileToCompressedDataUrl(file: File, maxSide = 1600, quality = 0.85): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

export default function ScheduleImportDialog(props: Props) {
  const { open, onClose, mode, doctorId, doctorName, doctorSpecialty, existingDoctors = [], onSaved } = props;
  const extractFn = useServerFn(extractScheduleFromImage);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<ScheduleRow[] | null>(null); // single mode
  const [blocks, setBlocks] = useState<DoctorBlock[] | null>(null); // multi mode
  const [saveMode, setSaveMode] = useState<"append" | "replace">("append");

  function reset() {
    setFile(null); setPreview(null); setRows(null); setBlocks(null);
    setLoading(false); setSaving(false); setSaveMode("append");
  }
  function handleClose() { reset(); onClose(); }

  async function handleFile(f: File) {
    setFile(f);
    const compressed = await fileToCompressedDataUrl(f);
    setPreview(compressed);
  }

  async function runExtract() {
    if (!preview) { toast.error("Pilih gambar dulu"); return; }
    setLoading(true);
    try {
      const result = await extractFn({
        data: {
          imageBase64: preview,
          mode,
          doctorName,
          doctorSpecialty,
        },
      });
      if (result.mode === "single") {
        setRows(result.schedules.length ? result.schedules : [{ day_of_week: 1, time_start: "08:00", time_end: "12:00", poli: "" }]);
      } else {
        setBlocks(result.doctors.map((d) => {
          const match = existingDoctors.find((e) => e.name.trim().toLowerCase() === d.name.trim().toLowerCase());
          return { name: d.name, specialty: d.specialty, schedules: d.schedules, matchId: match?.id ?? "__new__" };
        }));
      }
      toast.success("Berhasil diekstrak. Silakan periksa & edit.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal ekstrak");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (mode === "single") {
        if (!doctorId || !rows) return;
        if (saveMode === "replace") {
          const { error } = await supabase.from("doctor_schedules").delete().eq("doctor_id", doctorId);
          if (error) throw error;
        }
        if (rows.length) {
          const { error } = await supabase.from("doctor_schedules").insert(
            rows.map((r) => ({ doctor_id: doctorId, ...r }))
          );
          if (error) throw error;
        }
      } else {
        if (!blocks) return;
        for (const b of blocks) {
          let did = b.matchId;
          if (did === "__new__") {
            if (!b.name.trim()) continue;
            const { data, error } = await supabase.from("doctors").insert({
              name: b.name.trim(),
              specialty: b.specialty.trim(),
              is_active: true,
              display_order: 0,
            }).select("id").single();
            if (error) throw error;
            did = data.id;
          } else if (saveMode === "replace") {
            const { error } = await supabase.from("doctor_schedules").delete().eq("doctor_id", did);
            if (error) throw error;
          }
          if (b.schedules.length) {
            const { error } = await supabase.from("doctor_schedules").insert(
              b.schedules.map((r) => ({ doctor_id: did, ...r }))
            );
            if (error) throw error;
          }
        }
      }
      toast.success("Tersimpan");
      onSaved();
      handleClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  const hasResult = (mode === "single" && rows) || (mode === "multi" && blocks);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "single" ? `Import Jadwal dari Gambar — ${doctorName ?? ""}` : "Import Multi-Dokter dari Gambar"}
          </DialogTitle>
        </DialogHeader>

        {!hasResult && (
          <div className="space-y-3">
            <div>
              <Label>Pilih gambar jadwal (JPG/PNG)</Label>
              <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
            </div>
            {preview && (
              <div className="border rounded-lg overflow-hidden bg-muted">
                <img src={preview} alt="Preview" className="max-h-72 w-auto mx-auto" />
              </div>
            )}
            <Button onClick={runExtract} disabled={!preview || loading} className="w-full">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />AI sedang membaca…</>
                : <><Sparkles className="h-4 w-4 mr-2" />Rapikan & Ekstrak dengan AI</>}
            </Button>
          </div>
        )}

        {mode === "single" && rows && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Periksa & edit jadwal sebelum disimpan.</div>
            {rows.map((r, i) => (
              <Card key={i} className="p-2 grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <Label className="text-xs">Hari</Label>
                  <Select value={String(r.day_of_week)} onValueChange={(v) => setRows(rows.map((x, k) => k === i ? { ...x, day_of_week: Number(v) } : x))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DAYS.map((d, k) => <SelectItem key={k} value={String(k)}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label className="text-xs">Mulai</Label><Input type="time" value={r.time_start} onChange={(e) => setRows(rows.map((x, k) => k === i ? { ...x, time_start: e.target.value } : x))} /></div>
                <div className="col-span-2"><Label className="text-xs">Selesai</Label><Input type="time" value={r.time_end} onChange={(e) => setRows(rows.map((x, k) => k === i ? { ...x, time_end: e.target.value } : x))} /></div>
                <div className="col-span-4"><Label className="text-xs">Poli/Cat.</Label><Input value={r.poli} onChange={(e) => setRows(rows.map((x, k) => k === i ? { ...x, poli: e.target.value } : x))} /></div>
                <Button size="icon" variant="ghost" className="col-span-1" onClick={() => setRows(rows.filter((_, k) => k !== i))}><Trash2 className="h-4 w-4" /></Button>
              </Card>
            ))}
            <Button size="sm" variant="outline" onClick={() => setRows([...rows, { day_of_week: 1, time_start: "08:00", time_end: "12:00", poli: "" }])}>
              <Plus className="h-4 w-4 mr-1" />Tambah baris
            </Button>
          </div>
        )}

        {mode === "multi" && blocks && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">Periksa & edit hasil ekstraksi sebelum disimpan.</div>
            {blocks.map((b, bi) => (
              <Card key={bi} className="p-3 space-y-2 border-2">
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5"><Label className="text-xs">Nama</Label><Input value={b.name} onChange={(e) => setBlocks(blocks.map((x, k) => k === bi ? { ...x, name: e.target.value } : x))} /></div>
                  <div className="col-span-4"><Label className="text-xs">Spesialis</Label><Input value={b.specialty} onChange={(e) => setBlocks(blocks.map((x, k) => k === bi ? { ...x, specialty: e.target.value } : x))} /></div>
                  <div className="col-span-2">
                    <Label className="text-xs">Tujuan</Label>
                    <Select value={b.matchId} onValueChange={(v) => setBlocks(blocks.map((x, k) => k === bi ? { ...x, matchId: v } : x))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__new__">+ Dokter baru</SelectItem>
                        {existingDoctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="icon" variant="ghost" className="col-span-1" onClick={() => setBlocks(blocks.filter((_, k) => k !== bi))}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-1 pl-2 border-l-2">
                  {b.schedules.map((r, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-3">
                        <Select value={String(r.day_of_week)} onValueChange={(v) => setBlocks(blocks.map((x, k) => k === bi ? { ...x, schedules: x.schedules.map((s, si) => si === i ? { ...s, day_of_week: Number(v) } : s) } : x))}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>{DAYS.map((d, k) => <SelectItem key={k} value={String(k)}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2"><Input className="h-8" type="time" value={r.time_start} onChange={(e) => setBlocks(blocks.map((x, k) => k === bi ? { ...x, schedules: x.schedules.map((s, si) => si === i ? { ...s, time_start: e.target.value } : s) } : x))} /></div>
                      <div className="col-span-2"><Input className="h-8" type="time" value={r.time_end} onChange={(e) => setBlocks(blocks.map((x, k) => k === bi ? { ...x, schedules: x.schedules.map((s, si) => si === i ? { ...s, time_end: e.target.value } : s) } : x))} /></div>
                      <div className="col-span-4"><Input className="h-8" placeholder="Poli" value={r.poli} onChange={(e) => setBlocks(blocks.map((x, k) => k === bi ? { ...x, schedules: x.schedules.map((s, si) => si === i ? { ...s, poli: e.target.value } : s) } : x))} /></div>
                      <Button size="icon" variant="ghost" className="col-span-1 h-8 w-8" onClick={() => setBlocks(blocks.map((x, k) => k === bi ? { ...x, schedules: x.schedules.filter((_, si) => si !== i) } : x))}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => setBlocks(blocks.map((x, k) => k === bi ? { ...x, schedules: [...x.schedules, { day_of_week: 1, time_start: "08:00", time_end: "12:00", poli: "" }] } : x))}>
                    <Plus className="h-3 w-3 mr-1" />Tambah jadwal
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {hasResult && (
          <div className="border-t pt-3 space-y-2">
            <Label className="text-sm font-semibold">Mode simpan</Label>
            <RadioGroup value={saveMode} onValueChange={(v) => setSaveMode(v as "append" | "replace")} className="flex gap-4">
              <div className="flex items-center gap-2"><RadioGroupItem value="append" id="append" /><Label htmlFor="append" className="font-normal cursor-pointer">Tambahkan (Append)</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="replace" id="replace" /><Label htmlFor="replace" className="font-normal cursor-pointer">Ganti semua jadwal (Replace)</Label></div>
            </RadioGroup>
            {saveMode === "replace" && (
              <p className="text-xs text-destructive">⚠ Jadwal lama dokter terkait akan dihapus sebelum hasil baru disimpan.</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Batal</Button>
          {hasResult && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan…</> : <><Upload className="h-4 w-4 mr-2" />Simpan</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
