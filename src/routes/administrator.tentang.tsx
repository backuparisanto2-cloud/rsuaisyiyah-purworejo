import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/admin/ImageUpload";
import { toast } from "sonner";

export const Route = createFileRoute("/administrator/tentang")({ component: TentangAdmin });

type About = { id: string; title: string; subtitle: string; body: string; image_url: string | null; cta_label: string; cta_url: string };

function TentangAdmin() {
  const [data, setData] = useState<About | null>(null);

  useEffect(() => {
    supabase.from("about_page").select("*").eq("singleton", true).maybeSingle()
      .then(({ data, error }) => { if (error) toast.error(error.message); setData(data as About); });
  }, []);

  async function save() {
    if (!data) return;
    const { error } = await supabase.from("about_page").update({
      title: data.title, subtitle: data.subtitle, body: data.body, image_url: data.image_url,
      cta_label: data.cta_label, cta_url: data.cta_url,
    }).eq("id", data.id);
    if (error) toast.error(error.message); else toast.success("Tersimpan");
  }

  if (!data) return <p className="text-muted-foreground">Memuat...</p>;

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Tentang</h1>
      <div><Label>Sub-judul (label kecil)</Label><Input value={data.subtitle} onChange={(e) => setData({ ...data, subtitle: e.target.value })} /></div>
      <div><Label>Judul utama</Label><Input value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} /></div>
      <div><Label>Isi</Label><Textarea rows={8} value={data.body} onChange={(e) => setData({ ...data, body: e.target.value })} /></div>
      <div><Label>Gambar</Label><ImageUpload value={data.image_url} onChange={(url) => setData({ ...data, image_url: url })} folder="about" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Teks tombol "Selengkapnya"</Label>
          <Input value={data.cta_label ?? ""} onChange={(e) => setData({ ...data, cta_label: e.target.value })} placeholder="Selengkapnya" />
        </div>
        <div>
          <Label>Link tombol</Label>
          <Input value={data.cta_url ?? ""} onChange={(e) => setData({ ...data, cta_url: e.target.value })} placeholder="#layanan atau https://..." />
          <p className="text-xs text-muted-foreground mt-1">Gunakan #id-section untuk scroll dalam halaman, atau URL lengkap untuk link eksternal.</p>
        </div>
      </div>
      <Button onClick={save}>Simpan</Button>
    </div>
  );
}
