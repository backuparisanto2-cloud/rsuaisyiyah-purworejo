import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Item = { id: string; label: string; time_range: string };

const FALLBACK: Item[] = [
  { id: "f1", label: "SIANG", time_range: "11.00 – 13.30 WIB" },
  { id: "f2", label: "SORE", time_range: "17.00 – 19.00 WIB" },
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
    <section className="py-16 px-6 bg-primary text-primary-foreground">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold">JAM BESUK RESMI</h2>
        <p className="mt-1 text-sm opacity-80">RSU Aisyiyah Purworejo</p>
        <div className={`mt-8 grid gap-6 ${items.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {items.map((it) => (
            <div key={it.id} className="rounded-2xl bg-white/10 backdrop-blur p-8 border border-white/15">
              <Clock className="h-10 w-10 mx-auto text-gold" />
              <div className="mt-3 text-xl font-bold">{it.label}</div>
              <div className="mt-1 text-2xl font-script text-gold">{it.time_range}</div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm opacity-80 max-w-xl mx-auto">
          Demi kenyamanan dan kesembuhan pasien, mohon pengunjung mematuhi peraturan jam besuk resmi yang berlaku.
        </p>
      </div>
    </section>
  );
}
