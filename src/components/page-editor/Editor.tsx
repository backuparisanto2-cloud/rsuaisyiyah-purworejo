import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Undo2, Redo2, Copy, ClipboardPaste, CopyPlus, Trash2, Save, Rocket, Code2,
  Monitor, Tablet, Smartphone, ChevronRight, History, RotateCcw, Loader2,
} from "lucide-react";
import { WIDGETS, WIDGET_LIST, type EditorNode, type NodeType } from "./registry";
import { cloneWithIds, parseHtml, serializeTree } from "./serialize";
import SourceCodeDialog, { type SourceBundle } from "./SourceCodeDialog";
import { supabase } from "@/integrations/supabase/client";

const DRAFT_KEY = "test-page-editor:draft:v1";

type Draft = {
  tree: EditorNode[];
  showHeader: boolean;
  showFooter: boolean;
  css: string;
  js: string;
};

const emptyDraft: Draft = { tree: [], showHeader: true, showFooter: true, css: "", js: "" };

function loadDraft(): Draft {
  if (typeof window === "undefined") return emptyDraft;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyDraft;
    return { ...emptyDraft, ...JSON.parse(raw) };
  } catch { return emptyDraft; }
}

// ---------- tree helpers ----------
function findAndUpdate(nodes: EditorNode[], id: string, fn: (n: EditorNode) => EditorNode | null): EditorNode[] {
  const out: EditorNode[] = [];
  for (const n of nodes) {
    if (n.id === id) {
      const r = fn(n);
      if (r) out.push(r);
      continue;
    }
    if (n.children) out.push({ ...n, children: findAndUpdate(n.children, id, fn) });
    else out.push(n);
  }
  return out;
}
function findNode(nodes: EditorNode[], id: string): EditorNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const r = findNode(n.children, id);
      if (r) return r;
    }
  }
  return null;
}
function findParent(nodes: EditorNode[], id: string, parent: EditorNode | null = null): { parent: EditorNode | null; index: number } | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) return { parent, index: i };
    const kids = nodes[i].children;
    if (kids) {
      const r = findParent(kids, id, nodes[i]);
      if (r) return r;
    }
  }
  return null;
}

function insertInto(nodes: EditorNode[], targetContainerId: string | null, node: EditorNode, slotIndex = 0): EditorNode[] {
  if (!targetContainerId) return [...nodes, node];
  return nodes.map((n) => {
    if (n.id === targetContainerId) {
      const kids = n.children ? [...n.children] : [];
      // For column widgets, slotIndex maps to child position; we push into slot i if empty else after
      // Simpler: append to end
      kids.push(node);
      return { ...n, children: kids };
    }
    if (n.children) return { ...n, children: insertInto(n.children, targetContainerId, node, slotIndex) };
    return n;
  });
}

function newNode(type: NodeType): EditorNode {
  const def = WIDGETS[type];
  return {
    id: nanoid(6),
    type,
    props: { ...def.defaultProps },
    children: def.isContainer ? [] : undefined,
  };
}

