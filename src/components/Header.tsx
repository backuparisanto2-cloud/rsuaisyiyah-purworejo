import { useState } from "react";
import { Search, Menu, X } from "lucide-react";
import logo from "@/assets/logo-pku.png";

const NAV = [
  { label: "Beranda", href: "#beranda" },
  { label: "Tentang Kami", href: "#tentang" },
  { label: "Berita & Info", href: "#layanan" },
  { label: "Jadwal Dokter", href: "#jadwal" },
  { label: "Instagram", href: "#instagram" },
  { label: "FAQ", href: "#faq" },
  { label: "Kontak", href: "#kontak" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-30 bg-primary text-primary-foreground shadow-md">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-24 flex items-center gap-4">
        <a href="#beranda" className="flex items-center gap-2 sm:gap-3 shrink min-w-0">
          <span className="shrink-0 inline-flex items-center justify-center rounded-full ring-[3px] ring-gold shadow-[0_0_18px_rgba(234,179,8,0.55)]">
            <img src={logo} alt="RSU Aisyiyah Purworejo" className="h-16 w-16 sm:h-20 sm:w-20 object-contain rounded-full" />
          </span>

          <div className="leading-[1.1] text-white shine-text min-w-0 whitespace-nowrap">
            <div className="text-[11px] sm:text-sm font-semibold tracking-[0.18em] opacity-80">RSU</div>
            <div className="flex items-baseline gap-2">
              <div className="font-bold text-lg sm:text-2xl md:text-3xl tracking-tight">AISYIYAH</div>
              <div className="font-bold text-lg sm:text-2xl md:text-3xl tracking-tight text-gold">PURWOREJO</div>
            </div>
          </div>
        </a>

        <nav className="hidden lg:flex items-center gap-1 ml-auto text-sm font-semibold">
          {NAV.map((n) => (
            <a key={n.label} href={n.href} className="px-3 py-2 hover:text-gold transition-colors">
              {n.label.toUpperCase()}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2 ml-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input placeholder="Cari…" className="w-32 rounded-full bg-white text-foreground text-xs pl-7 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold" />
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="opacity-70">EN</span><span className="opacity-50">|</span><span className="font-bold">ID</span>
          </div>
        </div>

        <button onClick={() => setOpen(true)} className="lg:hidden ml-auto p-2" aria-label="Menu">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 bg-primary z-50 overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <span className="font-bold">MENU</span>
            <button onClick={() => setOpen(false)} aria-label="Tutup"><X className="h-6 w-6" /></button>
          </div>
          <nav className="p-4 space-y-2">
            {NAV.map((n) => (
              <a key={n.label} href={n.href} onClick={() => setOpen(false)} className="block py-3 border-b border-white/10 font-semibold">
                {n.label.toUpperCase()}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
