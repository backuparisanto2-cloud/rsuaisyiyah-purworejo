import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Instagram,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import {
  extractShortcode,
  isValidShortcode,
  buildPermalink,
  buildThumbnail,
  buildEmbedCode,
  extractCaptionFromEmbed,
  normalizeCaption,
} from "@/lib/instagram-utils";

export const Route = createFileRoute("/administrator/instagram")({
  component: InstagramAdmin,
});

type Row = {
  id: string;
  shortcode: string;
  permalink: string;
  caption: string;
  display_order: number;
  is_active: boolean;
};

function InstagramAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [input, setInput] = useState("");
  const [caption, setCaption] = useState("");
  const [captionTouched, setCaptionTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("instagram_posts")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data as Row[]) ?? []);
  }
  useEffect(() => {
    void load();
  }, []);

  const previewShortcode = extractShortcode(input);
  const valid = isValidShortcode(previewShortcode);

  // Auto-fill caption from pasted embed snippet (only if user hasn't typed one).
  useEffect(() => {
    if (captionTouched) return;
    const c = extractCaptionFromEmbed(input);
    if (c) setCaption(c);
  }, [input, captionTouched]);

  const embedCode = useMemo(
    () => (valid ? buildEmbedCode(previewShortcode!, normalizeCaption(caption, 120)) : ""),
    [valid, previewShortcode, caption],
  );

  async function copyEmbed() {
    if (!embedCode) return;
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      toast.success("Kode embed disalin");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Gagal menyalin");
    }
  }

  async function add() {
    if (!valid) {
      toast.error("URL/embed Instagram tidak valid");
      return;
    }
    setBusy(true);
    const nextOrder = (rows[rows.length - 1]?.display_order ?? 0) + 1;
    const { error } = await supabase.from("instagram_posts").insert({
      shortcode: previewShortcode!,
      permalink: buildPermalink(previewShortcode!),
      caption: normalizeCaption(caption),
      display_order: nextOrder,
      is_active: true,
    });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("duplicate") ? "Post sudah ada" : error.message,
      );
      return;
    }
    setInput("");
    setCaption("");
    setCaptionTouched(false);
    toast.success("Post ditambahkan");
    void load();
  }

  async function update(r: Row, patch: Partial<Row>) {
    const { error } = await supabase
      .from("instagram_posts")
      .update(patch)
      .eq("id", r.id);
    if (error) toast.error(error.message);
    else void load();
  }

  async function remove(r: Row) {
    if (!confirm("Hapus post ini?")) return;
    const { error } = await supabase.from("instagram_posts").delete().eq("id", r.id);
    if (error) toast.error(error.message);
    else void load();
  }

  async function move(r: Row, dir: -1 | 1) {
    const i = rows.findIndex((x) => x.id === r.id);
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const other = rows[j];
    await Promise.all([
      supabase
        .from("instagram_posts")
        .update({ display_order: other.display_order })
        .eq("id", r.id),
      supabase
        .from("instagram_posts")
        .update({ display_order: r.display_order })
        .eq("id", other.id),
    ]);
    void load();
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Instagram className="w-6 h-6" /> Berita & Info Terkini (Instagram)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cukup tempel URL Instagram apa pun — mis.{" "}
          <code className="text-xs">
            https://www.instagram.com/rsu_aisyiyah/p/DYWECk0k0ud/
          </code>{" "}
          — sistem akan otomatis mengekstrak shortcode, membuat thumbnail, dan
          membangkitkan kode embed Instagram desktop resmi.
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <label className="text-sm font-semibold">Tambah Post</label>
        <Textarea
          placeholder="Tempel URL post Instagram, reel, atau seluruh kode <blockquote class='instagram-media' ...>"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
        />
        <Input
          placeholder="Caption singkat (opsional — terisi otomatis dari embed)"
          value={caption}
          onChange={(e) => {
            setCaption(e.target.value);
            setCaptionTouched(true);
          }}
        />

        <div className="grid md:grid-cols-2 gap-4 items-start">
          <div>
            <div className="text-xs text-muted-foreground mb-2">Preview thumbnail</div>
            <div className="aspect-square w-full max-w-xs rounded-2xl overflow-hidden bg-muted relative border">
              {valid ? (
                <img
                  src={buildThumbnail(previewShortcode!)}
                  alt="preview"
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground text-center px-3">
                  {input
                    ? "URL Instagram tidak dikenali"
                    : "Preview muncul setelah link/embed valid ditempel"}
                </div>
              )}
            </div>
            {valid && (
              <div className="text-xs text-muted-foreground mt-2 font-mono break-all">
                shortcode: {previewShortcode}
                <br />
                permalink: {buildPermalink(previewShortcode!)}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Kode embed Instagram resmi
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={copyEmbed}
                disabled={!embedCode}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 mr-1" /> Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" /> Salin
                  </>
                )}
              </Button>
            </div>
            <Textarea
              readOnly
              value={embedCode}
              rows={8}
              className="font-mono text-[11px]"
              placeholder="Kode embed akan muncul setelah URL valid ditempel"
            />
            <div className="flex justify-end">
              <Button onClick={add} disabled={!valid || busy}>
                <Plus className="w-4 h-4 mr-1" /> Tambah Post
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="font-semibold mb-3">Daftar Post ({rows.length})</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada post.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rows.map((r, i) => (
              <Card key={r.id} className="overflow-hidden">
                <div className="relative aspect-square bg-muted">
                  <img
                    src={buildThumbnail(r.shortcode)}
                    alt={r.caption}
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {!r.is_active && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-semibold">
                      NONAKTIF
                    </div>
                  )}
                </div>
                <div className="p-2 space-y-2">
                  <div className="text-[11px] text-muted-foreground font-mono truncate">
                    {r.shortcode}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={r.is_active}
                        onCheckedChange={(v) => update(r, { is_active: v })}
                      />
                      <a
                        href={r.permalink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-primary"
                        title="Buka post"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => move(r, -1)}
                        disabled={i === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => move(r, 1)}
                        disabled={i === rows.length - 1}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(r)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