// ---------- main component ----------
export default function Editor() {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [sourceOpen, setSourceOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // history
  const historyRef = useRef<Draft[]>([]);
  const futureRef = useRef<Draft[]>([]);
  const skipHistoryRef = useRef(false);
  const clipboardRef = useRef<EditorNode | null>(null);

  useEffect(() => { setDraft(loadDraft()); }, []);

  const applyDraft = useCallback((next: Draft, pushHistory = true) => {
    setDraft((prev) => {
      if (pushHistory && !skipHistoryRef.current) {
        historyRef.current.push(prev);
        if (historyRef.current.length > 100) historyRef.current.shift();
        futureRef.current = [];
      }
      skipHistoryRef.current = false;
      return next;
    });
  }, []);

  const tree = draft.tree;
  const setTree = (t: EditorNode[]) => applyDraft({ ...draft, tree: t });
  const selected = selectedId ? findNode(tree, selectedId) : null;

  const undo = () => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    futureRef.current.push(draft);
    skipHistoryRef.current = true;
    setDraft(prev);
    toast.success("Undo");
  };
  const redo = () => {
    const next = futureRef.current.pop();
    if (!next) return;
    historyRef.current.push(draft);
    skipHistoryRef.current = true;
    setDraft(next);
    toast.success("Redo");
  };

  const addWidget = (type: NodeType, parentId: string | null = null) => {
    const n = newNode(type);
    setTree(insertInto(tree, parentId, n));
    setSelectedId(n.id);
  };

  const deleteNode = (id: string) => {
    setTree(findAndUpdate(tree, id, () => null));
    setSelectedId(null);
    toast.success("Elemen dihapus");
  };
  const duplicateNode = (id: string) => {
    const n = findNode(tree, id);
    if (!n) return;
    const info = findParent(tree, id);
    if (!info) return;
    const copy = cloneWithIds(n);
    if (!info.parent) setTree([...tree.slice(0, info.index + 1), copy, ...tree.slice(info.index + 1)]);
    else setTree(findAndUpdate(tree, info.parent.id, (p) => ({
      ...p,
      children: [...(p.children ?? []).slice(0, info.index + 1), copy, ...(p.children ?? []).slice(info.index + 1)],
    })));
    setSelectedId(copy.id);
    toast.success("Elemen diduplikasi");
  };
  const copyNode = (id: string) => {
    const n = findNode(tree, id);
    if (n) { clipboardRef.current = cloneWithIds(n); toast.success("Disalin"); }
  };
  const pasteNode = () => {
    if (!clipboardRef.current) { toast.error("Clipboard kosong"); return; }
    const copy = cloneWithIds(clipboardRef.current);
    setTree([...tree, copy]);
    setSelectedId(copy.id);
    toast.success("Ditempel");
  };

  const updateProp = (id: string, key: string, value: any) => {
    setTree(findAndUpdate(tree, id, (n) => ({ ...n, props: { ...n.props, [key]: value } })));
  };

  const saveRevision = useCallback(async (kind: "draft" | "publish", extras?: { title?: string; slug?: string; label?: string }) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("page_editor_revisions" as any).insert({
        kind,
        label: extras?.label ?? null,
        title: extras?.title ?? null,
        slug: extras?.slug ?? null,
        snapshot: draft as any,
        created_by: userData.user?.id ?? null,
      } as any);
      if (error) throw error;
    } catch (e: any) {
      console.error("[revision] save failed", e);
      toast.error(`Gagal menyimpan revisi: ${e.message ?? e}`);
    }
  }, [draft]);

  const saveDraft = async () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch { toast.error("Gagal menyimpan draft lokal"); return; }
    await saveRevision("draft");
    toast.success("Draft tersimpan & revisi tercatat");
  };

  const restoreRevision = (snapshot: Draft) => {
    applyDraft({ ...emptyDraft, ...snapshot });
    setSelectedId(null);
    setHistoryOpen(false);
    toast.success("Revisi dipulihkan");
  };


  const sourceBundle: SourceBundle = useMemo(() => ({
    html: serializeTree(draft.tree),
    css: draft.css,
    js: draft.js,
  }), [draft.tree, draft.css, draft.js]);

  const applySource = (b: SourceBundle) => {
    applyDraft({ ...draft, tree: parseHtml(b.html), css: b.css, js: b.js });
    setSelectedId(null);
  };

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ["INPUT","TEXTAREA"].includes(e.target.tagName)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (mod && e.key === "y") { e.preventDefault(); redo(); }
      else if (mod && e.key === "c" && selectedId) { e.preventDefault(); copyNode(selectedId); }
      else if (mod && e.key === "v") { e.preventDefault(); pasteNode(); }
      else if (mod && e.key === "d" && selectedId) { e.preventDefault(); duplicateNode(selectedId); }
      else if ((e.key === "Delete" || e.key === "Backspace") && selectedId) { deleteNode(selectedId); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, selectedId]);

  const deviceWidth = device === "desktop" ? "100%" : device === "tablet" ? "768px" : "384px";

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-2rem)] min-h-[600px] -mx-3 sm:-mx-6 -mt-3 sm:-mt-6">
      {/* Toolbar */}
      <div className="border-b bg-card px-3 py-2 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={undo} title="Undo (Ctrl+Z)"><Undo2 className="h-4 w-4" /></Button>
        <Button size="sm" variant="outline" onClick={redo} title="Redo (Ctrl+Shift+Z)"><Redo2 className="h-4 w-4" /></Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button size="sm" variant="outline" disabled={!selectedId} onClick={() => selectedId && copyNode(selectedId)}><Copy className="h-4 w-4 mr-1" />Copy</Button>
        <Button size="sm" variant="outline" onClick={pasteNode}><ClipboardPaste className="h-4 w-4 mr-1" />Paste</Button>
        <Button size="sm" variant="outline" disabled={!selectedId} onClick={() => selectedId && duplicateNode(selectedId)}><CopyPlus className="h-4 w-4 mr-1" />Duplicate</Button>
        <Button size="sm" variant="outline" disabled={!selectedId} onClick={() => selectedId && deleteNode(selectedId)}><Trash2 className="h-4 w-4 mr-1" />Hapus</Button>
        <div className="w-px h-6 bg-border mx-1" />
        <div className="inline-flex rounded-md border bg-background">
          <Button size="sm" variant={device === "desktop" ? "default" : "ghost"} onClick={() => setDevice("desktop")} className="rounded-r-none"><Monitor className="h-4 w-4" /></Button>
          <Button size="sm" variant={device === "tablet" ? "default" : "ghost"} onClick={() => setDevice("tablet")} className="rounded-none"><Tablet className="h-4 w-4" /></Button>
          <Button size="sm" variant={device === "mobile" ? "default" : "ghost"} onClick={() => setDevice("mobile")} className="rounded-l-none"><Smartphone className="h-4 w-4" /></Button>
        </div>
        <div className="flex-1" />
        <label className="text-xs flex items-center gap-2"><Switch checked={draft.showHeader} onCheckedChange={(v) => applyDraft({ ...draft, showHeader: v })} />Header</label>
        <label className="text-xs flex items-center gap-2"><Switch checked={draft.showFooter} onCheckedChange={(v) => applyDraft({ ...draft, showFooter: v })} />Footer</label>
        <Button size="sm" variant="outline" onClick={() => setSourceOpen(true)}><Code2 className="h-4 w-4 mr-1" />Source</Button>
        <Button size="sm" variant="outline" onClick={() => setHistoryOpen(true)}><History className="h-4 w-4 mr-1" />History</Button>
        <Button size="sm" variant="outline" onClick={saveDraft}><Save className="h-4 w-4 mr-1" />Save Draft</Button>
        <Button size="sm" onClick={() => setPublishOpen(true)}><Rocket className="h-4 w-4 mr-1" />Kirim ke Pages</Button>
      </div>

      {/* Body: 3 columns */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[240px_1fr_300px] min-h-0">
        {/* Widget palette */}
        <aside className="hidden lg:block border-r bg-card overflow-y-auto">
          <div className="p-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Widgets</div>
            {(["Dasar","Layout","Media","Lanjutan"] as const).map((group) => (
              <div key={group} className="mb-4">
                <div className="text-[11px] font-semibold text-muted-foreground mb-1">{group}</div>
                <div className="grid grid-cols-2 gap-1">
                  {WIDGET_LIST.filter(w => w.group === group).map((w) => (
                    <button
                      key={w.type}
                      onClick={() => addWidget(w.type, selectedContainerFor(tree, selectedId))}
                      className="text-xs border rounded-md px-2 py-2 bg-background hover:bg-muted text-left"
                      title={`Tambah ${w.label}`}
                    >{w.label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <div className="bg-muted/30 overflow-auto p-4">
          <div className="mx-auto bg-background border rounded-md shadow-sm transition-all" style={{ width: deviceWidth, maxWidth: "100%" }}>
            <div className="min-h-[500px] p-4" onClick={() => setSelectedId(null)}>
              {draft.css && <style dangerouslySetInnerHTML={{ __html: draft.css }} />}
              {tree.length === 0 ? (
                <div className="text-center text-muted-foreground py-24 border-2 border-dashed rounded-md">
                  <p className="text-sm">Kanvas kosong.</p>
                  <p className="text-xs mt-1">Klik widget di panel kiri untuk menambahkannya.</p>
                </div>
              ) : (
                <RenderTree nodes={tree} selectedId={selectedId} onSelect={setSelectedId} onAddInto={(pid) => (t) => addWidget(t, pid)} />
              )}
            </div>
          </div>
        </div>

        {/* Property panel */}
        <aside className="hidden lg:block border-l bg-card overflow-y-auto">
          <div className="p-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Properti</div>
            {!selected ? (
              <p className="text-xs text-muted-foreground">Pilih elemen di kanvas untuk mengedit propertinya.</p>
            ) : (
              <PropertyForm node={selected} onChange={(k, v) => updateProp(selected.id, k, v)} />
            )}
          </div>
        </aside>
      </div>

      <SourceCodeDialog open={sourceOpen} onOpenChange={setSourceOpen} value={sourceBundle} onApply={applySource} />
      <PublishDialog open={publishOpen} onOpenChange={setPublishOpen} draft={draft} onPublished={(t, s) => saveRevision("publish", { title: t, slug: s, label: `Publish: ${t}` })} />
      <HistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} onRestore={restoreRevision} />
    </div>
  );
}

function selectedContainerFor(tree: EditorNode[], selectedId: string | null): string | null {
  if (!selectedId) return null;
  const n = findNode(tree, selectedId);
  if (n && WIDGETS[n.type].isContainer) return n.id;
  return null;
}

// ---------- render tree ----------
function RenderTree({ nodes, selectedId, onSelect, onAddInto }: {
  nodes: EditorNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddInto: (parentId: string | null) => (type: NodeType) => void;
}) {
  return (
    <>
      {nodes.map((n) => {
        const def = WIDGETS[n.type];
        const isSelected = n.id === selectedId;
        const slots: React.ReactNode[] = def.isContainer
          ? (n.children && n.children.length > 0
              ? [<RenderTree key="k" nodes={n.children} selectedId={selectedId} onSelect={onSelect} onAddInto={onAddInto} />]
              : [<EmptySlot key="empty" onPick={onAddInto(n.id)} />])
          : [];
        return (
          <div
            key={n.id}
            onClick={(e) => { e.stopPropagation(); onSelect(n.id); }}
            className={`relative group my-1 ${isSelected ? "outline outline-2 outline-primary outline-offset-2 rounded-sm" : "hover:outline hover:outline-1 hover:outline-primary/40 rounded-sm"}`}
          >
            {isSelected && (
              <div className="absolute -top-6 left-0 z-10 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-t-md font-semibold">
                {def.label}
              </div>
            )}
            {def.render(n.props, slots)}
          </div>
        );
      })}
    </>
  );
}

function EmptySlot({ onPick }: { onPick: (t: NodeType) => void }) {
  return (
    <div className="border-2 border-dashed border-border rounded-md p-4 text-center text-xs text-muted-foreground my-2" onClick={(e) => e.stopPropagation()}>
      Slot kosong. Pilih widget untuk ditaruh di sini:
      <div className="flex flex-wrap justify-center gap-1 mt-2">
        {(["heading","text","image","button","divider"] as NodeType[]).map((t) => (
          <button key={t} className="border rounded px-2 py-1 bg-background hover:bg-muted" onClick={() => onPick(t)}>+ {WIDGETS[t].label}</button>
        ))}
      </div>
    </div>
  );
}

// ---------- property form ----------
function PropertyForm({ node, onChange }: { node: EditorNode; onChange: (k: string, v: any) => void }) {
  const def = WIDGETS[node.type];
  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">Widget: <span className="font-semibold text-foreground">{def.label}</span></div>
      {def.fields.length === 0 && <p className="text-xs text-muted-foreground">Widget ini tidak memiliki properti.</p>}
      {def.fields.map((f) => {
        const val = node.props[f.key];
        if (f.kind === "text" || f.kind === "url") return (
          <div key={f.key} className="space-y-1">
            <Label className="text-xs">{f.label}</Label>
            <Input value={val ?? ""} onChange={(e) => onChange(f.key, e.target.value)} />
          </div>
        );
        if (f.kind === "textarea") return (
          <div key={f.key} className="space-y-1">
            <Label className="text-xs">{f.label}</Label>
            <Textarea value={val ?? ""} onChange={(e) => onChange(f.key, e.target.value)} rows={5} />
          </div>
        );
        if (f.kind === "number") return (
          <div key={f.key} className="space-y-1">
            <Label className="text-xs">{f.label}</Label>
            <Input type="number" value={val ?? ""} min={f.min} max={f.max} step={f.step ?? 1} onChange={(e) => onChange(f.key, Number(e.target.value))} />
          </div>
        );
        if (f.kind === "select") return (
          <div key={f.key} className="space-y-1">
            <Label className="text-xs">{f.label}</Label>
            <Select value={String(val ?? "")} onValueChange={(v) => onChange(f.key, v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {f.options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        );
        return null;
      })}
    </div>
  );
}

// ---------- publish dialog ----------
function PublishDialog({ open, onOpenChange, draft }: { open: boolean; onOpenChange: (v: boolean) => void; draft: Draft }) {
  const [title, setTitle] = useState("Halaman Baru");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

  const handlePublish = async () => {
    const finalSlug = slug || slugify(title);
    if (!finalSlug) { toast.error("Slug diperlukan"); return; }
    setSaving(true);
    try {
      const html = serializeTree(draft.tree);
      const wrappedHtml = `${draft.css ? `<style>${draft.css}</style>` : ""}${html}${draft.js ? `<script>${draft.js}<\/script>` : ""}`;
      const { error } = await supabase.from("custom_pages").insert({
        slug: finalSlug,
        title,
        content: wrappedHtml,
        meta_description: title,
        is_published: false,
        image_url: null,
        image_position: "top" as const,
        show_in_menu: false,
        menu_href: null,
        images: [],
      } as any);
      if (error) throw error;
      toast.success(`Halaman dibuat: /p/${finalSlug} (draft, belum publish)`);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(`Gagal membuat halaman: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Kirim ke Pages</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Judul</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Slug (kosongkan untuk otomatis)</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={slugify(title)} />
          </div>
          <p className="text-xs text-muted-foreground">
            Halaman akan dibuat sebagai <b>draft</b> di Page Builder. Buka menu <b>Page Builder</b> untuk mempublikasikannya.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handlePublish} disabled={saving}>{saving ? "Mengirim..." : <><ChevronRight className="h-4 w-4 mr-1" />Buat Halaman</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
