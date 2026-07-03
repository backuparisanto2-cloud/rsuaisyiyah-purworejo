import { lazy, Suspense, useState } from "react";
import arini from "@/assets/arini.png";

const ChatbotPanel = lazy(() => import("./ChatbotPanel"));

export default function ChatbotArini() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-2xl hover:bg-primary-dark transition-all animate-float"
          aria-label="Buka chat Aisha"
        >
          <div className="relative h-12 w-12 rounded-full overflow-hidden bg-white ring-2 ring-white shrink-0">
            <img src={arini} alt="Aisha" className="absolute inset-0 h-full w-full object-cover object-top scale-110" loading="lazy" decoding="async" />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-secondary ring-2 ring-white" />
          </div>
          <div className="text-left pr-2">
            <div className="text-xs opacity-80 leading-none">Tanya</div>
            <div className="font-bold leading-tight">Aisha</div>
          </div>
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
