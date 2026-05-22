import { useState } from "react";
import { CalendarDays, MessageCircle, X, User } from "lucide-react";

type Schedule = { hari: string; jam: string };
type Dokter = {
  spesialis: string;
  nama: string;
  jadwal: Schedule[];
  isNew?: boolean;
  catatan?: string;
};

const WA_NUMBER = "6281333334192";

const DOKTERS: Dokter[] = [
  { spesialis: "SPESIALIS ANAK", nama: "dr. Sulistyo Suharto, M.Si.,Med.,Sp.A", jadwal: [{ hari: "Senin s.d Sabtu", jam: "10.00 – 13.00 WIB" }] },
  { spesialis: "SPESIALIS SARAF", nama: "dr. Lestari Handayani, Sp.N", jadwal: [
    { hari: "Selasa, Rabu", jam: "14.00 – 16.00" },
    { hari: "Kamis", jam: "12.30 – 14.00" },
    { hari: "Jumat", jam: "13.00 – 15.00" },
  ]},
  { spesialis: "SPESIALIS PENYAKIT DALAM", nama: "dr. Padmi Bektilestari, Sp.PD", jadwal: [
    { hari: "Senin, Rabu, Jumat", jam: "07.30 – 09.30" },
    { hari: "Selasa, Kamis, Sabtu", jam: "10.00 – 12.00" },
    { hari: "Selasa, Rabu, Jumat", jam: "15.00 – 17.00" },
  ]},
  { spesialis: "SPESIALIS PENYAKIT DALAM", nama: "dr. Yudha Irla Saputra, Sp.PD, M.M.R", isNew: true, jadwal: [
    { hari: "Senin", jam: "13.00 – 15.00" },
    { hari: "Rabu", jam: "13.00 – 15.00" },
    { hari: "Jumat", jam: "13.00 – 15.00" },
  ]},
  { spesialis: "SPESIALIS KANDUNGAN", nama: "dr. Albert Novriadi, Sp.OG", jadwal: [
    { hari: "Senin", jam: "12.00 – 14.00" },
    { hari: "Selasa, Rabu", jam: "16.00 – 18.00" },
    { hari: "Sabtu", jam: "12.00 – 14.00" },
  ]},
  { spesialis: "POLI GIGI", nama: "drg. Idha Widiastuti, SE, MM", jadwal: [
    { hari: "Senin s.d Sabtu", jam: "10.00 – 12.00" },
    { hari: "Senin s.d Sabtu", jam: "16.00 – 18.00" },
  ]},
  { spesialis: "SPESIALIS BEDAH", nama: "dr. Proginova Dian Yudatama, Sp.B", jadwal: [
    { hari: "Senin", jam: "13.00 – 15.00" },
    { hari: "Rabu", jam: "13.00 – 15.00" },
    { hari: "Jumat", jam: "13.30 – 15.00" },
  ]},
  { spesialis: "SPESIALIS RADIOLOGI", nama: "dr. Muhammad Fandi G, Sp.Rad., M.Med.Sc", jadwal: [
    { hari: "Selasa, Rabu, Jumat", jam: "14.00 – 17.00 WIB" },
  ]},
  { spesialis: "SPESIALIS JANTUNG & PEMBULUH DARAH", nama: "dr. Arif Setyo Hutomo, Sp.JP", jadwal: [
    { hari: "Senin, Kamis, Sabtu", jam: "09.00 – 13.00 WIB" },
  ]},
  { spesialis: "PATOLOGI KLINIK", nama: "dr. Dianing Pratiwi, M.Med.Sc.PK", jadwal: [
    { hari: "Senin, Rabu, Jumat", jam: "17.00 – 19.00 WIB" },
  ]},
];

function waLink(d: Dokter) {
  const jadwalStr = d.jadwal.map((j) => `${j.hari} (${j.jam})`).join(", ");
  const msg = `Halo CS RSU 'Aisyiyah Purworejo, saya ingin bertanya jadwal:%0A%0A• Poli: ${d.spesialis}%0A• Dokter: ${d.nama}%0A• Jadwal: ${jadwalStr}%0A%0AMohon konfirmasi ketersediaannya. Terima kasih.`;
  return `https://wa.me/${WA_NUMBER}?text=${msg}`;
}

