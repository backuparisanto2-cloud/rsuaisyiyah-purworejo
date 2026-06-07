import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import {
  syncKnowledgeFromWebsite,
  generateKnowledgeFromAI,
  ingestKnowledgeDocument,
  rebuildKnowledgeIndex,
  bulkUpdateKnowledge,
} from "@/lib/chatbot.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ImageUpload from "@/components/admin/ImageUpload";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, RefreshCw, Sparkles, Loader2, Save, Upload, Database, FileText, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/administrator/chatbot")({ component: ChatbotAdmin });

type Settings = {
  id: string;
  name: string;
  avatar_url: string | null;
  greeting: string;
  ai_enabled: boolean;
  system_prompt: string;
  temperature: number;
  model: string;
  quick_questions: string[];
  max_messages_per_session: number;
};
type Knowledge = { id: string; title: string; content: string; source: string; source_url: string | null; is_active: boolean };
const emptyK: Omit<Knowledge, "id"> = { title: "", content: "", source: "manual", source_url: "", is_active: true };

function ChatbotAdmin() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [rows, setRows] = useState<Knowledge[]>([]);
  const [editing, setEditing] = useState<(Knowledge | (Omit<Knowledge, "id"> & { id?: string })) | null>(null);
  const [topic, setTopic] = useState("layanan unggulan rumah sakit");
  const [syncing, setSyncing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activateOnImport, setActivateOnImport] = useState(true);

  const syncFn = useServerFn(syncKnowledgeFromWebsite);
  const genFn = useServerFn(generateKnowledgeFromAI);

  async function load() {
    const [{ data: s }, { data: k }] = await Promise.all([
      supabase.from("chatbot_settings").select("*").maybeSingle(),
      supabase.from("chatbot_knowledge").select("*").order("created_at", { ascending: false }),
    ]);
    if (s) setSettings(s as Settings);
    setRows((k as Knowledge[]) ?? []);
  }
  useEffect(() => { void load(); }, []);

  async function saveSettings() {
    if (!settings) return;
    setSavingSettings(true);
    const { error } = await supabase.from("chatbot_settings").update({
      name: settings.name,
      avatar_url: settings.avatar_url,
      greeting: settings.greeting,
      ai_enabled: settings.ai_enabled,
      system_prompt: settings.system_prompt,
      temperature: settings.temperature,
      model: settings.model,
      quick_questions: settings.quick_questions,
      max_messages_per_session: settings.max_messages_per_session,
    }).eq("id", settings.id);
    setSavingSettings(false);
    if (error) return toast.error(error.message);
    toast.success("Pengaturan tersimpan");
  }

  async function saveK() {
    if (!editing) return;
    const p = { title: editing.title, content: editing.content, source: editing.source, source_url: editing.source_url || null, is_active: editing.is_active };
    const { error } = editing.id
      ? await supabase.from("chatbot_knowledge").update(p).eq("id", editing.id)
      : await supabase.from("chatbot_knowledge").insert(p);
    if (error) return toast.error(error.message);
    toast.success("Tersimpan"); setEditing(null); void load();
  }
  async function removeK(id: string) {
    if (!confirm("Hapus entri ini?")) return;
    await supabase.from("chatbot_knowledge").delete().eq("id", id); void load();
  }

  async function doSync() {
    setSyncing(true);
    try {
      const r = await syncFn({ data: { isActive: activateOnImport } });
      toast.success(`Sinkronisasi selesai: ${r.count} entri dari website`);
      void load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSyncing(false); }
  }
  async function doGenerate() {
    if (!topic.trim()) return toast.error("Isi topik dulu");
    setGenerating(true);
    try {
      const r = await genFn({ data: { topic: topic.trim(), isActive: activateOnImport } });
      toast.success(`Berhasil menambah ${r.count} entri dari AI`);
      void load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setGenerating(false); }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">Chatbot</h1>

      <Card className="p-4 space-y-4" data-tour="chatbot-settings">

        <h2 className="font-semibold">Pengaturan Bot</h2>
        {settings ? (
          <div className="grid md:grid-cols-[200px_1fr] gap-4">
            <div>
              <Label>Avatar</Label>
              <ImageUpload value={settings.avatar_url} onChange={(url) => setSettings({ ...settings, avatar_url: url })} folder="chatbot" />
            </div>
            <div className="space-y-3">
              <div><Label>Nama</Label><Input value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} /></div>
              <div><Label>Pesan Sambutan</Label><Textarea rows={3} value={settings.greeting} onChange={(e) => setSettings({ ...settings, greeting: e.target.value })} /></div>

              <div className="border-t pt-3 space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-md border p-3 bg-muted/30">
                  <div>
                    <Label className="text-sm">Mode AI (chatbot pintar)</Label>
                    <div className="text-xs text-muted-foreground">Bila dimatikan, chatbot kembali memakai pencocokan kata kunci.</div>
                  </div>
                  <Switch
                    checked={settings.ai_enabled}
                    onCheckedChange={(v) => setSettings({ ...settings, ai_enabled: v })}
                  />
                </div>

                <div>
                  <Label>Persona / System Prompt</Label>
                  <Textarea
                    rows={6}
                    value={settings.system_prompt}
                    onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
                    placeholder="Aturan dan kepribadian asisten…"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Tentukan gaya bicara, batasan, dan bagaimana asisten harus merespons. Data resmi (dokter, jadwal, kontak) ditambahkan otomatis.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Model</Label>
                    <select
                      className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                      value={settings.model}
                      onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                    >
                      <option value="google/gemini-3-flash-preview">Cepat (Gemini 3 Flash)</option>
                      <option value="google/gemini-2.5-flash">Seimbang (Gemini 2.5 Flash)</option>
                      <option value="google/gemini-2.5-pro">Cerdas (Gemini 2.5 Pro)</option>
                    </select>
                  </div>
                  <div>
                    <Label>Kreativitas: {Number(settings.temperature).toFixed(2)}</Label>
                    <input
                      type="range"
                      min={0.1}
                      max={0.9}
                      step={0.05}
                      value={settings.temperature}
                      onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                      className="w-full mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label>Pertanyaan Cepat (satu per baris)</Label>
                  <Textarea
                    rows={5}
                    value={(settings.quick_questions ?? []).join("\n")}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        quick_questions: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder={"Jadwal dokter\nPendaftaran online\nJam besuk"}
                  />
                </div>
              </div>

              <Button onClick={saveSettings} disabled={savingSettings}>
                {savingSettings ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Simpan Pengaturan
              </Button>
            </div>
          </div>
        ) : <div className="text-sm text-muted-foreground">Memuat…</div>}
      </Card>

      <Card className="p-4 space-y-4" data-tour="chatbot-kb">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Knowledge Chatbot ({rows.length})</h2>
          <div className="flex gap-2 flex-wrap items-center">
            <label className="flex items-center gap-2 text-sm px-2">
              <Switch checked={activateOnImport} onCheckedChange={setActivateOnImport} />
              Aktifkan entri baru
            </label>
            <Button variant="outline" onClick={doSync} disabled={syncing}>
              {syncing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Update dari Website
            </Button>
            <Button onClick={() => setEditing({ ...emptyK })}><Plus className="h-4 w-4 mr-1" />Tambah Manual</Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-end border-t pt-4">
          <div className="flex-1 min-w-[240px]">
            <Label>Topik untuk dipelajari dari internet (AI)</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="contoh: jam besuk, fasilitas, BPJS" />
          </div>
          <Button variant="secondary" onClick={doGenerate} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Generate dari Internet
          </Button>
        </div>

        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="border rounded-md p-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold truncate">{r.title}</span>
                  <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{r.source}</span>
                </div>
                <div className="text-sm text-muted-foreground line-clamp-2 mt-1 whitespace-pre-wrap">{r.content}</div>
              </div>
              <Switch checked={r.is_active} onCheckedChange={async () => { await supabase.from("chatbot_knowledge").update({ is_active: !r.is_active }).eq("id", r.id); void load(); }} />
              <Button size="icon" variant="outline" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="destructive" onClick={() => removeK(r.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          {!rows.length && <div className="text-sm text-muted-foreground text-center py-8">Belum ada knowledge. Klik "Update dari Website" untuk mengimpor data eksisting.</div>}
        </div>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "Tambah"} Knowledge</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Judul</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div><Label>Isi</Label><Textarea rows={6} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} /></div>
              <div><Label>URL Sumber (opsional)</Label><Input value={editing.source_url ?? ""} onChange={(e) => setEditing({ ...editing, source_url: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /><Label>Aktif</Label></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Batal</Button><Button onClick={saveK}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
