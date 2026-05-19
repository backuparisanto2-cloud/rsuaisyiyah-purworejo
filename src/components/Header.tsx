import { useState } from "react";
import { ChevronDown, Search, Menu, X } from "lucide-react";
import logo from "@/assets/logo-pku.png";

const NAV = [
  { label: "Beranda", href: "#beranda" },
  { label: "Tentang Kami", href: "#tentang", sub: ["Sejarah & Profil", "Visi & Misi", "Direksi", "Prestasi", "Budaya Organisasi"] },
  { label: "Layanan", href: "#layanan", sub: ["Paviliun Multazam", "Bedah Anak", "Uronefrologi", "Stem Cell", "Rawat Inap", "IGD 24 Jam", "Pendaftaran Online"] },
  { label: "Dokter Kami", href: "#dokter" },
  { label: "Artikel", href: "#artikel", sub: ["Berita & Artikel", "Jurnal Kesehatan", "Karir"] },
  { label: "Hubungi Kami", href: "#kontak" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-30 bg-primary text-primary-foreground shadow-md">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-20 flex items-center gap-4">
        <a href="#beranda" className="flex items-center gap-2 sm:gap-3 shrink min-w-0">
          <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-white/5 p-0.5 ring-[3px] ring-gold shadow-[0_0_18px_rgba(234,179,8,0.55)]">
            <img src={logo} alt="RSU Aisyiyah Purworejo" className="h-14 w-14 sm:h-[72px] sm:w-[72px] object-contain rounded-full" />
          </span>
          <div className="leading-[1.15] sm:leading-tight text-white shine-text min-w-0 max-w-[190px] sm:max-w-none whitespace-nowrap">
            <div className="text-[10px] sm:text-xs font-semibold tracking-[0.14em] sm:tracking-widest opacity-80">RSU</div>
            <div className="font-bold text-[14px] sm:text-lg tracking-tight sm:tracking-normal">AISYIYAH</div>
            <div className="text-[11px] sm:text-sm opacity-90 tracking-tight sm:tracking-normal">PURWOREJO</div>
          </div>
        </a>

        <nav className="hidden lg:flex items-center gap-1 ml-auto text-sm font-semibold">
          {NAV.map((n) => (
            <div key={n.label} className="relative group">
              <a href={n.href} className="px-3 py-2 flex items-center gap-1 hover:text-gold transition-colors">
                {n.label.toUpperCase()}
                {n.sub && <ChevronDown className="h-3 w-3" />}
              </a>
              {n.sub && (
                <div className="absolute top-full left-0 min-w-56 bg-white text-foreground rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2">
                  {n.sub.map((s) => (
                    <a key={s} href="#" className="block px-4 py-2 text-sm hover:bg-accent">{s}</a>
                  ))}
                </div>
              )}
            </div>
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