export default function JadwalDokter() {
  const [detail, setDetail] = useState<Dokter | null>(null);

  return (
    <section
      id="jadwal"
      className="relative py-20 px-6 bg-gradient-to-br from-[#3d6b3a] via-[#4a7a44] to-[#3d6b3a] text-white overflow-hidden"
    >
      {/* Pattern dekoratif */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-6xl mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center justify-center gap-2 text-gold">
            <CalendarDays className="h-6 w-6" />
            <span className="text-xs font-semibold tracking-[0.25em] uppercase">RSU 'Aisyiyah Purworejo</span>
          </div>
          <h2 className="mt-2 text-3xl md:text-5xl font-bold tracking-tight drop-shadow">
            JADWAL POLIKLINIK <span className="text-gold">RAWAT JALAN</span>
          </h2>
          <p className="mt-3 text-sm md:text-base opacity-90 max-w-2xl mx-auto">
            Klik nama dokter untuk detail jadwal & catatan, atau tombol WhatsApp untuk konfirmasi langsung ke CS.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-5">
          {DOKTERS.map((d, i) => (
            <article
              key={i}
              className="group rounded-2xl bg-white text-foreground shadow-xl overflow-hidden border border-white/40 hover:shadow-2xl hover:-translate-y-0.5 transition-all"
            >
              {/* Header kuning */}
              <header className="bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] px-4 py-3 text-center relative">
                <h3 className="text-sm md:text-base font-extrabold tracking-wide text-[#5b4400] uppercase">
                  {d.spesialis}
                </h3>
                <button
                  onClick={() => setDetail(d)}
                  className="block w-full mt-1 italic text-sm md:text-[15px] font-semibold text-[#3d3000] hover:underline"
                >
                  {d.nama}
                </button>
                {d.isNew && (
                  <span className="absolute -left-2 top-2 px-2 py-0.5 rounded-r-full bg-red-600 text-white text-[10px] font-extrabold tracking-widest shadow">
                    NEW
                  </span>
                )}
              </header>

              {/* Body */}
              <div className="p-4 flex gap-4 items-start">
                <div className="shrink-0 h-20 w-20 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center text-primary">
                  <User className="h-9 w-9" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-primary mb-1.5">
                    Jadwal Poliklinik Spesialis:
                  </div>
                  <ul className="space-y-1 text-sm">
                    {d.jadwal.map((j, k) => (
                      <li key={k} className="flex items-baseline gap-2 leading-snug">
                        <span className="font-medium text-foreground min-w-[120px]">{j.hari}</span>
                        <span className="text-muted-foreground">:</span>
                        <span className="text-foreground/80">{j.jam}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action */}
              <div className="px-4 pb-4">
                <a
                  href={waLink(d)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white shadow hover:brightness-110 transition"
                >
                  <MessageCircle className="h-4 w-4" />
                  Tanya jadwal via WhatsApp
                </a>
              </div>
            </article>
          ))}
        </div>

        {/* Footer kontak */}
        <div className="mt-12 grid md:grid-cols-2 gap-6 items-center rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-6">
          <div>
            <div className="text-gold font-script text-2xl">RSU 'Aisyiyah Purworejo</div>
            <p className="text-sm opacity-90 mt-1">Informasi layanan, hubungi:</p>
            <a href="https://wa.me/6281333334192" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-lg font-bold hover:text-gold transition">
              <MessageCircle className="h-5 w-5" /> 0813-3333-4192 (Humas)
            </a>
          </div>
          <div className="md:text-right">
            <div className="text-xs uppercase tracking-widest opacity-80">Informasi Pendaftaran</div>
            <a href="https://wa.me/6282133728989" target="_blank" rel="noreferrer" className="mt-1 inline-block text-2xl md:text-3xl font-extrabold text-gold hover:brightness-110">
              0821 3372 8989
            </a>
          </div>
        </div>

        <p className="mt-6 text-xs text-center opacity-80 italic">
          *Jadwal dapat berubah sewaktu-waktu. Konfirmasi via WhatsApp CS sebelum kunjungan.
        </p>
      </div>

      {/* MODAL DETAIL */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-card text-foreground shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] p-5 pr-12 text-[#3d3000]">
              <div className="text-xs font-bold tracking-widest uppercase">{detail.spesialis}</div>
              <h3 className="mt-1 text-xl font-extrabold italic">{detail.nama}</h3>
              <button
                onClick={() => setDetail(null)}
                aria-label="Tutup"
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="text-sm font-semibold text-primary">Jadwal Praktik Lengkap</div>
                <ul className="mt-2 space-y-2">
                  {detail.jadwal.map((j, i) => (
                    <li key={i} className="rounded-lg border bg-muted/40 p-3 text-sm flex justify-between gap-3">
                      <span className="font-medium">{j.hari}</span>
                      <span className="text-muted-foreground">{j.jam}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg bg-accent/40 p-3 text-xs text-muted-foreground">
                Datang minimal 15 menit sebelum jadwal. Jadwal dapat berubah sewaktu-waktu — mohon konfirmasi terlebih dahulu via WhatsApp CS.
              </div>

              <a
                href={waLink(detail)}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 font-bold text-white shadow-lg hover:brightness-110 transition"
              >
                <MessageCircle className="h-5 w-5" />
                Tanya jadwal via WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
