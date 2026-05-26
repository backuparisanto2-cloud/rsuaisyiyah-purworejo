import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Loader2, Plus, Trash2, ChevronUp, ChevronDown, RotateCcw, CornerDownRight,
} from "lucide-react";

export const Route = createFileRoute("/administrator/menu")({
  head: () => ({ meta: [{ title: "Menu Builder · Admin" }] }),
  component: MenuAdmin,
});

type Item = {
  id: string;
  label: string;
  href: string;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
};

const DEFAULTS = [
  { label: "Beranda", href: "#beranda" },
  { label: "Tentang Kami", href: "#tentang" },
  { label: "Berita & Info", href: "#berita" },
  { label: "Jadwal Dokter", href: "#jadwal" },
  { label: "Instagram", href: "#instagram" },
  { label: "FAQ", href: "#faq" },
  { label: "Kontak", href: "#kontak" },
];

function MenuAdmin() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("menu_items").select("*").order("display_order");
    if (error) toast.error(error.message);
    setItems((data ?? []) as Item[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const roots = items.filter((i) => !i.parent_id).sort((a, b) => a.display_order - b.display_order);
  const childrenOf = (pid: string) =>
    items.filter((i) => i.parent_id === pid).sort((a, b) => a.display_order - b.display_order);

  async function addItem(parent_id: string | null) {
    const siblings = parent_id ? childrenOf(parent_id) : roots;
    const nextOrder = (siblings.at(-1)?.display_order ?? 0) + 1;
    const { error } = await supabase.from("menu_items").insert({
      label: "Menu Baru", href: "#", parent_id, display_order: nextOrder,
    });
    if (error) return toast.error(error.message);
    load();
  }

  async function update(id: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    const { error } = await supabase.from("menu_items").update(patch).eq("id", id);
    if (error) { toast.error(error.message); load(); }
  }

  async function remove(id: string) {
    if (!confirm("Hapus item ini? Submenu di bawahnya juga akan terhapus.")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Item dihapus");
    load();
  }

  async function move(item: Item, dir: -1 | 1) {
    const siblings = item.parent_id ? childrenOf(item.parent_id) : roots;
    const idx = siblings.findIndex((s) => s.id === item.id);
    const swap = siblings[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("menu_items").update({ display_order: swap.display_order }).eq("id", item.id),
      supabase.from("menu_items").update({ display_order: item.display_order }).eq("id", swap.id),
    ]);
    load();
  }

  async function resetDefault() {
    if (!confirm("Hapus semua menu dan ganti dengan default? Aksi ini tidak bisa dibatalkan.")) return;
    setBusy(true);
    const del = await supabase.from("menu_items").delete().not("id", "is", null);
    if (del.error) { setBusy(false); return toast.error(del.error.message); }
    const ins = await supabase.from("menu_items").insert(
      DEFAULTS.map((d, i) => ({ label: d.label, href: d.href, display_order: i + 1 })),
    );
    setBusy(false);
    if (ins.error) return toast.error(ins.error.message);
    toast.success("Menu direset ke default");
    load();
  }

  function ItemRow({ item, depth }: { item: Item; depth: number }) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 border rounded-md bg-card" style={{ marginLeft: depth * 24 }}>
          {depth > 0 && <CornerDownRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          <div className="flex flex-col gap-0.5 shrink-0">
            <button onClick={() => move(item, -1)} className="hover:text-primary"><ChevronUp className="h-3 w-3" /></button>
            <button onClick={() => move(item, 1)} className="hover:text-primary"><ChevronDown className="h-3 w-3" /></button>
          </div>
          <Input
            value={item.label}
            onChange={(e) => setItems((p) => p.map((x) => x.id === item.id ? { ...x, label: e.target.value } : x))}
            onBlur={() => update(item.id, { label: item.label })}
            placeholder="Label"
            className="flex-1 min-w-0"
          />
          <Input
            value={item.href}
            onChange={(e) => setItems((p) => p.map((x) => x.id === item.id ? { ...x, href: e.target.value } : x))}
            onBlur={() => update(item.id, { href: item.href })}
            placeholder="#anchor atau /p/slug"
            className="flex-1 min-w-0 font-mono text-xs"
          />
          <Switch
            checked={item.is_active}
            onCheckedChange={(v) => update(item.id, { is_active: v })}
          />
          {depth === 0 && (
            <Button size="sm" variant="outline" onClick={() => addItem(item.id)} title="Tambah submenu">
              <Plus className="h-3 w-3" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => remove(item.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
        {childrenOf(item.id).map((c) => <ItemRow key={c.id} item={c} depth={depth + 1} />)}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Menu Builder</h1>
          <p className="text-sm text-muted-foreground">Atur menu navigasi header beserta submenu-nya.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetDefault} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
            Reset Default
          </Button>
          <Button onClick={() => addItem(null)}><Plus className="h-4 w-4 mr-2" />Menu Utama</Button>
        </div>
      </div>

      <Card>
        <CardContent className="py-4">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : roots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada menu. Klik <b>Reset Default</b> untuk mengisi dengan menu standar atau <b>Menu Utama</b> untuk tambah manual.
            </div>
          ) : (
            <div className="space-y-2">
              {roots.map((r) => <ItemRow key={r.id} item={r} depth={0} />)}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        Tips: <code>#beranda</code> untuk anchor section, <code>/p/slug</code> untuk halaman custom, <code>https://...</code> untuk link eksternal.
      </div>
    </div>
  );
}
