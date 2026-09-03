import { lazy, Suspense, useEffect, useRef, useState } from "react";
import sprite from "@/assets/aisha-sprite.png.asset.json";

const ChatbotPanel = lazy(() => import("./ChatbotPanel"));

const FRAMES = 14;
const POS_KEY = "aisha-fab-pos";
const EDGE_MARGIN = 8;
const DRAG_THRESHOLD = 6;

type Pos = { x: number; y: number };

function clampPos(x: number, y: number, w: number, h: number): Pos {
  return {
    x: Math.min(Math.max(x, EDGE_MARGIN), window.innerWidth - w - EDGE_MARGIN),
    y: Math.min(Math.max(y, EDGE_MARGIN), window.innerHeight - h - EDGE_MARGIN),
  };
}

export default function ChatbotArini() {
  const [open, setOpen] = useState(false);
  const [frame, setFrame] = useState(0);
  const [pos, setPos] = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);

  useEffect(() => {
    if (open) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES), 4000);
    return () => clearInterval(id);
  }, [open]);

  // Restore saved position on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (!raw || !btnRef.current) return;
      const saved = JSON.parse(raw) as Pos;
      const rect = btnRef.current.getBoundingClientRect();
      setPos(clampPos(saved.x, saved.y, rect.width, rect.height));
    } catch {
      /* ignore */
    }
  }, []);

  // Keep inside viewport on resize/rotate
  useEffect(() => {
    const onResize = () => {
      setPos((p) => {
        if (!p || !btnRef.current) return p;
        const rect = btnRef.current.getBoundingClientRect();
        return clampPos(p.x, p.y, rect.width, rect.height);
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    btn.setPointerCapture(e.pointerId);
    const rect = btn.getBoundingClientRect();
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: rect.left, origY: rect.top, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = dragState.current;
    const btn = btnRef.current;
    if (!st || !btn) return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    if (!st.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    st.moved = true;
    setDragging(true);
    setSnapping(false);
    const rect = btn.getBoundingClientRect();
    setPos(clampPos(st.origX + dx, st.origY + dy, rect.width, rect.height));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = dragState.current;
    dragState.current = null;
    if (!st) return;
    if (!st.moved) {
      setOpen(true);
      return;
    }
    setDragging(false);
    // Snap to nearest left/right edge
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2 < window.innerWidth / 2
      ? EDGE_MARGIN
      : window.innerWidth - rect.width - EDGE_MARGIN;
    const snapped = clampPos(targetX, rect.top, rect.width, rect.height);
    setSnapping(true);
    setPos(snapped);
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(snapped));
    } catch {
      /* ignore */
    }
    void e;
  };

  const style: React.CSSProperties = pos
    ? {
        left: pos.x,
        top: pos.y,
        touchAction: "none",
        transition: snapping ? "left 0.25s ease, top 0.25s ease" : undefined,
      }
    : {
        right: "1.5rem",
        bottom: "calc(1.5rem + 23px)",
        touchAction: "none",
      };

  return (
    <>
      {!open && (
        <button
          ref={btnRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            dragState.current = null;
            setDragging(false);
          }}
          className="fixed z-[10000] flex flex-col items-center gap-1"
          style={style}
          aria-label="Buka chat Aisha"
        >
          <span
            className={`relative block h-16 w-16 rounded-full overflow-hidden bg-white ring-2 ring-secondary shadow-2xl transition-transform ${
              dragging ? "scale-110 cursor-grabbing" : "hover:scale-105 cursor-grab"
            }`}
          >
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
