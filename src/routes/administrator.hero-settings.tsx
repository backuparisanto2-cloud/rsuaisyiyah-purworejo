import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/administrator/hero-settings")({
  component: HeroSettingsPage,
});

type S = {
  id: string;
  autoplay_interval: number;
  autoplay: boolean;
  loop: boolean;
  show_arrows: boolean;
  show_dots: boolean;
  transition_effect: string;
};

function HeroSettingsPage() {
  const [s, setS] = useState<S | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("hero_settings").select("*").limit(1).maybeSingle().then(({ data, error }) => {
      if (error) toast.error(error.message);
      setS(data as S);
    });
  }, []);

  async function save() {
    if (!s) return;
    setSaving(true);
    const { error } = await supabase.from("hero_settings").update({
      autoplay_interval: s.autoplay_interval,
      autoplay: s.autoplay,
      loop: s.loop,
      show_arrows: s.show_arrows,
      show_dots: s.show_dots,
      transition_effect: s.transition_effect,
    }).eq("id", s.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Tersimpan");
  }

  if (!s) return <p className="text-muted-foreground">Memuat...</p>;

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-2xl font-bold">Pengaturan Slider</h1>
      <Card className="p-4 space-y-4">
        <div>
          <Label>Interval autoplay (detik, 2–15)</Label>
          <Input type="number" min={2} max={15} value={s.autoplay_interval}
            onChange={(e) => setS({ ...s, autoplay_interval: Math.max(2, Math.min(15, Number(e.target.value) || 5)) })} />
        </div>
        <div>
          <Label>Efek transisi</Label>
          <Select value={s.transition_effect} onValueChange={(v) => setS({ ...s, transition_effect: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="slide">Slide</SelectItem>
              <SelectItem value="fade">Fade</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {[
          ["autoplay", "Autoplay"],
          ["loop", "Loop (ulangi terus)"],
          ["show_arrows", "Tampilkan panah"],
          ["show_dots", "Tampilkan dots"],
        ].map(([k, label]) => (
          <div key={k} className="flex items-center justify-between">
            <Label>{label}</Label>
            <Switch checked={(s as any)[k]} onCheckedChange={(v) => setS({ ...s, [k]: v } as S)} />
          </div>
        ))}
        <Button onClick={save} disabled={saving} data-tour="hero-settings-save">{saving ? "Menyimpan..." : "Simpan"}</Button>
      </Card>
    </div>
  );
}
