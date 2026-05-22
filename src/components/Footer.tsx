import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo-hero.png";

type Contact = {
  whatsapp: string;
  instagram: string;
  footer_text: string;
};

const FALLBACK: Contact = {
  whatsapp: "6289646710859",
  instagram: "https://www.instagram.com/rsu_aisyiyah?igsh=MTg0NnhndWs4Ynpl",
  footer_text: "Keramahan Sebenarnya",
};

function waLink(no: string) {
  const d = no.replace(/\D/g, "");
  return d ? `https://wa.me/${d}` : "#";
}
function waDisplay(no: string) {
  const d = no.replace(/\D/g, "");
  if (!d) return "";
  const local = d.startsWith("62") ? "0" + d.slice(2) : d;
  return local.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
}

export default function Footer() {
  const [c, setC] = useState<Contact>(FALLBACK);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("contact_settings")
        .select("whatsapp,instagram,footer_text")
        .maybeSingle();
      if (data) setC({ ...FALLBACK, ...data });
    };
    load();
    const channel = supabase
      .channel("contact_footer_public")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_settings" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <footer className="bg-primary-dark text-primary-foreground py-12 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-14 w-14" />
            <div>
              <div className="font-bold">RSU Aisyiyah</div>
              <div className="text-sm opacity-80">Purworejo</div>
            </div>
          </div>
          {c.footer_text && (
            <p className="mt-4 text-sm opacity-80 font-script text-gold text-xl">{c.footer_text}</p>
          )}
        </div>
        <div>
          <h4 className="font-bold mb-3">Tautan Cepat</h4>
          <ul className="space-y-2 text-sm opacity-90">
            <li><a href="#tentang" className="hover:text-gold">Tentang Kami</a></li>
            <li><a href="#layanan" className="hover:text-gold">Layanan</a></li>
            <li><a href="#faq" className="hover:text-gold">FAQ</a></li>
            <li><a href="#kontak" className="hover:text-gold">Kontak</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-3">Hubungi Kami</h4>
          <ul className="space-y-2 text-sm opacity-90">
            {c.whatsapp && (
              <li>WhatsApp: <a className="text-gold" href={waLink(c.whatsapp)}>{waDisplay(c.whatsapp)}</a></li>
            )}
            {c.instagram && (
              <li>Instagram: <a className="text-gold" target="_blank" rel="noreferrer" href={c.instagram}>@rsu_aisyiyah</a></li>
            )}
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/10 text-xs opacity-70 text-center">
        © {new Date().getFullYear()} RSU Aisyiyah Purworejo. All rights reserved.
      </div>
    </footer>
  );
}
