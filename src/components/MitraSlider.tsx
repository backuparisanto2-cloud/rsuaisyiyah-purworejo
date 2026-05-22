import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import bpjsKes from "@/assets/mitra-bpjs-kesehatan.png";
import bpjsTK from "@/assets/mitra-bpjs-tk.png";
import admedika from "@/assets/mitra-admedika.png";
import briLife from "@/assets/mitra-bri-life.png";
import jasaRaharja from "@/assets/mitra-jasa-raharja.png";
import kaiHealth from "@/assets/mitra-kai-healthcare.png";
import pkuGombong from "@/assets/mitra-rs-pku-gombong.png";
import aghisnaSidareja from "@/assets/mitra-rsu-aghisna-sidareja.png";
import pkuKroya from "@/assets/mitra-rs-pku-kroya.png";
import pkuSumpiuh from "@/assets/mitra-rsu-pku-sumpiuh.png";

type Mitra = { id: string; name: string; logo_url: string };

const FALLBACK: Mitra[] = [
  { name: "BPJS Kesehatan", logo_url: bpjsKes },
  { name: "BPJS Ketenagakerjaan", logo_url: bpjsTK },
  { name: "Admedika", logo_url: admedika },
  { name: "BRI Life", logo_url: briLife },
  { name: "Jasa Raharja", logo_url: jasaRaharja },
  { name: "KAI HealthCare", logo_url: kaiHealth },
  { name: "RS PKU Muhammadiyah Gombong", logo_url: pkuGombong },
  { name: "RSU Aghisna Medika Sidareja", logo_url: aghisnaSidareja },
  { name: "RS PKU Muhammadiyah Aghisna Kroya", logo_url: pkuKroya },
  { name: "RSU PKU Muhammadiyah Sumpiuh", logo_url: pkuSumpiuh },
].map((m, i) => ({ ...m, id: `f-${i}` }));

function Marquee({ items, reverse = false }: { items: Mitra[]; reverse?: boolean }) {
  const all = [...items, ...items];
  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex animate-marquee w-max items-center" style={reverse ? { animationDirection: "reverse" } : undefined}>
        {all.map((m, i) => (
          <div key={i} className="flex flex-col items-center justify-center mx-3 md:mx-5 shrink-1 min-w-0">
            <img src={m.logo_url} alt={m.name} loading="lazy" width={240} height={160}
              className="h-20 md:h-32 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300" />
            <p className="mt-2 text-[10px] md:text-xs font-medium text-center text-muted-foreground whitespace-nowrap">{m.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MitraSlider() {
  const [items, setItems] = useState<Mitra[]>(FALLBACK);

  useEffect(() => {
    let alive = true;
    const fetch = () => supabase.from("partners").select("id,name,logo_url").eq("is_active", true).order("display_order")
      .then(({ data }) => { if (alive && data && data.length > 0) setItems(data as Mitra[]); });
    void fetch();
    const ch = supabase.channel("partners_public")
      .on("postgres_changes", { event: "*", schema: "public", table: "partners" }, () => fetch()).subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, []);

  // Split: first half asuransi, second half holding (visual only)
  const mid = Math.ceil(items.length / 2);
  const a = items.slice(0, mid);
  const b = items.slice(mid);

  return (
    <section id="mitra" className="py-16 px-6 bg-white border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-sm font-semibold tracking-widest text-secondary uppercase">Mitra & Jaringan</p>
        <h2 className="mt-2 text-2xl md:text-3xl font-bold text-center text-primary">Bekerja Sama Dengan</h2>
      </div>
      <Marquee items={a} />
      {b.length > 0 && <div className="mt-8"><Marquee items={b} reverse /></div>}
    </section>
  );
}
