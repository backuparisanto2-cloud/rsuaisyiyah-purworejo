import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/administrator/kontak")({ component: KontakAdmin });

type Contact = {
  id: string; address: string; phone: string; whatsapp: string; email: string;
  instagram: string; map_embed_url: string; footer_text: string;
};

function KontakAdmin() {
  const [data, setData] = useState<Contact | null>(null);

  useEffect(() => {
    supabase.from("contact_settings").select("*").eq("singleton", true).maybeSingle()
      .then(({ data, error }) => { if (error) toast.error(error.message); setData(data as Contact); });
  }, []);

  async function save() {
    if (!data) return;
    const { error } = await supabase.from("contact_settings").update({
      address: data.address, phone: data.phone, whatsapp: data.whatsapp, email: data.email,
      instagram: data.instagram, map_embed_url: data.map_embed_url, footer_text: data.footer_text,
    }).eq("id", data.id);
    if (error) toast.error(error.message); else toast.success("Tersimpan");
  }

  if (!data) return <p className="text-muted-foreground">Memuat...</p>;

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Kontak / Footer</h1>
      <div><Label>Alamat</Label><Textarea rows={2} value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Telepon</Label><Input value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} /></div>
        <div><Label>WhatsApp (no. internasional)</Label><Input value={data.whatsapp} onChange={(e) => setData({ ...data, whatsapp: e.target.value })} placeholder="6289..." /></div>
        <div><Label>Email</Label><Input value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} /></div>
        <div><Label>Instagram</Label><Input value={data.instagram} onChange={(e) => setData({ ...data, instagram: e.target.value })} placeholder="@username" /></div>
      </div>
      <div><Label>Map Embed URL</Label><Input value={data.map_embed_url} onChange={(e) => setData({ ...data, map_embed_url: e.target.value })} /></div>
      <div><Label>Teks Footer</Label><Textarea rows={2} value={data.footer_text} onChange={(e) => setData({ ...data, footer_text: e.target.value })} /></div>
      <Button onClick={save}>Simpan</Button>
    </div>
  );
}
