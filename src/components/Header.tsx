import { useEffect, useState } from "react";
import { Search, Menu, X, ChevronDown } from "lucide-react";
import logo from "@/assets/logo-pku.png";
import { supabase } from "@/integrations/supabase/client";

type MenuItem = {
  id: string;
  label: string;
  href: string;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
};

const DEFAULT_NAV: MenuItem[] = [
  { id: "d1", label: "Beranda", href: "#beranda", parent_id: null, display_order: 1, is_active: true },
  { id: "d2", label: "Tentang Kami", href: "#tentang", parent_id: null, display_order: 2, is_active: true },
  { id: "d3", label: "Berita & Info", href: "#berita", parent_id: null, display_order: 3, is_active: true },
  { id: "d4", label: "Jadwal Dokter", href: "#jadwal", parent_id: null, display_order: 4, is_active: true },
  { id: "d5", label: "Instagram", href: "#instagram", parent_id: null, display_order: 5, is_active: true },
  { id: "d6", label: "FAQ", href: "#faq", parent_id: null, display_order: 6, is_active: true },
  { id: "d7", label: "Kontak", href: "#kontak", parent_id: null, display_order: 7, is_active: true },
];

export default function Header({ pageId }: { pageId?: string } = {}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MenuItem[]>(DEFAULT_NAV);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (pageId) {
        const { data } = await supabase
          .from("page_menu_items")
          .select("*")
          .eq("page_id", pageId)
          .order("display_order");
        if (cancelled) return;
        if (data && data.length) {
          setItems(data as MenuItem[]);
          return;
        }
      }
      const { data } = await supabase.from("menu_items").select("*").order("display_order");
      if (cancelled) return;
      if (data && data.length) setItems(data as MenuItem[]);
    })();
    return () => { cancelled = true; };
  }, [pageId]);

  const active = items.filter((i) => i.is_active);
  const roots = active.filter((i) => !i.parent_id);
  const childrenOf = (pid: string) => active.filter((i) => i.parent_id === pid);

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
          {roots.map((n) => {
            const subs = childrenOf(n.id);
            if (subs.length === 0) {
              return (
                <a key={n.id} href={n.href} className="px-3 py-2 hover:text-gold transition-colors">
                  {n.label.toUpperCase()}
                </a>
              );
            }
            return (
              <div key={n.id} className="relative group">
                <a href={n.href} className="px-3 py-2 hover:text-gold transition-colors inline-flex items-center gap-1">
                  {n.label.toUpperCase()}
                  <ChevronDown className="h-3 w-3" />
                </a>
                <div className="absolute left-0 top-full hidden group-hover:block bg-primary border border-white/10 shadow-xl min-w-[200px] z-40">
                  {subs.map((s) => (
                    <a key={s.id} href={s.href} className="block px-4 py-2 text-xs hover:bg-white/10 hover:text-gold">
                      {s.label.toUpperCase()}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2 ml-2">
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
          <nav className="p-4 space-y-1">
            {roots.map((n) => (
              <div key={n.id}>
                <a href={n.href} onClick={() => setOpen(false)} className="block py-3 border-b border-white/10 font-semibold">
                  {n.label.toUpperCase()}
                </a>
                {childrenOf(n.id).map((s) => (
                  <a key={s.id} href={s.href} onClick={() => setOpen(false)} className="block py-2 pl-4 border-b border-white/10 text-sm opacity-90">
                    → {s.label.toUpperCase()}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
