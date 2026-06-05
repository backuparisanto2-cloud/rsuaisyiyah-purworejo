import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type About = {
  title: string;
  subtitle: string;
  body: string;
  image_url: string | null;
  cta_label: string;
  cta_url: string;
};

const FALLBACK: About = {
  cta_label: "Selengkapnya",
  cta_url: "#layanan",
  title: "Keramahan Sebenarnya & Mutu Pelayanan Syariah",
  subtitle: "RSU Aisyiyah Purworejo",
  body: "RSU Aisyiyah Purworejo berdedikasi memberikan pelayanan kesehatan prima berbasis syariah dengan integritas tinggi, mengutamakan keselamatan pasien dan mewujudkan keramahan sebenarnya dalam setiap layanan, termasuk fasilitas ramah difabel.\n\nKami terus mengembangkan fasilitas berkualitas dan modern, menyediakan layanan spesialis dan subspesialis unggulan, ditunjang peralatan medis berteknologi terkini serta layanan penunjang diagnostik mutakhir.",
  image_url: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=900&q=70",
};

export default function TentangSection() {
  const [data, setData] = useState<About>(FALLBACK);

  useEffect(() => {
    const load = async () => {
      const { data: row } = await supabase
        .from("about_page")
        .select("title,subtitle,body,image_url,cta_label,cta_url")
        .maybeSingle();
      if (row) setData({ ...FALLBACK, ...row });
    };
    load();
    const channel = supabase
      .channel("about_page_public")
      .on("postgres_changes", { event: "*", schema: "public", table: "about_page" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <section id="tentang" className="py-20 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] bg-muted">
          {data.image_url && (
            <img src={data.image_url} alt={data.subtitle || "Tentang Kami"} className="w-full h-full object-cover" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold tracking-widest text-secondary uppercase">Tentang Kami</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-primary">{data.title}</h2>
          {data.subtitle && (
            <h3 className="mt-3 text-lg font-semibold text-muted-foreground">{data.subtitle}</h3>
          )}
          {data.body.split(/\n\n+/).map((p, i) => (
            <p key={i} className="mt-4 text-muted-foreground leading-relaxed whitespace-pre-line">{p}</p>
          ))}
          {data.cta_url && (
            <a
              href={data.cta_url}
              {...(/^https?:\/\//i.test(data.cta_url) ? { target: "_blank", rel: "noreferrer" } : {})}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary-dark transition-colors"
            >
              {data.cta_label || "Selengkapnya"} <ChevronRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
