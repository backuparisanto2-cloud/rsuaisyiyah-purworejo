import { useEffect, useState } from "react";
import { CalendarDays, MessageCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Jadwal = { hari: string; jam: string };
type Dokter = { id: string; spesialis: string; nama: string; foto: string; jadwal: Jadwal[] };

const WA_NUMBER = "6281333334192";
const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];


function waLink(d: Dokter) {
  const jadwalStr = d.jadwal.map((j) => `${j.hari} (${j.jam})`).join(", ");
  const msg = `Halo CS RSU 'Aisyiyah Purworejo, saya ingin bertanya jadwal:%0A%0A• Poli: ${d.spesialis}%0A• Dokter: ${d.nama}%0A• Jadwal: ${jadwalStr}%0A%0AMohon konfirmasi. Terima kasih.`;
  return `https://wa.me/${WA_NUMBER}?text=${msg}`;
}

function fmtTime(t: string) { return t.replace(":", ".").replace(/\.00$/, ".00"); }

function groupSchedules(rows: { day_of_week: number; time_start: string; time_end: string; poli: string }[]): Jadwal[] {
  // group by time range, collect days
  const map = new Map<string, number[]>();
  rows.forEach((r) => {
    const key = `${r.time_start}|${r.time_end}|${r.poli}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r.day_of_week);
  });
  return Array.from(map.entries()).map(([key, days]) => {
    const [start, end] = key.split("|");
    const sorted = days.sort((a, b) => a - b);
    return { hari: sorted.map((d) => DAYS[d]).join(", "), jam: `${fmtTime(start)} – ${fmtTime(end)}` };
  });
}

export default function JadwalDokter() {
  const [dokters, setDokters] = useState<Dokter[]>(FALLBACK);
  const [detail, setDetail] = useState<Dokter | null>(null);

  useEffect(() => {
    let alive = true;
    async function fetch() {
      const [{ data: docs }, { data: sched }] = await Promise.all([
        supabase.from("doctors").select("id,name,specialty,photo_url").eq("is_active", true).order("display_order"),
        supabase.from("doctor_schedules").select("doctor_id,day_of_week,time_start,time_end,poli"),
      ]);
      if (!alive || !docs || docs.length === 0) return;
      const list: Dokter[] = docs.map((d: { id: string; name: string; specialty: string; photo_url: string | null }) => {
        const rows = (sched ?? []).filter((s: { doctor_id: string }) => s.doctor_id === d.id);
        return { id: d.id, nama: d.name, spesialis: d.specialty, foto: d.photo_url ?? "", jadwal: groupSchedules(rows) };
      });
      setDokters(list);
    }
    void fetch();
    const ch = supabase.channel("doctors_public")
      .on("postgres_changes", { event: "*", schema: "public", table: "doctors" }, () => fetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "doctor_schedules" }, () => fetch())
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, []);

  return (
    <section id="jadwal" className="relative py-20 px-6 bg-gradient-to-br from-[#3d6b3a] via-[#4a7a44] to-[#3d6b3a] text-white overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center justify-center gap-2 text-gold">
            <CalendarDays className="h-6 w-6" />
            <span className="text-xs font-semibold tracking-[0.25em] uppercase">RSU 'Aisyiyah Purworejo</span>
          </div>
          <h2 className="mt-2 text-3xl md:text-5xl font-bold tracking-tight drop-shadow">JADWAL POLIKLINIK <span className="text-gold">RAWAT JALAN</span></h2>
          <p className="mt-3 text-sm md:text-base opacity-90 max-w-2xl mx-auto">Klik nama dokter untuk detail, atau WhatsApp untuk konfirmasi.</p>
        </div>

        <div className="mt-10 sm:mt-12 grid md:grid-cols-2 gap-4 sm:gap-5">
          {dokters.map((d) => (
            <article key={d.id} role="button" tabIndex={0} onClick={() => setDetail(d)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDetail(d); } }}
              className="group cursor-pointer rounded-2xl bg-white text-foreground shadow-xl overflow-hidden border border-white/40 hover:shadow-2xl hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-gold">
              <header className="bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] px-3 py-2.5 text-center">
                <h3 className="text-[12px] sm:text-sm md:text-base font-extrabold tracking-wide text-[#5b4400] uppercase">{d.spesialis}</h3>
                <div className="mt-0.5 italic text-[13px] sm:text-[15px] font-semibold text-[#3d3000]">{d.nama}</div>
              </header>
              <div className="p-3 sm:p-4 flex gap-3 items-start">
                {d.foto ? <img src={d.foto} alt={d.nama} loading="lazy" className="shrink-0 h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover object-top border border-primary/20" />
                  : <div className="shrink-0 h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-muted" />}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] sm:text-xs font-semibold text-primary mb-1.5">Jadwal Praktik:</div>
                  <ul className="space-y-1 text-[12.5px] sm:text-sm">
                    {d.jadwal.map((j, k) => (
                      <li key={k} className="flex flex-wrap items-baseline gap-x-2 leading-snug">
                        <span className="font-medium text-foreground min-w-[96px] sm:min-w-[120px]">{j.hari}</span>
                        <span className="text-muted-foreground">:</span>
                        <span className="text-foreground/80">{j.jam}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                <a href={waLink(d)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow hover:brightness-110 transition">
                  <MessageCircle className="h-4 w-4" /> Tanya via WhatsApp
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4" onClick={() => setDetail(null)}>
          <div className="relative w-full max-w-md rounded-2xl bg-card text-foreground shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDetail(null)} aria-label="Tutup" className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white shadow"><X className="h-5 w-5" /></button>
            <div className="relative bg-gradient-to-br from-[#3d6b3a] via-[#4a7a44] to-[#3d6b3a] pt-7 pb-6 px-5 text-center">
              {detail.foto && <img src={detail.foto} alt={detail.nama} className="mx-auto h-32 w-32 sm:h-40 sm:w-40 rounded-full object-cover object-top border-4 border-gold shadow-xl bg-white" />}
              <div className="mt-3 inline-block px-3 py-1 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-[11px] sm:text-xs font-extrabold tracking-widest uppercase text-[#5b4400] shadow">{detail.spesialis}</div>
              <h3 className="mt-2 text-lg sm:text-xl font-extrabold italic text-white drop-shadow">{detail.nama}</h3>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              <ul className="divide-y divide-border rounded-lg border bg-muted/30">
                {detail.jadwal.map((j, i) => (
                  <li key={i} className="px-3 py-2 text-[13px] sm:text-sm flex justify-between gap-3">
                    <span className="font-medium">{j.hari}</span>
                    <span className="text-muted-foreground text-right">{j.jam}</span>
                  </li>
                ))}
              </ul>
              <a href={waLink(detail)} target="_blank" rel="noreferrer" className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 font-bold text-white shadow-lg hover:brightness-110 transition text-sm sm:text-base">
                <MessageCircle className="h-5 w-5" /> Tanya via WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
