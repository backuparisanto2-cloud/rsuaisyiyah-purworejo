import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLightMode } from "@/hooks/use-light-mode";

/**
 * Reveals its children with a light parallax-style rise + fade when scrolled into view.
 * Runs once per section. Disabled on low-end devices and for reduced-motion users.
 */
export default function ParallaxSection({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const light = useLightMode();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (light) {
      setVisible(true);
      return;
    }
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    if (visible || !ref.current) return;
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
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [light, visible]);

  if (light) return <>{children}</>;

  return (
    <div
      ref={ref}
      className={`parallax-section transition-[opacity,transform] duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: visible && delay ? `${delay}ms` : undefined, willChange: visible ? undefined : "opacity, transform" }}
    >
      {children}
    </div>
  );
}
