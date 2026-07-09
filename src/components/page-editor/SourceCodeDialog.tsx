import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { html_beautify, css_beautify, js_beautify } from "js-beautify";
import { Copy, ClipboardPaste, Eraser, Wand2, Download, Upload, Save } from "lucide-react";

export type SourceBundle = { html: string; css: string; js: string };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: SourceBundle;
  onApply: (v: SourceBundle) => void;
};

export default function SourceCodeDialog({ open, onOpenChange, value, onApply }: Props) {
  const [tab, setTab] = useState<"html" | "css" | "js">("html");
  const [local, setLocal] = useState<SourceBundle>(value);

  useEffect(() => {
    if (open) setLocal(value);
  }, [open, value]);

  const current = local[tab];
  const setCurrent = (v: string) => setLocal((l) => ({ ...l, [tab]: v }));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current);
      toast.success(`${tab.toUpperCase()} disalin ke clipboard`);
    } catch { toast.error("Gagal menyalin"); }
  };
  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCurrent(text);
      toast.success("Konten ditempel");
    } catch { toast.error("Gagal menempel dari clipboard"); }
  };
  const clear = () => { setCurrent(""); toast.success("Dikosongkan"); };
  const format = () => {
    try {
      const opts = { indent_size: 2, wrap_line_length: 100 };
      const out = tab === "html" ? html_beautify(current, opts) : tab === "css" ? css_beautify(current, opts) : js_beautify(current, opts);
      setCurrent(out);
      toast.success("Kode diformat");
    } catch (e: any) { toast.error(`Format gagal: ${e.message}`); }
  };
  const download = () => {
    try {
      const full = wrapDocument(local);
      const blob = new Blob([full], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "page.html";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("HTML diunduh");
    } catch { toast.error("Gagal mengunduh"); }
  };
  const upload = async (file: File) => {
    try {
      const text = await file.text();
      // naive extract of <style> and <script>
      const cssMatch = text.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      const jsMatch = text.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const htmlPart = bodyMatch ? bodyMatch[1] : text;
      setLocal({
        html: htmlPart.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<script[\s\S]*?<\/script>/gi, "").trim(),
        css: cssMatch?.[1]?.trim() ?? "",
        js: jsMatch?.[1]?.trim() ?? "",
      });
      toast.success(`Diunggah: ${file.name}`);
    } catch { toast.error("Gagal membaca file"); }
  };

  const apply = () => {
    onApply(local);
    onOpenChange(false);
    toast.success("Source diterapkan ke visual editor");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Source Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={copy}><Copy className="h-4 w-4 mr-1" />Copy</Button>
          <Button size="sm" variant="outline" onClick={paste}><ClipboardPaste className="h-4 w-4 mr-1" />Paste</Button>
          <Button size="sm" variant="outline" onClick={clear}><Eraser className="h-4 w-4 mr-1" />Clear</Button>
          <Button size="sm" variant="outline" onClick={format}><Wand2 className="h-4 w-4 mr-1" />Format</Button>
          <Button size="sm" variant="outline" onClick={download}><Download className="h-4 w-4 mr-1" />Download</Button>
          <label className="inline-flex items-center gap-1 text-sm border rounded-md px-3 h-9 cursor-pointer hover:bg-muted">
            <Upload className="h-4 w-4" />Upload
            <input type="file" accept=".html,.htm,text/html" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.currentTarget.value = ""; }} />
          </label>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="css">CSS</TabsTrigger>
            <TabsTrigger value="js">JavaScript</TabsTrigger>
          </TabsList>
          <TabsContent value="html">
            <Textarea value={local.html} onChange={(e) => setLocal((l) => ({ ...l, html: e.target.value }))} className="font-mono text-xs min-h-[380px]" spellCheck={false} />
          </TabsContent>
          <TabsContent value="css">
            <Textarea value={local.css} onChange={(e) => setLocal((l) => ({ ...l, css: e.target.value }))} className="font-mono text-xs min-h-[380px]" spellCheck={false} />
          </TabsContent>
          <TabsContent value="js">
            <Textarea value={local.js} onChange={(e) => setLocal((l) => ({ ...l, js: e.target.value }))} className="font-mono text-xs min-h-[380px]" spellCheck={false} />
          </TabsContent>
        </Tabs>
        <p className="text-xs text-muted-foreground">
          Elemen tanpa marker <code>data-widget</code> akan dibungkus sebagai widget "Raw HTML" saat kembali ke Visual Editor.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={apply}><Save className="h-4 w-4 mr-1" />Terapkan ke Visual</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function wrapDocument(b: SourceBundle): string {
  return `<!doctype html>
<html lang="id">
<head><meta charset="utf-8" /><title>Page</title>
<style>${b.css}</style></head>
<body>${b.html}
<script>${b.js}<\/script>
</body></html>`;
}
