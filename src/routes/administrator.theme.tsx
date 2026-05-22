import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { RotateCcw, Save } from "lucide-react";

export const Route = createFileRoute("/administrator/theme")({ component: ThemeAdmin });

type Row = {
  id: string;
  primary_color: string; primary_dark: string; primary_foreground: string;
  secondary_color: string; secondary_foreground: string;
  accent_color: string; accent_foreground: string;
  gold_color: string;
  background_color: string; foreground_color: string;
  muted_color: string; muted_foreground: string;
  border_color: string; ring_color: string; destructive_color: string;
};

const DEFAULTS: Omit<Row, "id"> = {
  primary_color: "#062e6e", primary_dark: "#001952", primary_foreground: "#f8f8f8",
  secondary_color: "#008b45", secondary_foreground: "#f8f8f8",
  accent_color: "#d1e7ff", accent_foreground: "#08152c",
  gold_color: "#ecbe24",
  background_color: "#ffffff", foreground_color: "#08152c",
  muted_color: "#edf2f8", muted_foreground: "#596475",
  border_color: "#d4dfeb", ring_color: "#062e6e", destructive_color: "#e60016",
};

const GROUPS: { title: string; fields: { key: keyof typeof DEFAULTS; label: string; hint?: string }[] }[] = [
  {
    title: "Warna Utama (Brand)",
    fields: [
      { key: "primary_color", label: "Primary", hint: "Warna utama brand (header, tombol, link)" },
      { key: "primary_dark", label: "Primary Dark", hint: "Variasi gelap dari primary" },
      { key: "primary_foreground", label: "Primary Foreground", hint: "Teks di atas warna primary" },
      { key: "secondary_color", label: "Secondary", hint: "Warna pendamping (mis. hijau)" },
      { key: "secondary_foreground", label: "Secondary Foreground", hint: "Teks di atas secondary" },
      { key: "gold_color", label: "Gold / Accent Emas", hint: "Aksen kuning emas pada hero" },
    ],
  },
  {
    title: "Aksen & Permukaan",
    fields: [
      { key: "accent_color", label: "Accent" },
      { key: "accent_foreground", label: "Accent Foreground" },
      { key: "background_color", label: "Background", hint: "Latar utama halaman" },
      { key: "foreground_color", label: "Foreground", hint: "Warna teks utama" },
      { key: "muted_color", label: "Muted", hint: "Latar lembut (mis. card hover)" },
      { key: "muted_foreground", label: "Muted Foreground", hint: "Teks sekunder" },
    ],
  },
  {
    title: "Border, Ring & Status",
    fields: [
      { key: "border_color", label: "Border" },
      { key: "ring_color", label: "Ring (Focus)" },
      { key: "destructive_color", label: "Destructive (Error)" },
    ],
  },
];

function ThemeAdmin() {
  const [row, setRow] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase.from("theme_settings").select("*").maybeSingle();
    if (data) setRow(data as Row);
  }
  useEffect(() => { void load(); }, []);

  function update<K extends keyof Row>(k: K, v: Row[K]) {
    if (!row) return;
    setRow({ ...row, [k]: v });
  }

  async function save() {
    if (!row) return;
    setSaving(true);
    const { id, ...patch } = row;
    const { error } = await supabase.from("theme_settings").update(patch).eq("id", id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Tema tersimpan & diterapkan");
  }

  async function reset() {
    if (!row) return;
    if (!confirm("Kembalikan ke warna default?")) return;
    const { error } = await supabase.from("theme_settings").update(DEFAULTS).eq("id", row.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Direset ke default");
    void load();
  }

  if (!row) return <div className="p-8 text-sm text-muted-foreground">Memuat…</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tema Warna</h1>
          <p className="text-sm text-muted-foreground">Ubah warna situs. Perubahan diterapkan realtime ke semua halaman.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset}><RotateCcw className="h-4 w-4 mr-1" /> Reset Default</Button>
          <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1" /> {saving ? "Menyimpan…" : "Simpan"}</Button>
        </div>
      </div>

      {GROUPS.map((g) => (
        <Card key={g.title} className="p-4">
          <h2 className="font-semibold mb-3">{g.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {g.fields.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs">{f.label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={row[f.key]}
                    onChange={(e) => update(f.key, e.target.value)}
                    className="h-10 w-12 rounded border cursor-pointer bg-transparent shrink-0"
                  />
                  <Input
                    value={row[f.key]}
                    onChange={(e) => update(f.key, e.target.value)}
                    placeholder="#000000"
                    className="font-mono text-xs"
                  />
                </div>
                {f.hint && <p className="text-[11px] text-muted-foreground">{f.hint}</p>}
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Pratinjau</h2>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground">Primary</button>
          <button className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground">Secondary</button>
          <button className="px-4 py-2 rounded-md bg-gold text-primary-dark font-bold">Gold</button>
          <button className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground">Destructive</button>
          <button className="px-4 py-2 rounded-md bg-accent text-accent-foreground">Accent</button>
          <button className="px-4 py-2 rounded-md border bg-muted text-muted-foreground">Muted</button>
        </div>
      </Card>
    </div>
  );
}
