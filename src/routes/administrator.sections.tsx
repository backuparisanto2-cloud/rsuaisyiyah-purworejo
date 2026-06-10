import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { SortableList, persistOrder } from "@/components/admin/SortableList";
import { toast } from "sonner";

export const Route = createFileRoute("/administrator/sections")({ component: SectionsAdmin });

type Row = { id: string; key: string; label: string; display_order: number; is_active: boolean };

function SectionsAdmin() {
  const [rows, setRows] = useState<Row[]>([]);

  async function load() {
    const { data, error } = await supabase.from("home_sections").select("*").order("display_order");
    if (error) toast.error(error.message);
    setRows((data as Row[]) ?? []);
  }
  useEffect(() => { void load(); }, []);

  async function reorder(next: Row[]) {
    setRows(next);
    await persistOrder("home_sections", next, supabase);
    toast.success("Urutan tersimpan");
    void load();
  }

  async function toggle(r: Row) {
    const { error } = await supabase.from("home_sections").update({ is_active: !r.is_active }).eq("id", r.id);
    if (error) toast.error(error.message); else void load();
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Urutan Section</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Seret untuk mengatur urutan, atau matikan toggle untuk menyembunyikan section dari halaman utama.
          Hero dan Footer selalu tampil dan tidak bisa diatur di sini.
        </p>
      </div>
      <div data-tour="sections-list">
        <SortableList items={rows} onReorder={reorder} renderItem={(r, h) => (
          <Card className="p-3 flex items-center gap-3">
            {h}
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{r.label}</div>
              <div className="text-xs text-muted-foreground font-mono">{r.key}</div>
            </div>
            <Switch checked={r.is_active} onCheckedChange={() => toggle(r)} />
          </Card>
        )} />
      </div>
    </div>
  );
}
