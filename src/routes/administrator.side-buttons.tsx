import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { SortableList, persistOrder } from "@/components/admin/SortableList";
import { toast } from "sonner";
import { Save } from "lucide-react";

export const Route = createFileRoute("/administrator/side-buttons")({
  component: SideButtonsAdmin,
});

type Row = {
  id: string;
  key: string;
  label: string;
  url: string | null;
  wa_prolog: string | null;
  is_active: boolean;
  display_order: number;
};

function SideButtonsAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [dirty, setDirty] = useState<Record<string, Partial<Row>>>({});

  async function load() {
    const { data } = await supabase.from("side_buttons").select("*").order("display_order");
    setRows((data as Row[]) ?? []);
    setDirty({});
  }
  useEffect(() => { void load(); }, []);

  const update = (id: string, patch: Partial<Row>) => {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    setDirty((d) => ({ ...d, [id]: { ...(d[id] ?? {}), ...patch } }));
  };

  async function saveOne(row: Row) {
    const patch = dirty[row.id];
    if (!patch) return;
    const { error } = await supabase.from("side_buttons").update(patch).eq("id", row.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${row.label} tersimpan`);
    setDirty((d) => { const { [row.id]: _, ...rest } = d; return rest; });
  }

  async function toggleActive(row: Row) {
    const next = !row.is_active;
    update(row.id, { is_active: next });
    const { error } = await supabase.from("side_buttons").update({ is_active: next }).eq("id", row.id);
    if (error) toast.error(error.message);
  }

  async function reorder(next: Row[]) {
    setRows(next);
    await persistOrder("side_buttons", next, supabase);
    void load();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Tombol Samping (Right Side)</h1>
        <p className="text-sm text-muted-foreground">Aktif/nonaktifkan tombol, ubah URL, dan atur urutan. Untuk WhatsApp, isi nomor beserta prolog pesan.</p>
      </div>

      <SortableList
        items={rows}
        onReorder={reorder}
        renderItem={(r, handle) => (
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              {handle}
              <div className="flex-1">
                <div className="font-semibold capitalize">{r.label} <span className="text-xs text-muted-foreground">({r.key})</span></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r)} />
                <span className="text-xs text-muted-foreground">{r.is_active ? "Aktif" : "Nonaktif"}</span>
              </div>
            </div>

            {r.key !== "accessibility" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>{r.key === "whatsapp" ? "Nomor WhatsApp (contoh: 6289646710859)" : "URL"}</Label>
                  <Input
                    value={r.url ?? ""}
                    onChange={(e) => update(r.id, { url: e.target.value })}
                    placeholder={r.key === "whatsapp" ? "62..." : "https://..."}
                  />
                </div>
                <div>
                  <Label>Label</Label>
                  <Input value={r.label} onChange={(e) => update(r.id, { label: e.target.value })} />
                </div>
                {r.key === "whatsapp" && (
                  <div className="sm:col-span-2">
                    <Label>Prolog Pesan WhatsApp</Label>
                    <Input
                      value={r.wa_prolog ?? ""}
                      onChange={(e) => update(r.id, { wa_prolog: e.target.value })}
                      placeholder="Hi RSU AISYIYAH ..."
                    />
                  </div>
                )}
              </div>
            )}

            {r.key === "accessibility" && (
              <div>
                <Label>Label</Label>
                <Input value={r.label} onChange={(e) => update(r.id, { label: e.target.value })} />
                <p className="text-xs text-muted-foreground mt-1">Tombol ini membuka panel Aksesibilitas — tidak memerlukan URL.</p>
              </div>
            )}

            {dirty[r.id] && (
              <div className="flex justify-end">
                <Button size="sm" onClick={() => saveOne(r)}><Save className="h-4 w-4 mr-1" />Simpan</Button>
              </div>
            )}
          </Card>
        )}
      />
    </div>
  );
}
