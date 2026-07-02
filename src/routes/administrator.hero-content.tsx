import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import ImageUpload from "@/components/admin/ImageUpload";
import { toast } from "sonner";
import { Save, Loader2, RotateCcw } from "lucide-react";

const DEFAULT_OVERLAY_COLOR = "#0b2545";
const DEFAULT_OVERLAY_OPACITY = 30;

export const Route = createFileRoute("/administrator/hero-content")({ component: HeroContentAdmin });

const SMART_FONT_MAP: Record<string, string> = {
  sans: "'Inter', ui-sans-serif, system-ui, sans-serif",
  serif: "'Playfair Display', Georgia, serif",
  script: "'Great Vibes', 'Dancing Script', cursive",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
  display: "'Bebas Neue', Impact, sans-serif",
};

type HeroContent = {
  id: string;
  logo_url: string | null;
  title_line1: string;
  title_line2: string;
  tagline: string;
  cta_text: string;
  badge1: string;
  badge2: string;
  overlay_color: string;
  overlay_opacity: number;
  smart_word: string;
  smart_desc: string;
  smart_color: string;
  smart_desc_color: string;
  smart_font_family: string;
  smart_font_size: number;
  smart_bg_opacity: number;
  pendaftaran_wa_number: string;
  pendaftaran_wa_prolog: string;
};

