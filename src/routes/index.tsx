import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarCheck, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
import LazySection from "@/components/LazySection";
import { useLightMode } from "@/hooks/use-light-mode";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RSU Aisyiyah Purworejo — Keramahan Sebenarnya" },
      { name: "description", content: "RSU Aisyiyah Purworejo — pelayanan kesehatan prima berbasis syariah dengan fasilitas modern, dokter spesialis berpengalaman, dan layanan ramah difabel." },
    ],
  }),
  component: HomePage,
});

type SectionRow = { key: string; display_order: number; is_active: boolean };

const DEFAULT_ORDER: SectionRow[] = [
  { key: "tentang", display_order: 1, is_active: true },
  { key: "jam_besuk", display_order: 2, is_active: true },
  { key: "layanan", display_order: 3, is_active: true },
  { key: "berita", display_order: 4, is_active: true },
  { key: "dokter", display_order: 5, is_active: true },
  { key: "instagram", display_order: 6, is_active: true },
  { key: "mitra", display_order: 7, is_active: true },
  { key: "faq", display_order: 8, is_active: true },
  { key: "kontak", display_order: 9, is_active: true },
];

function renderSection(key: string) {
  switch (key) {
    case "tentang": return <TentangSection key={key} />;
    case "jam_besuk": return <JamBesukSection key={key} />;
    case "layanan": return <LayananSection key={key} />;
    case "berita":
      return (
        <section key={key} id="berita" className="py-20 px-6 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-primary">BERITA, INFO TERKINI & PROMO</h2>
            <p className="text-center text-sm text-muted-foreground mt-2">10 unggahan terbaru dari Instagram @rsu_aisyiyah</p>
            <BeritaInstagram />
          </div>
        </section>
      );
    case "dokter": return <JadwalDokter key={key} />;
    case "instagram":
      return (
        <section key={key} id="instagram" className="py-20 px-6 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
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
      );
    case "mitra": return <MitraSlider key={key} />;
    case "faq": return <FaqSection key={key} />;
    case "kontak": return <KontakSection key={key} />;
    default: return null;
  }
}

type HeroContent = {
  logo_url: string | null;
  title_line1: string;
  title_line2: string;
  tagline: string;
  cta_text: string;
  badge1: string;
  badge2: string;
  overlay_color: string;
  overlay_opacity: number;
};

const DEFAULT_HERO: HeroContent = {
  logo_url: null,
  title_line1: "RSU AISYIYAH",
  title_line2: "PURWOREJO",
  tagline: "Keramahan Sebenarnya",
  cta_text: "Pendaftaran Online",
  badge1: "★ PARIPURNA",
  badge2: "Akreditasi LARSI",
  overlay_color: "#0b2545",
  overlay_opacity: 30,
};

function HomePage() {
  const [pendaftaranOpen, setPendaftaranOpen] = useState(false);
  const [sections, setSections] = useState<SectionRow[]>(DEFAULT_ORDER);
  const [hero, setHero] = useState<HeroContent>(DEFAULT_HERO);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("home_sections")
        .select("key,display_order,is_active")
        .order("display_order");
      if (data && data.length) setSections(data as SectionRow[]);
    };
    const loadHero = async () => {
      const { data } = await supabase.from("hero_content").select("*").eq("singleton", true).maybeSingle();
      if (data) setHero(data as HeroContent);
    };
    void load();
    void loadHero();
    const channel = supabase
      .channel("home_public")
      .on("postgres_changes", { event: "*", schema: "public", table: "home_sections" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "hero_content" }, loadHero)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);


  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SideSocial />
      <ChatbotArini />
      <AccessibilityWidget />
      <PendaftaranModal open={pendaftaranOpen} onClose={() => setPendaftaranOpen(false)} />

      {/* HERO (fixed) */}
      <section id="beranda" className="relative pt-20 sm:pt-24 min-h-[88vh] sm:min-h-screen flex items-center justify-center overflow-hidden bg-primary-dark">
        <HeroSlider />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: hero.overlay_color, opacity: hero.overlay_opacity / 100 }}
        />
        <div className="relative z-10 text-center px-4 sm:px-6 text-primary-foreground max-w-3xl">
          <img src={hero.logo_url || logo} alt="Logo RSU Aisyiyah Purworejo" className="h-16 w-16 sm:h-[5.6rem] sm:w-[5.6rem] mx-auto rounded-full object-contain aspect-square drop-shadow-2xl animate-float" />
          <h1 className="mt-5 sm:mt-6 text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            {hero.title_line1}<br/><span className="text-gold">{hero.title_line2}</span>
          </h1>
          <p className="mt-3 sm:mt-4 text-xl sm:text-3xl md:text-4xl font-script text-gold">{hero.tagline}</p>
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button onClick={() => setPendaftaranOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-gold text-primary-dark font-bold hover:scale-105 transition-transform shadow-lg text-sm sm:text-base">
              <CalendarCheck className="h-5 w-5" /> {hero.cta_text}
            </button>
            <span className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gold/20 border border-gold/40 text-xs sm:text-sm font-semibold">{hero.badge1}</span>
            <span className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 border border-white/20 text-xs sm:text-sm font-semibold">{hero.badge2}</span>
          </div>
        </div>
      </section>

      {sections.filter((s) => s.is_active).map((s) => renderSection(s.key))}

      <Footer />
    </div>
  );
}
