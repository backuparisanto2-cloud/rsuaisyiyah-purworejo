import { useMemo, useState } from "react";
import { Search, CalendarDays, MessageCircle, X } from "lucide-react";

type Jadwal = {
  poli: string;
  dokter: string;
  hari: string;
  jam: string;
  catatan?: string;
};

const WA_NUMBER = "6289646710859";

const JADWAL: Jadwal[] = [
  { poli: "Klinik Anak", dokter: "dr. Andi Wibowo, Sp.A", hari: "Senin–Jumat", jam: "09.00 – 12.00", catatan: "Perjanjian" },
  { poli: "Klinik Anak", dokter: "dr. Siti Nurhaliza, Sp.A", hari: "Selasa, Kamis", jam: "13.00 – 16.00" },
  { poli: "Klinik Penyakit Dalam", dokter: "dr. Bambang Prasetyo, Sp.PD", hari: "Senin–Sabtu", jam: "08.00 – 12.00" },
  { poli: "Klinik Penyakit Dalam", dokter: "dr. Hartono, Sp.PD-KGEH", hari: "Rabu, Jumat", jam: "14.00 – 17.00", catatan: "Subspesialis GI" },
  { poli: "Klinik Jantung", dokter: "dr. Rina Hapsari, Sp.JP", hari: "Senin, Rabu, Jumat", jam: "09.00 – 13.00" },
  { poli: "Klinik Bedah Umum", dokter: "dr. Yudi Setiawan, Sp.B", hari: "Senin–Jumat", jam: "10.00 – 14.00" },
  { poli: "Klinik Bedah Anak", dokter: "dr. Fajar Nugroho, Sp.BA", hari: "Selasa, Kamis", jam: "09.00 – 12.00", catatan: "Perjanjian" },
  { poli: "Klinik Kandungan/Obgyn", dokter: "dr. Diah Permata, Sp.OG", hari: "Senin–Sabtu", jam: "08.00 – 12.00" },
  { poli: "Klinik Mata", dokter: "dr. Indra Wijaya, Sp.M", hari: "Senin, Rabu, Jumat", jam: "13.00 – 16.00" },
  { poli: "Klinik THT", dokter: "dr. Lestari Anggraini, Sp.THT-KL", hari: "Selasa, Kamis", jam: "09.00 – 12.00" },
  { poli: "Klinik Saraf", dokter: "dr. Joko Susilo, Sp.S", hari: "Senin–Jumat", jam: "10.00 – 13.00" },
  { poli: "Klinik Orthopedi", dokter: "dr. Adi Pramana, Sp.OT", hari: "Selasa, Jumat", jam: "14.00 – 17.00" },
  { poli: "Klinik Paru", dokter: "dr. Maya Sari, Sp.P", hari: "Rabu, Sabtu", jam: "09.00 – 12.00" },
  { poli: "Klinik Urologi", dokter: "dr. Reza Pratama, Sp.U", hari: "Senin, Kamis", jam: "13.00 – 16.00", catatan: "Perjanjian" },
  { poli: "Klinik Gigi & Mulut", dokter: "drg. Anita Rahmawati", hari: "Senin–Sabtu", jam: "08.00 – 14.00" },
  { poli: "Klinik Jiwa", dokter: "dr. Hendra Kurnia, Sp.KJ", hari: "Rabu, Jumat", jam: "10.00 – 13.00" },
  { poli: "Klinik Rehab Medik", dokter: "dr. Putri Aulia, Sp.KFR", hari: "Senin–Jumat", jam: "09.00 – 12.00" },
];

function waLink(j: Jadwal) {
  const msg = `Halo CS RSU Aisyiyah Purworejo, saya ingin bertanya jadwal:%0A%0A• Poli: ${j.poli}%0A• Dokter: ${j.dokter}%0A• Hari: ${j.hari}%0A• Jam: ${j.jam}%0A%0AMohon konfirmasi ketersediaannya. Terima kasih.`;
  return `https://wa.me/${WA_NUMBER}?text=${msg}`;
}