function HeroContentAdmin() {
  const [data, setData] = useState<HeroContent | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("hero_content").select("*").eq("singleton", true).maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setData(data as HeroContent);
      });
  }, []);

  async function save() {
    if (!data) return;
    setSaving(true);
    const { error } = await supabase.from("hero_content").update({
      logo_url: data.logo_url,
      title_line1: data.title_line1,
      title_line2: data.title_line2,
      tagline: data.tagline,
      cta_text: data.cta_text,
      badge1: data.badge1,
      badge2: data.badge2,
      overlay_color: data.overlay_color,
      overlay_opacity: data.overlay_opacity,
      smart_word: data.smart_word,
      smart_desc: data.smart_desc,
      smart_color: data.smart_color,
      smart_desc_color: data.smart_desc_color,
      smart_font_family: data.smart_font_family,
      smart_font_size: data.smart_font_size,
      pendaftaran_wa_number: (data.pendaftaran_wa_number || "").replace(/[^0-9]/g, ""),
      pendaftaran_wa_prolog: data.pendaftaran_wa_prolog,
    }).eq("id", data.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Hero section tersimpan");
  }

  if (!data) return <p className="text-muted-foreground">Memuat...</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hero Section</h1>
        <p className="text-sm text-muted-foreground">Edit logo, judul, tagline, tombol, dan badge yang tampil di hero.</p>
      </div>

      <Card className="p-4 space-y-4">
        <h2 className="font-semibold">Logo</h2>
        <ImageUpload
          value={data.logo_url}
          onChange={(url) => setData({ ...data, logo_url: url })}
          folder="hero"
        />
        <p className="text-xs text-muted-foreground">Disarankan PNG transparan, rasio 1:1. Kosongkan untuk pakai logo bawaan.</p>
      </Card>

      <Card className="p-4 space-y-4">
        <h2 className="font-semibold">Teks</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Judul baris 1</Label>
            <Input value={data.title_line1} onChange={(e) => setData({ ...data, title_line1: e.target.value })} />
          </div>
          <div>
            <Label>Judul baris 2 (warna emas)</Label>
            <Input value={data.title_line2} onChange={(e) => setData({ ...data, title_line2: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Tagline (skrip emas)</Label>
          <Input value={data.tagline} onChange={(e) => setData({ ...data, tagline: e.target.value })} />
        </div>
        <div>
          <Label>Teks tombol CTA</Label>
          <Input value={data.cta_text} onChange={(e) => setData({ ...data, cta_text: e.target.value })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Badge 1</Label>
            <Input value={data.badge1} onChange={(e) => setData({ ...data, badge1: e.target.value })} />
          </div>
          <div>
            <Label>Badge 2</Label>
            <Input value={data.badge2} onChange={(e) => setData({ ...data, badge2: e.target.value })} />
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Overlay Hero</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setData({
              ...data,
              overlay_color: DEFAULT_OVERLAY_COLOR,
              overlay_opacity: DEFAULT_OVERLAY_OPACITY,
            })}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset default
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Warna overlay</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <input
                type="color"
                value={data.overlay_color}
                onChange={(e) => setData({ ...data, overlay_color: e.target.value })}
                className="h-10 w-14 rounded border bg-transparent cursor-pointer shrink-0"
              />
              <Input
                value={data.overlay_color}
                onChange={(e) => setData({ ...data, overlay_color: e.target.value })}
                placeholder="#0b2545"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Opacity overlay</Label>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted">{data.overlay_opacity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={data.overlay_opacity}
              onChange={(e) => setData({ ...data, overlay_opacity: Number(e.target.value) })}
              className="w-full mt-2 accent-primary"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Overlay diaplikasikan di atas video/slider hero untuk meningkatkan kontras teks.</p>
      </Card>

      <Card className="p-4 space-y-4">
        <h2 className="font-semibold">Teks SMART (badge Hero)</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Kata utama</Label>
            <Input value={data.smart_word} onChange={(e) => setData({ ...data, smart_word: e.target.value })} placeholder="SMART" />
          </div>
          <div>
            <Label>Deskripsi</Label>
            <Input value={data.smart_desc} onChange={(e) => setData({ ...data, smart_desc: e.target.value })} placeholder="— Sehat · Mutu · Amanah · Ramah · Terampil" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Warna kata utama</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <input type="color" value={data.smart_color} onChange={(e) => setData({ ...data, smart_color: e.target.value })} className="h-10 w-14 rounded border bg-transparent cursor-pointer shrink-0" />
              <Input value={data.smart_color} onChange={(e) => setData({ ...data, smart_color: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Warna deskripsi</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <input type="color" value={data.smart_desc_color} onChange={(e) => setData({ ...data, smart_desc_color: e.target.value })} className="h-10 w-14 rounded border bg-transparent cursor-pointer shrink-0" />
              <Input value={data.smart_desc_color} onChange={(e) => setData({ ...data, smart_desc_color: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Jenis font</Label>
            <select
              value={data.smart_font_family}
              onChange={(e) => setData({ ...data, smart_font_family: e.target.value })}
              className="w-full mt-1.5 h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="sans">Sans (Inter)</option>
              <option value="serif">Serif (Playfair)</option>
              <option value="script">Script (Great Vibes)</option>
              <option value="mono">Monospace</option>
              <option value="display">Display (Bebas Neue)</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Ukuran font</Label>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted">{data.smart_font_size}px</span>
            </div>
            <input
              type="range"
              min={12}
              max={48}
              step={1}
              value={data.smart_font_size}
              onChange={(e) => setData({ ...data, smart_font_size: Number(e.target.value) })}
              className="w-full mt-2 accent-primary"
            />
          </div>
        </div>
        <div className="rounded-lg bg-primary-dark p-4 text-center">
          <span
            className="inline-flex items-center flex-wrap justify-center gap-2 px-5 py-2.5 rounded-full bg-black/40 border border-white/25 font-bold [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]"
            style={{
              fontFamily: SMART_FONT_MAP[data.smart_font_family] || SMART_FONT_MAP.sans,
              fontSize: `${data.smart_font_size}px`,
              lineHeight: 1.2,
            }}
          >
            <span style={{ color: data.smart_color }}>{data.smart_word}</span>
            <span style={{ color: data.smart_desc_color, opacity: 0.95 }}>{data.smart_desc}</span>
          </span>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <h2 className="font-semibold">Tombol Pendaftaran Online (WhatsApp)</h2>
        <div>
          <Label>Nomor WhatsApp tujuan</Label>
          <Input
            value={data.pendaftaran_wa_number}
            onChange={(e) => setData({ ...data, pendaftaran_wa_number: e.target.value })}
            placeholder="6289646710859"
            inputMode="numeric"
          />
          <p className="text-xs text-muted-foreground mt-1">Format internasional tanpa "+". Contoh: 6289646710859.</p>
        </div>
        <div>
          <Label>Prolog pesan WhatsApp</Label>
          <textarea
            value={data.pendaftaran_wa_prolog}
            onChange={(e) => setData({ ...data, pendaftaran_wa_prolog: e.target.value })}
            placeholder="Hi RSU AISYIYAH Purworejo, saya ingin mendaftar."
            className="w-full mt-1.5 min-h-20 rounded-md border bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">Kalimat pembuka sebelum data pendaftaran dikirim ke CS.</p>
        </div>
      </Card>

      <Card className="relative overflow-hidden p-6 bg-primary-dark text-primary-foreground text-center space-y-3">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: data.overlay_color, opacity: data.overlay_opacity / 100 }}
        />
        <div className="relative z-10 space-y-3">
        <div className="text-xs uppercase tracking-wider opacity-70">Pratinjau</div>
        {data.logo_url && <img src={data.logo_url} alt="Logo" className="h-20 w-20 mx-auto rounded-full object-contain" />}
        <h3 className="text-2xl font-bold">{data.title_line1}<br /><span className="text-gold">{data.title_line2}</span></h3>
        <div className="flex justify-center">
          <span
            className="inline-flex items-center flex-wrap justify-center gap-2 px-5 py-2.5 rounded-full bg-black/40 border border-white/25 font-bold [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]"
            style={{
              fontFamily: SMART_FONT_MAP[data.smart_font_family] || SMART_FONT_MAP.sans,
              fontSize: `${data.smart_font_size}px`,
              lineHeight: 1.2,
            }}
          >
            <span style={{ color: data.smart_color }}>{data.smart_word}</span>
            <span style={{ color: data.smart_desc_color, opacity: 0.95 }}>{data.smart_desc}</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="px-4 py-2 rounded-full bg-gold text-primary-dark font-bold text-sm">{data.cta_text}</span>
          <span className="px-3 py-1.5 rounded-full bg-gold/20 border border-gold/40 text-xs font-semibold">{data.badge1}</span>
          <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold">{data.badge2}</span>
        </div>
        </div>
      </Card>

      <Button onClick={save} disabled={saving} data-tour="hero-content-save">
        {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
        Simpan
      </Button>
    </div>
  );
}
