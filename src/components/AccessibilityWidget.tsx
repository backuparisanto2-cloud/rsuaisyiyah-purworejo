import { useEffect, useState } from "react";
import { Accessibility, Plus, Minus, Contrast, Eye, RotateCcw, X } from "lucide-react";

type Settings = {
  fontScale: number;
  contrast: boolean;
  grayscale: boolean;
  underline: boolean;
  bigCursor: boolean;
};

const DEFAULT: Settings = {
  fontScale: 1,
  contrast: false,
  grayscale: false,
  underline: false,
  bigCursor: false,
};

export const A11Y_OPEN_EVENT = "a11y:open";

export default function AccessibilityWidget({ showTrigger = true }: { showTrigger?: boolean }) {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<Settings>(() => {
    if (typeof window === "undefined") return DEFAULT;
    try {
      return { ...DEFAULT, ...JSON.parse(localStorage.getItem("a11y") || "{}") };
    } catch {
      return DEFAULT;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${s.fontScale * 100}%`;
    root.classList.toggle("a11y-contrast", s.contrast);
    root.classList.toggle("a11y-grayscale", s.grayscale);
    root.classList.toggle("a11y-underline", s.underline);
    root.classList.toggle("a11y-big-cursor", s.bigCursor);
    localStorage.setItem("a11y", JSON.stringify(s));
  }, [s]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(A11Y_OPEN_EVENT, handler);
    return () => window.removeEventListener(A11Y_OPEN_EVENT, handler);
  }, []);

  const set = (k: keyof Settings, v: Settings[keyof Settings]) => setS((p) => ({ ...p, [k]: v }));

  return (
    <>
      {showTrigger && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Buka menu aksesibilitas difabel"
          className="fixed right-3 top-1/2 z-40 mt-[60px] h-10 w-10 rounded-xl bg-secondary text-secondary-foreground shadow-lg ring-2 ring-white/70 hover:scale-110 transition-transform flex items-center justify-center"
        >
          <Accessibility className="h-5 w-5" />
        </button>
      )}

      {open && (
        <div className="fixed right-3 top-1/2 mt-[110px] z-[10001] w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-card border shadow-2xl overflow-hidden">
          <div className="bg-secondary text-secondary-foreground p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <Accessibility className="h-5 w-5" /> Aksesibilitas
            </div>
            <button onClick={() => setOpen(false)} aria-label="Tutup"><X className="h-4 w-4" /></button>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <div>
              <div className="font-semibold mb-1">Ukuran Teks</div>
              <div className="flex items-center gap-2">
                <button onClick={() => set("fontScale", Math.max(0.85, s.fontScale - 0.1))} className="h-8 w-8 rounded-md border flex items-center justify-center hover:bg-accent" aria-label="Kecilkan teks">
                  <Minus className="h-4 w-4" />
                </button>
                <div className="flex-1 text-center font-semibold">{Math.round(s.fontScale * 100)}%</div>
                <button onClick={() => set("fontScale", Math.min(1.5, s.fontScale + 0.1))} className="h-8 w-8 rounded-md border flex items-center justify-center hover:bg-accent" aria-label="Besarkan teks">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Toggle label="Kontras Tinggi" icon={<Contrast className="h-4 w-4" />} on={s.contrast} onChange={(v) => set("contrast", v)} />
            <Toggle label="Mode Skala Abu-abu" icon={<Eye className="h-4 w-4" />} on={s.grayscale} onChange={(v) => set("grayscale", v)} />
            <Toggle label="Garis Bawah Tautan" icon={<span className="underline text-xs">A</span>} on={s.underline} onChange={(v) => set("underline", v)} />
            <Toggle label="Kursor Besar" icon={<span className="text-xs">▶</span>} on={s.bigCursor} onChange={(v) => set("bigCursor", v)} />

            <button onClick={() => setS(DEFAULT)} className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-md border hover:bg-accent text-sm font-semibold">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Toggle({ label, icon, on, onChange }: { label: string; icon: React.ReactNode; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="w-full flex items-center justify-between p-2 rounded-md border hover:bg-accent">
      <span className="flex items-center gap-2">{icon} {label}</span>
      <span className={`h-5 w-9 rounded-full relative transition-colors ${on ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? "left-4" : "left-0.5"}`} />
      </span>
    </button>
  );
}
