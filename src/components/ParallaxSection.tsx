import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Reveals its children with a light parallax-style rise + fade when scrolled into view.
 * Runs once per section.
 * - Genuinely weak devices (reduced motion, save-data, slow network, low CPU/RAM)
 *   get no animation at all: content renders immediately.
 * - Small screens keep the effect, but with a shorter distance and duration.
 */

function detectCapability(): "off" | "light" | "full" {
  if (typeof window === "undefined") return "off";
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = nav.connection?.saveData === true;
  const slowNet = ["slow-2g", "2g", "3g"].includes(nav.connection?.effectiveType ?? "");
  const lowCpu = (nav.hardwareConcurrency ?? 8) <= 4;
  const lowMem = (nav.deviceMemory ?? 8) <= 4;
  if (reducedMotion || saveData || slowNet || lowCpu || lowMem) return "off";
  return window.innerWidth < 768 ? "light" : "full";
}

export default function ParallaxSection({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"off" | "light" | "full">("full");
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const m = detectCapability();
    setMode(m);
    setReady(true);
    if (m === "off") setVisible(true);
  }, []);

  useEffect(() => {
    if (!ready || mode === "off" || visible || !ref.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ready, mode, visible]);

  if (ready && mode === "off") return <>{children}</>;

  const distance = mode === "light" ? 14 : 26;
  const duration = mode === "light" ? 420 : 650;

  return (
    <div
      ref={ref}
      className="parallax-section"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate3d(0,0,0)" : `translate3d(0,${distance}px,0)`,
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        transitionDelay: visible && delay ? `${delay}ms` : undefined,
        willChange: visible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
