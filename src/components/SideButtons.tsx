import { useEffect, useState } from "react";
import { Accessibility, Youtube, Facebook } from "lucide-react";
import { getRouteApi } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { A11Y_OPEN_EVENT } from "./AccessibilityWidget";

type Row = {
  id: string;
  key: string;
  label: string;
  url: string | null;
  wa_prolog: string | null;
  is_active: boolean;
  display_order: number;
};

const STORAGE_KEY = "app_side_buttons";
const rootApi = getRouteApi("__root__");

function IconFor({ k }: { k: string }) {
  switch (k) {
    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
          <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.13 1.6 5.93L0 24l6.39-1.67a11.85 11.85 0 0 0 5.65 1.44h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.16-1.23-6.13-3.37-8.45zM17.48 14.24c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.48.71.3 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-white" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1.2" fill="white" stroke="none" />
        </svg>
      );
    case "youtube":
      return <Youtube className="h-6 w-6 text-white" />;
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
          <path d="M19.6 6.9a5.4 5.4 0 0 1-3.2-1v7.9a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v3a2.7 2.7 0 1 0 1.9 2.6V2h2.9a5.4 5.4 0 0 0 5.2 4.9v-.0z"/>
        </svg>
      );
    case "facebook":
      return <Facebook className="h-6 w-6 fill-white stroke-white" />;
    case "accessibility":
      return <Accessibility className="h-5 w-5 text-white" />;
    default:
      return null;
  }
}

function bgFor(k: string) {
  switch (k) {
    case "whatsapp": return "bg-[#25D366]";
    case "instagram": return "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]";
    case "youtube": return "bg-[#FF0000]";
    case "tiktok": return "bg-black";
    case "facebook": return "bg-[#1877F2]";
    case "accessibility": return "bg-secondary";
    default: return "bg-primary";
  }
}

function hrefFor(r: Row): string | null {
  if (r.key === "whatsapp") {
    const digits = (r.url || "").replace(/\D/g, "");
    if (!digits) return null;
    const text = encodeURIComponent(r.wa_prolog || "Halo RSU Aisyiyah Purworejo");
    return `https://wa.me/${digits}?text=${text}`;
  }
  return r.url || null;
}

export default function SideButtons() {
  const [rows, setRows] = useState<Row[]>(FALLBACK);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("side_buttons")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (data && data.length) setRows(data as Row[]);
    };
    void load();
    const channel = supabase
      .channel("side_buttons_public")
      .on("postgres_changes", { event: "*", schema: "public", table: "side_buttons" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div
      className="fixed top-1/2 -translate-y-1/2 z-[9999] flex flex-col gap-2 sm:gap-2.5 items-center max-h-[70svh] overflow-y-auto no-scrollbar py-1 pointer-events-auto"
      style={{ right: "max(0.5rem, env(safe-area-inset-right))" }}
    >
      {rows.map((r) => {
        const common = `${bgFor(r.key)} h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/70 hover:scale-110 transition-transform`;
        if (r.key === "accessibility") {
          return (
            <button
              key={r.id}
              onClick={() => window.dispatchEvent(new CustomEvent(A11Y_OPEN_EVENT))}
              aria-label={r.label}
              className={common}
            >
              <IconFor k={r.key} />
            </button>
          );
        }
        const href = hrefFor(r);
        if (!href) return null;
        return (
          <a
            key={r.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={r.label}
            className={common}
          >
            <IconFor k={r.key} />
          </a>
        );
      })}
    </div>
  );
}