export default function JadwalDokter() {
  const [poli, setPoli] = useState("Semua Poli");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<Jadwal | null>(null);

  const poliList = useMemo(
    () => ["Semua Poli", ...Array.from(new Set(JADWAL.map((j) => j.poli)))],
    []
  );

  const rows = JADWAL.filter(
    (j) =>
      (poli === "Semua Poli" || j.poli === poli) &&
      (q === "" || j.dokter.toLowerCase().includes(q.toLowerCase()))
  );

  // Untuk detail: semua jadwal dokter terpilih (mungkin >1 baris)
  const detailRows = detail
    ? JADWAL.filter((j) => j.dokter === detail.dokter)
    : [];

  return (
    <section id="jadwal" className="py-20 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-3">
          <CalendarDays className="h-7 w-7 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold text-center text-primary">
            JADWAL DOKTER & POLIKLINIK
          </h2>
        </div>
        <p className="mt-2 text-center text-muted-foreground">
          Klik nama dokter untuk detail, atau tombol WhatsApp untuk konfirmasi langsung ke CS.
        </p>

        <div className="mt-8 grid sm:grid-cols-[220px_1fr] gap-3">
          <select
            value={poli}
            onChange={(e) => setPoli(e.target.value)}
            className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {poliList.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama dokter…"
              className="w-full rounded-lg border bg-card pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Tabel (desktop) */}
        <div className="mt-6 hidden md:block overflow-x-auto rounded-2xl border bg-card shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground text-left">
                <th className="px-4 py-3 font-semibold">Poli</th>
                <th className="px-4 py-3 font-semibold">Dokter</th>
                <th className="px-4 py-3 font-semibold">Hari</th>
                <th className="px-4 py-3 font-semibold">Jam</th>
                <th className="px-4 py-3 font-semibold">Catatan</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{r.poli}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDetail(r)}
                      className="text-left font-semibold text-primary hover:underline"
                    >
                      {r.dokter}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.hari}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.jam}</td>
                  <td className="px-4 py-3 text-muted-foreground italic">{r.catatan ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={waLink(r)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-110 transition"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Tanya via WA
                    </a>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Tidak ada jadwal yang cocok.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Kartu (mobile) */}
        <div className="mt-6 md:hidden space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="text-xs font-semibold tracking-widest text-secondary uppercase">{r.poli}</div>
              <button
                onClick={() => setDetail(r)}
                className="mt-1 font-bold text-primary hover:underline text-left"
              >
                {r.dokter}
              </button>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Hari</div>
                  <div>{r.hari}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Jam</div>
                  <div>{r.jam}</div>
                </div>
              </div>
              {r.catatan && (
                <div className="mt-2 text-xs italic text-muted-foreground">Catatan: {r.catatan}</div>
              )}
              <a
                href={waLink(r)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-110 transition"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Tanya jadwal via WhatsApp
              </a>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground">Tidak ada jadwal yang cocok.</div>
          )}
        </div>

        <p className="mt-6 text-xs text-center text-muted-foreground italic">
          *Jadwal dapat berubah sewaktu-waktu. Konfirmasi via WhatsApp CS sebelum kunjungan.
        </p>
      </div>

      {/* MODAL DETAIL DOKTER */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-card shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-primary text-primary-foreground p-5 pr-12">
              <div className="text-xs font-semibold tracking-widest opacity-80 uppercase">
                {detail.poli}
              </div>
              <h3 className="mt-1 text-xl font-bold">{detail.dokter}</h3>
              <button
                onClick={() => setDetail(null)}
                aria-label="Tutup"
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/15"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="text-sm font-semibold text-foreground">Jadwal Praktik</div>
                <ul className="mt-2 space-y-2">
                  {detailRows.map((r, i) => (
                    <li
                      key={i}
                      className="rounded-lg border bg-muted/40 p-3 text-sm flex flex-wrap gap-x-4 gap-y-1"
                    >
                      <span className="font-medium">{r.hari}</span>
                      <span className="text-muted-foreground">{r.jam}</span>
                      {r.catatan && (
                        <span className="w-full text-xs italic text-muted-foreground">
                          Catatan: {r.catatan}
                        </span>
                      )}
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
