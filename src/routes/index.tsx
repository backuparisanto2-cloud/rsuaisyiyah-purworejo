import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Phone, Mail, Clock, ChevronRight, Stethoscope, Baby, Activity, HeartPulse, Microscope, Pill, Brain, Eye, Ear, Bone, Search, CalendarCheck, Instagram } from "lucide-react";
import Header from "@/components/Header";
import SideSocial from "@/components/SideSocial";
import JadwalDokter from "@/components/JadwalDokter";
import ChatbotArini from "@/components/ChatbotArini";
import HeroVideo from "@/components/HeroVideo";

import AccessibilityWidget from "@/components/AccessibilityWidget";
import PendaftaranModal from "@/components/PendaftaranModal";
import logo from "@/assets/logo-pku.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RSU Aisyiyah Purworejo — Keramahan Sebenarnya" },
      { name: "description", content: "RSU Aisyiyah Purworejo — pelayanan kesehatan prima berbasis syariah dengan fasilitas modern, dokter spesialis berpengalaman, dan layanan ramah difabel." },
    ],
  }),
  component: HomePage,
});



const PROMO = [
  { title: "Audiometri", color: "from-sky-500 to-blue-700" },
  { title: "Women Health", color: "from-pink-500 to-rose-700" },
  { title: "CAPD", color: "from-emerald-500 to-teal-700" },
  { title: "Secretome Therapy", color: "from-amber-500 to-orange-700" },
  { title: "ESWL", color: "from-indigo-500 to-violet-700" },
  { title: "Akupuntur Medik", color: "from-red-500 to-rose-700" },
  { title: "Vaksinasi", color: "from-green-500 to-emerald-700" },
];

const CLINICS = [
  { name: "Klinik Anak", icon: Baby },
  { name: "Klinik Penyakit Dalam", icon: Stethoscope },
  { name: "Klinik Jantung", icon: HeartPulse },
  { name: "Klinik Bedah Umum", icon: Activity },
  { name: "Klinik Bedah Anak", icon: Baby },
  { name: "Klinik Bedah Saraf", icon: Brain },
  { name: "Klinik Kandungan/Obgyn", icon: HeartPulse },
  { name: "Klinik Mata", icon: Eye },
  { name: "Klinik THT", icon: Ear },
  { name: "Klinik Saraf", icon: Brain },
  { name: "Klinik Orthopedi", icon: Bone },
  { name: "Klinik Paru", icon: Activity },
  { name: "Klinik Urologi", icon: Activity },
  { name: "Klinik Gigi & Mulut", icon: Stethoscope },
  { name: "Klinik Jiwa", icon: Brain },
  { name: "Klinik Akupuntur", icon: Pill },
  { name: "Klinik Rehab Medik", icon: Activity },
  { name: "Fisioterapi", icon: Activity },
  { name: "Psikolog", icon: Brain },
  { name: "Terapi Wicara", icon: Ear },
  { name: "Terapi Okupasi", icon: Activity },
  { name: "Laboratorium", icon: Microscope },
];

