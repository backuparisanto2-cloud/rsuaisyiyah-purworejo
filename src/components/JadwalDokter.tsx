import { useMemo, useState } from "react";
import { Search, CalendarDays } from "lucide-react";

type Jadwal = {
  poli: string;
  dokter: string;
  hari: string;
  jam: string;
  catatan?: string;
};

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

export default function JadwalDokter() {
  const [poli, setPoli] = useState("Semua Poli");
  const [q, setQ] = useState("");

  const poliList = useMemo(
    () => ["Semua Poli", ...Array.from(new Set(JADWAL.map((j) => j.poli)))],
    []
  );

  const rows = JADWAL.filter(
    (j) =>
      (poli === "Semua Poli" || j.poli === poli) &&
      (q === "" || j.dokter.toLowerCase().includes(q.toLowerCase()))
  );

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
          Pilih poli atau cari nama dokter untuk melihat jadwal praktik.
        </p>

        <div className="mt-8 grid sm:grid-cols-[220px_1fr] gap-3">
          <select
            value={poli}
            onChange={(e) => setPoli(e.target.value)}
            className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {poliList.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
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
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={i}
                  className="border-t hover:bg-accent/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{r.poli}</td>
                  <td className="px-4 py-3">{r.dokter}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.hari}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.jam}</td>
                  <td className="px-4 py-3 text-muted-foreground italic">
                    {r.catatan ?? "—"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Tidak ada jadwal yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Kartu (mobile) */}
        <div className="mt-6 md:hidden space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="text-xs font-semibold tracking-widest text-secondary uppercase">
                {r.poli}
              </div>
              <div className="mt-1 font-bold text-foreground">{r.dokter}</div>
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
                <div className="mt-2 text-xs italic text-muted-foreground">
                  Catatan: {r.catatan}
                </div>
              )}
            </div>
          ))}
          {rows.length === 0 && (
            <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
              Tidak ada jadwal yang cocok.
            </div>
          )}
        </div>

        <p className="mt-6 text-xs text-center text-muted-foreground italic">
          *Jadwal dapat berubah sewaktu-waktu. Konfirmasi via WhatsApp CS sebelum kunjungan.
        </p>
      </div>
    </section>
  );
}
