import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type RingkasanRow = {
  id: string;
  source_type: "custom_page" | "manual";
  custom_page_id: string | null;
  title: string;
  summary: string;
  image_url: string | null;
  image_position: "left" | "right" | "top" | "none";
  cta_label: string;
  cta_href: string;
  layout: "block" | "card";
  display_order: number;
  is_active: boolean;
};

type Row = RingkasanRow;

export default function RingkasanSection() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data } = await supabase
        .from("home_summary_sections")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (alive) setRows((data ?? []) as Row[]);
    };
    load();
    const ch = supabase
      .channel("home_summary_sections_public")
      .on("postgres_changes", { event: "*", schema: "public", table: "home_summary_sections" }, load)
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, []);

  if (rows.length === 0) return null;

  // Group consecutive 'card' items into a single grid section
  const groups: Array<{ kind: "block"; row: Row } | { kind: "cards"; rows: Row[] }> = [];
  for (const r of rows) {
    if (r.layout === "card") {
      const last = groups[groups.length - 1];
      if (last && last.kind === "cards") last.rows.push(r);
      else groups.push({ kind: "cards", rows: [r] });
    } else {
      groups.push({ kind: "block", row: r });
    }
  }

  return (
    <>
      {groups.map((g, gi) =>
        g.kind === "block" ? (
          <BlockItem key={`b-${gi}`} row={g.row} index={gi} />
        ) : (
          <CardGrid key={`c-${gi}`} rows={g.rows} />
        )
      )}
    </>
  );
}

function CtaButton({ label, href }: { label: string; href: string }) {
  if (!href) return null;
  const external = /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary-dark transition-colors text-sm"
    >
      {label || "Selengkapnya"} <ChevronRight className="h-4 w-4" />
    </a>
  );
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\n+/).map((p, i) => (
        <p key={i} className="mt-3 text-muted-foreground leading-relaxed whitespace-pre-line">{p}</p>
      ))}
    </>
  );
}

export function BlockItem({ row, index }: { row: Row; index: number }) {
  const bg = index % 2 === 1 ? "bg-muted/30" : "";
  const pos = row.image_position;
  const hasImage = !!row.image_url && pos !== "none";

  if (!hasImage) {
    return (
      <section className={`py-16 px-6 ${bg}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary">{row.title}</h2>
          <div className="mt-2"><Paragraphs text={row.summary} /></div>
          <div className="flex justify-center"><CtaButton label={row.cta_label} href={row.cta_href} /></div>
        </div>
      </section>
    );
  }

  if (pos === "top") {
    return (
      <section className={`py-16 px-6 ${bg}`}>
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden shadow-xl aspect-[16/9] bg-muted">
            <img src={row.image_url!} alt={row.title} className="w-full h-full object-cover" />
          </div>
          <div className="mt-6">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">{row.title}</h2>
            <Paragraphs text={row.summary} />
            <CtaButton label={row.cta_label} href={row.cta_href} />
          </div>
        </div>
      </section>
    );
  }

  // left or right
  const imageFirst = pos === "left";
  return (
    <section className={`py-16 px-6 ${bg}`}>
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        <div className={`rounded-2xl overflow-hidden shadow-xl aspect-[4/3] bg-muted ${imageFirst ? "md:order-1" : "md:order-2"}`}>
          <img src={row.image_url!} alt={row.title} className="w-full h-full object-cover" />
        </div>
        <div className={imageFirst ? "md:order-2" : "md:order-1"}>
          <h2 className="text-2xl md:text-3xl font-bold text-primary">{row.title}</h2>
          <Paragraphs text={row.summary} />
          <CtaButton label={row.cta_label} href={row.cta_href} />
        </div>
      </div>
    </section>
  );
}

export function CardGrid({ rows }: { rows: Row[] }) {
  return (
    <section className="py-16 px-6 bg-muted/20">
      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rows.map((r) => {
          const hasImage = !!r.image_url && r.image_position !== "none";
          return (
            <article key={r.id} className="bg-card rounded-2xl shadow-md overflow-hidden flex flex-col border border-border/50">
              {hasImage && (
                <div className="aspect-[16/10] bg-muted">
                  <img src={r.image_url!} alt={r.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-primary">{r.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-4 whitespace-pre-line">{r.summary}</p>
                <div className="mt-auto pt-4"><CtaButton label={r.cta_label} href={r.cta_href} /></div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