function HomePage() {
  const [search, setSearch] = useState("");
  const [pendaftaranOpen, setPendaftaranOpen] = useState(false);
  const filteredClinics = CLINICS.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SideSocial />
      <ChatbotArini />
      
      <AccessibilityWidget />
      <PendaftaranModal open={pendaftaranOpen} onClose={() => setPendaftaranOpen(false)} />

      {/* HERO */}
      <section id="beranda" className="relative pt-20 min-h-screen flex items-center justify-center overflow-hidden bg-primary-dark">
        <HeroVideo />
        <div className="absolute inset-0 bg-primary-dark/60" />

        <div className="relative z-10 text-center px-6 text-primary-foreground max-w-3xl">
          <img src={logo} alt="Logo RSU Aisyiyah Purworejo" className="h-32 w-32 mx-auto drop-shadow-2xl animate-float" />
          <h1 className="mt-6 text-3xl md:text-5xl font-bold tracking-tight">
            RSU AISYIYAH<br/><span className="text-gold">PURWOREJO</span>
          </h1>
          <p className="mt-4 text-2xl md:text-4xl font-script text-gold">Keramahan Sebenarnya</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => setPendaftaranOpen(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold text-primary-dark font-bold hover:scale-105 transition-transform shadow-lg">
              <CalendarCheck className="h-5 w-5" /> Pendaftaran Online
            </button>
            <span className="px-4 py-2 rounded-full bg-gold/20 border border-gold/40 text-sm font-semibold">★ PARIPURNA</span>
            <span className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold">Akreditasi LARSI</span>
          </div>
        </div>
      </section>

      {/* TENTANG */}
      <section id="tentang" className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] bg-muted">
            <img src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=900&q=70" alt="Tentang Kami" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-widest text-secondary uppercase">Tentang Kami</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold text-primary">
              Keramahan Sebenarnya & Mutu Pelayanan Syariah
            </h2>
            <h3 className="mt-3 text-lg font-semibold text-muted-foreground">RSU Aisyiyah Purworejo</h3>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              RSU Aisyiyah Purworejo berdedikasi memberikan pelayanan kesehatan prima berbasis syariah dengan integritas tinggi, mengutamakan keselamatan pasien dan mewujudkan keramahan sebenarnya dalam setiap layanan, termasuk fasilitas ramah difabel.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Kami terus mengembangkan fasilitas berkualitas dan modern, menyediakan layanan spesialis dan subspesialis unggulan, ditunjang peralatan medis berteknologi terkini serta layanan penunjang diagnostik mutakhir.
            </p>
            <a href="#layanan" className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary-dark transition-colors">
              Selengkapnya <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* JAM BESUK */}
      <section className="py-16 px-6 bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold">JAM BESUK RESMI</h2>
          <p className="mt-1 text-sm opacity-80">RSU Aisyiyah Purworejo</p>
          <div className="mt-8 grid sm:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white/10 backdrop-blur p-8 border border-white/15">
              <Clock className="h-10 w-10 mx-auto text-gold" />
              <div className="mt-3 text-xl font-bold">SIANG</div>
              <div className="mt-1 text-2xl font-script text-gold">11.00 – 13.30 WIB</div>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur p-8 border border-white/15">
              <Clock className="h-10 w-10 mx-auto text-gold" />
              <div className="mt-3 text-xl font-bold">SORE</div>
              <div className="mt-1 text-2xl font-script text-gold">17.00 – 19.00 WIB</div>
            </div>
          </div>
          <p className="mt-6 text-sm opacity-80 max-w-xl mx-auto">
            Demi kenyamanan dan kesembuhan pasien, mohon pengunjung mematuhi peraturan jam besuk resmi yang berlaku.
          </p>
        </div>
      </section>

      {/* PROMO */}
      <section id="layanan" className="py-20 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-primary">INFO TERKINI & PROMO</h2>
          <div className="mt-4 overflow-hidden">
            <div className="flex gap-5 animate-marquee w-max">
              {[...PROMO, ...PROMO].map((p, i) => (
                <a key={i} href="https://www.instagram.com/rsu_aisyiyah?igsh=MTg0NnhndWs4Ynpl" target="_blank" rel="noreferrer"
                  className={`shrink-0 w-64 h-80 rounded-2xl bg-gradient-to-br ${p.color} p-6 flex flex-col justify-between text-white shadow-xl hover:scale-105 transition-transform`}>
                  <div>
                    <div className="text-xs font-semibold opacity-80 tracking-widest">PROMO</div>
                    <div className="mt-2 text-2xl font-bold leading-tight">{p.title}</div>
                  </div>
                  <div className="text-xs opacity-90">Klik untuk info lebih lanjut →</div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* KLINIK */}
      <section id="klinik" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-primary">POLIKLINIK & RAWAT JALAN</h2>
          <p className="mt-2 text-center text-muted-foreground">Klik klinik untuk melihat jadwal dokter</p>

          <div className="mt-10 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CLINICS.map((c) => (
              <button key={c.name} className="group flex items-center gap-3 p-4 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all text-left">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <c.icon className="h-5 w-5" />
                </div>
                <span className="font-medium text-sm">{c.name}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="mt-12 max-w-2xl mx-auto p-6 rounded-2xl bg-card border shadow-sm">
            <h3 className="font-bold text-primary">PENCARIAN DOKTER</h3>
            <div className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pilih Klinik atau Spesialisasi..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary-dark">Cari</button>
            </div>
            {search && (
              <div className="mt-3 text-sm text-muted-foreground">
                {filteredClinics.length} klinik ditemukan. Silakan klik nama klinik untuk jadwal.
              </div>
            )}
            <a href="#" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline">
              Cek Antrian Saat Ini <ChevronRight className="h-4 w-4" />
            </a>
            <p className="mt-2 text-xs text-muted-foreground italic">Catatan: Jadwal dapat berubah sewaktu-waktu.</p>
          </div>
        </div>
      </section>

      <JadwalDokter />

      {/* INSTAGRAM */}
      <section id="instagram" className="py-20 px-6 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-3">
            <Instagram className="h-8 w-8 text-gold" />
            <h2 className="text-2xl md:text-3xl font-bold text-center">IKUTI KAMI DI INSTAGRAM</h2>
          </div>
          <p className="mt-2 text-center text-gold font-script text-2xl">@rsu_aisyiyah</p>
          <p className="mt-3 text-center text-sm opacity-85 max-w-xl mx-auto">
            Update terbaru seputar layanan, edukasi kesehatan, dan kegiatan RSU Aisyiyah Purworejo langsung dari akun resmi kami.
          </p>

          <div className="mt-10 rounded-2xl overflow-hidden border border-white/15 bg-white shadow-2xl mx-auto w-full">
            <iframe
              title="Instagram @rsu_aisyiyah"
              src="https://www.instagram.com/rsu_aisyiyah/embed"
              className="block w-full h-[1100px] md:h-[1300px] bg-white"
              loading="lazy"
              frameBorder={0}
              allow="encrypted-media"
              allowFullScreen
            />
          </div>

          <div className="mt-10 text-center">
            <a
              href="https://www.instagram.com/rsu_aisyiyah?igsh=MWVqZDVtODdreXVqbg=="
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] font-bold text-white shadow-lg hover:scale-105 transition-transform"
            >
              <Instagram className="h-5 w-5" /> Kunjungi Instagram Kami
            </a>
          </div>
        </div>
      </section>

      {/* KONTAK */}
      <section id="kontak" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-primary">LOKASI & KONTAK KAMI</h2>
          <div className="mt-10 grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl overflow-hidden border shadow-lg aspect-video bg-muted">
              <iframe
                title="Lokasi RS"
                src="https://www.google.com/maps?q=RSU+Aisyiyah+Purworejo&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><MapPin className="h-5 w-5" /></div>
                <div>
                  <div className="font-bold">Alamat</div>
                  <p className="text-muted-foreground text-sm">Jl. Jend. Sudirman No. 12, Purworejo, Jawa Tengah</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Phone className="h-5 w-5" /></div>
                <div>
                  <div className="font-bold">WhatsApp CS</div>
                  <a href="https://wa.me/6289646710859" className="text-secondary font-semibold hover:underline">0896-4671-0859</a>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Mail className="h-5 w-5" /></div>
                <div>
                  <div className="font-bold">Email & Sosial Media</div>
                  <p className="text-muted-foreground text-sm">info@rspkukaranganyar.id</p>
                  <a href="https://www.instagram.com/rsu_aisyiyah?igsh=MTg0NnhndWs4Ynpl" target="_blank" rel="noreferrer" className="text-secondary text-sm font-semibold hover:underline">@rsu_aisyiyah</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-primary-dark text-primary-foreground py-12 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-14 w-14" />
              <div>
                <div className="font-bold">RSU Aisyiyah</div>
                <div className="text-sm opacity-80">Purworejo</div>
              </div>
            </div>
            <p className="mt-4 text-sm opacity-80 font-script text-gold text-xl">Keramahan Sebenarnya</p>
          </div>
          <div>
            <h4 className="font-bold mb-3">Tautan Cepat</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li><a href="#tentang" className="hover:text-gold">Tentang Kami</a></li>
              <li><a href="#layanan" className="hover:text-gold">Layanan</a></li>
              <li><a href="#klinik" className="hover:text-gold">Poliklinik</a></li>
              <li><a href="#kontak" className="hover:text-gold">Kontak</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3">Hubungi Kami</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li>WhatsApp: <a className="text-gold" href="https://wa.me/6289646710859">0896-4671-0859</a></li>
              <li>Instagram: <a className="text-gold" target="_blank" rel="noreferrer" href="https://www.instagram.com/rsu_aisyiyah?igsh=MTg0NnhndWs4Ynpl">@rsu_aisyiyah</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/10 text-xs opacity-70 text-center">
          © {new Date().getFullYear()} RSU Aisyiyah Purworejo. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
