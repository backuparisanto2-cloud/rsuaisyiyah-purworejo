import { useState } from "react";
import { X, Calendar, User, Phone, Stethoscope, FileText, Send } from "lucide-react";

const DEFAULT_WA_NUMBER = "6289646710859";
const DEFAULT_WA_PROLOG = "Hi RSU AISYIYAH Purworejo, saya ingin mendaftar.";

const CLINICS = [
  "Klinik Umum", "Klinik Anak", "Klinik Penyakit Dalam", "Klinik Kandungan/Obgyn",
  "Klinik Bedah Umum", "Klinik Mata", "Klinik THT", "Klinik Saraf",
  "Klinik Gigi & Mulut", "Klinik Jantung", "Klinik Orthopedi", "Klinik Paru",
  "Fisioterapi", "Laboratorium",
];

type Props = {
  open: boolean;
  onClose: () => void;
  waNumber?: string;
  waProlog?: string;
};

export default function PendaftaranModal({ open, onClose, waNumber, waProlog }: Props) {
  const [form, setForm] = useState({
    nama: "", nik: "", phone: "", tglLahir: "", klinik: "", tglPeriksa: "",
    jenisPasien: "Umum", keluhan: "",
  });
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const prolog = (waProlog ?? DEFAULT_WA_PROLOG).trim();
    const number = (waNumber || DEFAULT_WA_NUMBER).replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      `${prolog ? prolog + "\n\n" : ""}*PENDAFTARAN ONLINE*\nRSU Aisyiyah Purworejo\n\n` +
      `Nama: ${form.nama}\nNIK: ${form.nik}\nNo. HP: ${form.phone}\n` +
      `Tgl Lahir: ${form.tglLahir}\nJenis Pasien: ${form.jenisPasien}\n` +
      `Klinik: ${form.klinik}\nTgl Periksa: ${form.tglPeriksa}\n` +
      `Keluhan: ${form.keluhan}\n\nMohon konfirmasinya, terima kasih.`
    );
    window.open(`https://wa.me/${number}?text=${msg}`, "_blank");
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-[10002] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="bg-primary text-primary-foreground p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Pendaftaran Online</h2>
            <p className="text-xs opacity-90">RSU Aisyiyah Purworejo</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>

        {sent ? (
          <div className="p-10 text-center space-y-4 overflow-y-auto">
            <div className="h-16 w-16 mx-auto rounded-full bg-secondary/20 flex items-center justify-center text-secondary text-3xl">✓</div>
            <h3 className="text-xl font-bold text-primary">Pendaftaran Dikirim</h3>
            <p className="text-sm text-muted-foreground">Data Anda telah diteruskan ke CS melalui WhatsApp. Tim kami akan segera mengkonfirmasi jadwal.</p>
            <button onClick={() => { setSent(false); onClose(); }} className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-semibold">Tutup</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 overflow-y-auto space-y-4">
            <Field icon={<User className="h-4 w-4" />} label="Nama Lengkap" required>
              <input required value={form.nama} onChange={(e) => update("nama", e.target.value)} className="input" placeholder="Nama sesuai KTP" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field icon={<FileText className="h-4 w-4" />} label="NIK" required>
                <input required pattern="\d{16}" value={form.nik} onChange={(e) => update("nik", e.target.value)} className="input" placeholder="16 digit NIK" />
              </Field>
              <Field icon={<Phone className="h-4 w-4" />} label="No. WhatsApp" required>
                <input required type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="input" placeholder="08xxxxxxxxxx" />
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field icon={<Calendar className="h-4 w-4" />} label="Tanggal Lahir" required>
                <input required type="date" value={form.tglLahir} onChange={(e) => update("tglLahir", e.target.value)} className="input" />
              </Field>
              <Field icon={<User className="h-4 w-4" />} label="Jenis Pasien" required>
                <select value={form.jenisPasien} onChange={(e) => update("jenisPasien", e.target.value)} className="input">
                  <option>Umum</option><option>BPJS</option><option>Asuransi</option>
                </select>
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field icon={<Stethoscope className="h-4 w-4" />} label="Pilih Klinik" required>
                <select required value={form.klinik} onChange={(e) => update("klinik", e.target.value)} className="input">
                  <option value="">— Pilih Klinik —</option>
                  {CLINICS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field icon={<Calendar className="h-4 w-4" />} label="Tanggal Periksa" required>
                <input required type="date" min={new Date().toISOString().split("T")[0]} value={form.tglPeriksa} onChange={(e) => update("tglPeriksa", e.target.value)} className="input" />
              </Field>
            </div>
            <Field icon={<FileText className="h-4 w-4" />} label="Keluhan Singkat">
              <textarea value={form.keluhan} onChange={(e) => update("keluhan", e.target.value)} className="input min-h-20" placeholder="Ceritakan keluhan Anda..." />
            </Field>

            <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary-dark transition-colors">
              <Send className="h-4 w-4" /> Kirim Pendaftaran via WhatsApp
            </button>
            <p className="text-xs text-center text-muted-foreground">
              Data akan dikirim ke CS RSU Aisyiyah Purworejo (0896-4671-0859)
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ icon, label, required, children }: { icon: React.ReactNode; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-sm font-semibold mb-1.5 text-foreground">
        {icon} {label} {required && <span className="text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}
