import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck, Instagram } from "lucide-react";
import MitraSlider from "@/components/MitraSlider";
import Header from "@/components/Header";
import SideSocial from "@/components/SideSocial";
import JadwalDokter from "@/components/JadwalDokter";
import ChatbotArini from "@/components/ChatbotArini";
import HeroSlider from "@/components/HeroSlider";
import BeritaInstagram from "@/components/BeritaInstagram";
import AccessibilityWidget from "@/components/AccessibilityWidget";
import PendaftaranModal from "@/components/PendaftaranModal";
import TentangSection from "@/components/TentangSection";
import JamBesukSection from "@/components/JamBesukSection";
import LayananSection from "@/components/LayananSection";
import FaqSection from "@/components/FaqSection";
import KontakSection from "@/components/KontakSection";
import Footer from "@/components/Footer";
import logo from "@/assets/logo-hero.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RSU Aisyiyah Purworejo — Keramahan Sebenarnya" },
      { name: "description", content: "RSU Aisyiyah Purworejo — pelayanan kesehatan prima berbasis syariah dengan fasilitas modern, dokter spesialis berpengalaman, dan layanan ramah difabel." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [pendaftaranOpen, setPendaftaranOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SideSocial />
      <ChatbotArini />
      <AccessibilityWidget />
      <PendaftaranModal open={pendaftaranOpen} onClose={() => setPendaftaranOpen(false)} />

      {/* HERO */}
      <section id="beranda" className="relative pt-20 sm:pt-24 min-h-[88vh] sm:min-h-screen flex items-center justify-center overflow-hidden bg-primary-dark">
        <HeroSlider />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-blue-800/30 to-blue-950/30 pointer-events-none" />

        <div className="relative z-10 text-center px-4 sm:px-6 text-primary-foreground max-w-3xl">
          <img src={logo} alt="Logo RSU Aisyiyah Purworejo" className="h-16 w-16 sm:h-[5.6rem] sm:w-[5.6rem] mx-auto rounded-full object-contain aspect-square drop-shadow-2xl animate-float" />
          <h1 className="mt-5 sm:mt-6 text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            RSU AISYIYAH<br/><span className="text-gold">PURWOREJO</span>
          </h1>
          <p className="mt-3 sm:mt-4 text-xl sm:text-3xl md:text-4xl font-script text-gold">Keramahan Sebenarnya</p>
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button onClick={() => setPendaftaranOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-gold text-primary-dark font-bold hover:scale-105 transition-transform shadow-lg text-sm sm:text-base">
              <CalendarCheck className="h-5 w-5" /> Pendaftaran Online
            </button>
            <span className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gold/20 border border-gold/40 text-xs sm:text-sm font-semibold">★ PARIPURNA</span>
            <span className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 border border-white/20 text-xs sm:text-sm font-semibold">Akreditasi LARSI</span>
          </div>
        </div>
      </section>

      <TentangSection />
      <JamBesukSection />
      <LayananSection />

      {/* BERITA, INFO TERKINI & PROMO */}
      <section id="berita" className="py-20 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-primary">BERITA, INFO TERKINI & PROMO</h2>
          <p className="text-center text-sm text-muted-foreground mt-2">15 unggahan terbaru dari Instagram @rsu_aisyiyah</p>
          <BeritaInstagram />
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

          <div className="mt-10 rounded-2xl overflow-hidden border border-white/15 bg-white shadow-2xl mx-auto w-full max-w-5xl">
            <script src="https://elfsightcdn.com/platform.js" async />
            <div className="elfsight-app-feb3351d-45de-424a-a93b-4e602e938274" data-elfsight-app-lazy />
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

      <MitraSlider />
      <FaqSection />
      <KontakSection />
      <Footer />
    </div>
  );
}
