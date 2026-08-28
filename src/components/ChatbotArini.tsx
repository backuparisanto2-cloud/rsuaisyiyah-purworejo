import { lazy, Suspense, useEffect, useState } from "react";
import sprite from "@/assets/aisha-sprite.png.asset.json";

const ChatbotPanel = lazy(() => import("./ChatbotPanel"));

const FRAMES = 14;

export default function ChatbotArini() {
  const [open, setOpen] = useState(false);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (open) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES), 4000);
    return () => clearInterval(id);
  }, [open]);

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed right-6 z-[10000] flex flex-col items-center gap-1"
          style={{ bottom: "calc(1.5rem + 23px)" }}
          aria-label="Buka chat Aisha"
        >
          <span className="relative block h-16 w-16 rounded-full overflow-hidden bg-white ring-2 ring-secondary shadow-2xl transition-transform hover:scale-105">
            <span
              className="absolute inset-0"
              aria-hidden="true"
              style={{
                backgroundImage: `url(${sprite.url})`,
                backgroundSize: `${FRAMES * 100}% 100%`,
                backgroundPosition: `${(frame / (FRAMES - 1)) * 100}% center`,
                backgroundRepeat: "no-repeat",
              }}
            />
            <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-secondary ring-2 ring-white" />
          </span>
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground shadow">
            Tanya Aisha
          </span>
        </button>
      )}

      {open && (
        <Suspense fallback={null}>
          <ChatbotPanel onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
