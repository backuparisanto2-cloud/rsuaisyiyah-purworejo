import { createFileRoute } from "@tanstack/react-router";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Loader2, Plus, Trash2, ChevronUp, ChevronDown, RotateCcw, CornerDownRight, Save, Check, AlertCircle,
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

type RowProps = {
  item: Item;
  depth: number;
  dirty: boolean;
  children: Item[];
  childrenOf: (pid: string) => Item[];
  dirtyIds: string[];
  onPatch: (id: string, patch: Partial<Item>) => void;
  onMove: (item: Item, dir: -1 | 1) => void;
  onAdd: (parentId: string | null) => void;
  onRemove: (id: string) => void;
};

const ItemRow = memo(function ItemRow({
  item, depth, dirty, children, childrenOf, dirtyIds, onPatch, onMove, onAdd, onRemove,
}: RowProps) {
  return (
    <div className="space-y-2">
      <div
        className={"flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 border rounded-md bg-card " + (dirty ? "border-primary/50" : "")}
        style={{ marginLeft: depth * 12 }}
      >
        {depth > 0 && <CornerDownRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button onClick={() => onMove(item, -1)} className="hover:text-primary"><ChevronUp className="h-3 w-3" /></button>
          <button onClick={() => onMove(item, 1)} className="hover:text-primary"><ChevronDown className="h-3 w-3" /></button>
        </div>
        <Input
          value={item.label}
          onChange={(e) => onPatch(item.id, { label: e.target.value })}
          placeholder="Label"
          className="flex-1 min-w-[140px]"
        />
        <Input
          value={item.href}
          onChange={(e) => onPatch(item.id, { href: e.target.value })}
          placeholder="#anchor atau /p/slug"
          className="flex-1 min-w-[140px] font-mono text-xs"
        />
        <div className="flex items-center gap-1 ml-auto">
          <Switch
            checked={item.is_active}
            onCheckedChange={(v) => onPatch(item.id, { is_active: v })}
          />
          {depth === 0 && (
            <Button size="sm" variant="outline" onClick={() => onAdd(item.id)} title="Tambah submenu">
              <Plus className="h-3 w-3" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onRemove(item.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      {children.map((c) => (
        <ItemRow
          key={c.id}
          item={c}
          depth={depth + 1}
          dirty={dirtyIds.includes(c.id)}
          children={childrenOf(c.id)}
          childrenOf={childrenOf}
          dirtyIds={dirtyIds}
          onPatch={onPatch}
          onMove={onMove}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
});

function MenuAdmin() {
  const [items, setItems] = useState<Item[]>([]);
  const [original, setOriginal] = useState<Record<string, Item>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastError, setLastError] = useState<string>("");
  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;
  const savingRef = useRef(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    const { data, error } = await supabase
      .from("menu_items").select("*").order("display_order");
    if (error) toast.error(error.message);
    const rows = (data ?? []) as Item[];
    setItems(rows);
    setOriginal(Object.fromEntries(rows.map((r) => [r.id, r])));
    if (!opts?.silent) setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const roots = items.filter((i) => !i.parent_id).sort((a, b) => a.display_order - b.display_order);
  const childrenOf = useCallback(
    (pid: string) =>
      itemsRef.current.filter((i) => i.parent_id === pid).sort((a, b) => a.display_order - b.display_order),
    [],
  );

  const dirtyIds = items.filter((i) => {
    const o = original[i.id];
    return !o || o.label !== i.label || o.href !== i.href || o.is_active !== i.is_active;
  }).map((i) => i.id);
  const isDirty = dirtyIds.length > 0;

  const patchLocal = useCallback((id: string, patch: Partial<Item>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    setSaveStatus((s) => (s === "saved" || s === "error" ? "idle" : s));
  }, []);

  const saveAll = useCallback(async () => {
    if (savingRef.current) return;
    const snapshot = itemsRef.current;
    const pending = snapshot.filter((i) => {
      const o = original[i.id];
      return !o || o.label !== i.label || o.href !== i.href || o.is_active !== i.is_active;
    });
    if (!pending.length) return;
    savingRef.current = true;
    setSaving(true);
    setSaveStatus("saving");
    const tId = toast.loading(`Menyimpan ${pending.length} perubahan...`);
    const errors: string[] = [];
    for (const it of pending) {
      const { error } = await supabase.from("menu_items")
        .update({ label: it.label, href: it.href, is_active: it.is_active })
        .eq("id", it.id);
      if (error) errors.push(error.message);
    }
    savingRef.current = false;
    setSaving(false);
    if (errors.length) {
      setSaveStatus("error");
      setLastError(errors[0]);
      toast.error(`Gagal menyimpan: ${errors[0]}`, { id: tId });
      load({ silent: true });
    } else {
      // Perbarui baseline saja — jangan timpa input yang sedang diketik.
      setOriginal((prev) => {
        const next = { ...prev };
        for (const it of pending) next[it.id] = { ...it };
        return next;
      });
      setSaveStatus("saved");
      setLastError("");
      toast.success(`Berhasil tersimpan (${pending.length} item)`, { id: tId });
    }
  }, [original, load]);

  async function addItem(parent_id: string | null) {
    const siblings = parent_id ? childrenOf(parent_id) : roots;
    const nextOrder = (siblings.at(-1)?.display_order ?? 0) + 1;
    const { error } = await supabase.from("menu_items").insert({
      label: "Menu Baru", href: "#", parent_id, display_order: nextOrder,
    });
    if (error) return toast.error(error.message);
    load({ silent: true });
  }

  async function remove(id: string) {
    if (!confirm("Hapus item ini? Submenu di bawahnya juga akan terhapus.")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Item dihapus");
    load({ silent: true });
  }

  async function move(item: Item, dir: -1 | 1) {
    const siblings = item.parent_id ? childrenOf(item.parent_id) : itemsRef.current
      .filter((i) => !i.parent_id).sort((a, b) => a.display_order - b.display_order);
    const idx = siblings.findIndex((s) => s.id === item.id);
    const swap = siblings[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("menu_items").update({ display_order: swap.display_order }).eq("id", item.id),
      supabase.from("menu_items").update({ display_order: item.display_order }).eq("id", swap.id),
    ]);
    load({ silent: true });
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
    load({ silent: true });
  }

  // Keyboard: Cmd/Ctrl+S to save
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (isDirty && !saving) saveAll();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Auto-save dengan debounce 1500ms (timer di-reset tiap ketikan)
  useEffect(() => {
    if (loading || saving || !isDirty) return;
    const t = setTimeout(() => { saveAll(); }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, loading]);

  const statusBadge = saveStatus === "saving" ? (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Menyimpan...</span>
  ) : saveStatus === "saved" ? (
    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-500"><Check className="h-3 w-3" /> Tersimpan</span>
  ) : saveStatus === "error" ? (
    <span className="inline-flex items-center gap-1 text-xs text-destructive" title={lastError}><AlertCircle className="h-3 w-3" /> Gagal menyimpan</span>
  ) : isDirty ? (
    <span className="text-xs text-primary font-semibold">● {dirtyIds.length} belum tersimpan</span>
  ) : null;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Menu Builder</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Atur menu navigasi header beserta submenu-nya. {statusBadge}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={resetDefault} disabled={busy} data-tour="menu-reset">
            {busy ? <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 sm:mr-2" />}
            <span className="hidden sm:inline">Reset Default</span>
          </Button>
          <Button size="sm" variant="outline" onClick={() => addItem(null)} data-tour="menu-add">
            <Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Menu Utama</span>
          </Button>
          <Button size="sm" onClick={saveAll} disabled={!isDirty || saving} data-tour="menu-save">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Simpan
          </Button>
        </div>
      </div>

      <Card data-tour="menu-list">
        <CardContent className="py-4">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : roots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada menu. Klik <b>Reset Default</b> untuk mengisi dengan menu standar atau <b>Menu Utama</b> untuk tambah manual.
            </div>
          ) : (
            <div className="space-y-2">
              {roots.map((r) => (
                <ItemRow
                  key={r.id}
                  item={r}
                  depth={0}
                  dirty={dirtyIds.includes(r.id)}
                  children={childrenOf(r.id)}
                  childrenOf={childrenOf}
                  dirtyIds={dirtyIds}
                  onPatch={patchLocal}
                  onMove={move}
                  onAdd={addItem}
                  onRemove={remove}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        Tips: <code>#beranda</code> untuk anchor section, <code>/p/slug</code> untuk halaman custom, <code>https://...</code> untuk link eksternal.
        Tekan <kbd className="px-1 py-0.5 border rounded">Ctrl/Cmd + S</kbd> untuk simpan cepat.
      </div>
    </div>
  );
}
