import { useEffect, useState } from "react";
import { MapPin, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Contact = {
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  map_embed_url: string;
};

const FALLBACK: Contact = {
  address: "Jl. Jend. Sudirman No. 12, Purworejo, Jawa Tengah",
  phone: "",
  whatsapp: "6289646710859",
  email: "info@rspkukaranganyar.id",
  instagram: "https://www.instagram.com/rsu_aisyiyah?igsh=MTg0NnhndWs4Ynpl",
  map_embed_url: "https://www.google.com/maps?q=RSU+Aisyiyah+Purworejo&output=embed",
};

function waLink(no: string) {
  const digits = no.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
}
function waDisplay(no: string) {
  const d = no.replace(/\D/g, "");
  if (!d) return "";
  // 6289646710859 -> 0896-4671-0859 best-effort
  const local = d.startsWith("62") ? "0" + d.slice(2) : d;
  return local.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
}

export default function KontakSection() {
  const [c, setC] = useState<Contact>(FALLBACK);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("contact_settings")
        .select("address,phone,whatsapp,email,instagram,map_embed_url")
        .maybeSingle();
      if (data) setC({ ...FALLBACK, ...data });
    };
    load();
    const channel = supabase
      .channel("contact_public")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_settings" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <section id="kontak" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-primary">LOKASI & KONTAK KAMI</h2>
        <div className="mt-10 grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl overflow-hidden border shadow-lg aspect-video bg-muted">
            {c.map_embed_url && (
              <iframe title="Lokasi RS" src={c.map_embed_url} className="w-full h-full border-0" loading="lazy" />
            )}
          </div>
          <div className="space-y-5">
            {c.address && (
              <div className="flex gap-4">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><MapPin className="h-5 w-5" /></div>
                <div>
                  <div className="font-bold">Alamat</div>
                  <p className="text-muted-foreground text-sm">{c.address}</p>
                </div>
              </div>
            )}
            {c.phone && (
              <div className="flex gap-4">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Phone className="h-5 w-5" /></div>
                <div>
                  <div className="font-bold">Telepon</div>
                  <a href={`tel:${c.phone.replace(/\s+/g, "")}`} className="text-secondary font-semibold hover:underline">{c.phone}</a>
                </div>
              </div>
            )}
            {c.whatsapp && (
              <div className="flex gap-4">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Phone className="h-5 w-5" /></div>
                <div>
                  <div className="font-bold">WhatsApp CS</div>
                  <a href={waLink(c.whatsapp)} className="text-secondary font-semibold hover:underline">{waDisplay(c.whatsapp)}</a>
                </div>
              </div>
            )}
            {(c.email || c.instagram) && (
              <div className="flex gap-4">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Mail className="h-5 w-5" /></div>
                <div>
                  <div className="font-bold">Email & Sosial Media</div>
                  {c.email && <p className="text-muted-foreground text-sm">{c.email}</p>}
                  {c.instagram && (
                    <a href={c.instagram} target="_blank" rel="noreferrer" className="text-secondary text-sm font-semibold hover:underline">@rsu_aisyiyah</a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
