import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Item = { id: string; label: string; time_range: string };

const FALLBACK: Item[] = [
  { id: "f1", label: "SIANG", time_range: "10.00 – 13.00 WIB" },
  { id: "f2", label: "SORE", time_range: "16.00 – 18.00 WIB" },
];

export default function JamBesukSection() {
  const [items, setItems] = useState<Item[]>(FALLBACK);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("visiting_hours")
        .select("id,label,time_range")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (data && data.length) setItems(data);
    };
    load();
    const channel = supabase
      .channel("visiting_hours_public")
      .on("postgres_changes", { event: "*", schema: "public", table: "visiting_hours" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-primary">JAM BESUK RESMI</h2>
        <p className="mt-1 text-sm text-muted-foreground">RSU Aisyiyah Purworejo</p>
        <div className={`mt-8 grid gap-6 ${items.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {items.map((it) => {
            const isSiangSore = /siang|sore/i.test(it.label);
            return (
              <div
                key={it.id}
                className={`rounded-2xl p-8 border shadow-[0_10px_30px_-15px_rgba(11,37,69,0.25)] hover:shadow-[0_15px_40px_-15px_rgba(11,37,69,0.35)] transition-shadow ${
                  isSiangSore
                    ? "bg-secondary border-secondary/30 text-secondary-foreground"
                    : "bg-white border-primary/15"
                }`}
              >
                <div className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center ${isSiangSore ? "bg-white/20" : "bg-gold/15"}`}>
                  <Clock className={`h-8 w-8 ${isSiangSore ? "text-white" : "text-gold"}`} />
                </div>
                <div className={`mt-3 text-xl font-bold ${isSiangSore ? "text-white" : "text-primary-dark"}`}>{it.label}</div>
                <div className={`mt-1 text-2xl font-serif font-semibold tracking-wide ${isSiangSore ? "text-white/95" : "text-primary"}`}>{it.time_range}</div>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-sm text-muted-foreground max-w-xl mx-auto">
          Demi kenyamanan dan kesembuhan pasien, mohon pengunjung mematuhi peraturan jam besuk resmi yang berlaku.
        </p>
      </div>
    </section>
  );
}
