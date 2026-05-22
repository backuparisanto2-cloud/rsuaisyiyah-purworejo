import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

type Faq = { id: string; question: string; answer: string };

const FALLBACK: Faq[] = [
  { id: "f1", question: "Di mana lokasi RSU Aisyiyah Purworejo?", answer: "Jl. Jend. Sudirman No. 12, Purworejo, Jawa Tengah." },
  { id: "f2", question: "Jam operasional IGD?", answer: "IGD buka 24 jam setiap hari, termasuk hari libur." },
];

export default function FaqSection() {
  const [items, setItems] = useState<Faq[]>(FALLBACK);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("faqs")
        .select("id,question,answer")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (data && data.length) setItems(data);
    };
    load();
    const channel = supabase
      .channel("faqs_public")
      .on("postgres_changes", { event: "*", schema: "public", table: "faqs" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <section id="faq" className="py-20 px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-sm font-semibold tracking-widest text-secondary uppercase">FAQ</p>
        <h2 className="mt-2 text-2xl md:text-3xl font-bold text-center text-primary">
          Pertanyaan yang Sering Diajukan
        </h2>
        <p className="text-center text-muted-foreground mt-2 text-sm">
          Informasi seputar layanan RSU Aisyiyah Purworejo
        </p>
        <Accordion type="single" collapsible className="mt-10 space-y-3">
          {items.map((f) => (
            <AccordionItem key={f.id} value={f.id} className="bg-white rounded-xl border px-5 shadow-sm">
              <AccordionTrigger className="text-left font-semibold text-primary hover:no-underline">
                {f.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {f.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
