import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ServiceIcon } from "@/lib/service-icons";

type Service = { id: string; title: string; icon: string; content: string };

const FALLBACK: Service[] = [
  { id: "f1", title: "Layanan Poli", icon: "Stethoscope", content: "Pelayanan poliklinik spesialis dan subspesialis." },
  { id: "f2", title: "Layanan Rawat Inap", icon: "Bed", content: "Fasilitas rawat inap dengan berbagai kelas." },
  { id: "f3", title: "Layanan Gawat Darurat", icon: "HeartPulse", content: "IGD 24 jam dengan tenaga medis siaga." },
];

export default function LayananSection() {
  const [items, setItems] = useState<Service[]>(FALLBACK);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("services")
        .select("id,title,icon,content")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (data && data.length) setItems(data);
    };
    load();
    const channel = supabase
      .channel("services_public")
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <section id="layanan" className="py-20 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-sm font-semibold tracking-widest text-secondary uppercase">Layanan Kami</p>
        <h2 className="mt-2 text-2xl md:text-3xl font-bold text-center text-primary">
          Pelayanan Unggulan RSU Aisyiyah Purworejo
        </h2>
        <p className="text-center text-muted-foreground mt-2 text-sm">
          Berbagai layanan kesehatan dengan standar mutu prima berbasis syariah
        </p>
        <Accordion type="single" collapsible className="mt-10 space-y-3">
          {items.map((l) => (
            <AccordionItem key={l.id} value={l.id} className="bg-muted/30 rounded-xl border px-5 shadow-sm">
              <AccordionTrigger className="text-left font-semibold text-primary hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ServiceIcon name={l.icon} className="h-5 w-5" />
                  </div>
                  <span className="text-base">{l.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pl-[52px] whitespace-pre-line">
                {l.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
