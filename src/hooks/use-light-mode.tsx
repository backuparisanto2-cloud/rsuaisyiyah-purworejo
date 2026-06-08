import { useEffect, useState } from "react";

/**
 * Detects low-end mobile devices / slow connections / reduced-motion users.
 * Returns false during SSR and on first client render to avoid hydration mismatch,
 * then settles to the real value after mount.
 */
export function useLightMode() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean; effectiveType?: string };
    };

    const smallScreen = window.innerWidth < 768;
    const lowCpu = (nav.hardwareConcurrency ?? 8) <= 4;
    const lowMem = (nav.deviceMemory ?? 8) <= 4;
    const saveData = nav.connection?.saveData === true;
    const slowNet = ["slow-2g", "2g", "3g"].includes(nav.connection?.effectiveType ?? "");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setLight(smallScreen && (lowCpu || lowMem || saveData || slowNet || reducedMotion || smallScreen));
  }, []);

  return light;
}
