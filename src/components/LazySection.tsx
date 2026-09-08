import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Defers rendering of its children until the placeholder approaches the viewport.
 * Use to keep below-the-fold sections out of the initial render path on low-end devices.
 * When `anchorId` is given, the placeholder is discoverable via [data-anchor] and the
 * content renders immediately if the current URL hash targets it.
 */
export default function LazySection({
  children,
  minHeight = 400,
  rootMargin = "300px",
  anchorId,
}: {
  children: ReactNode;
  minHeight?: number;
  rootMargin?: string;
  anchorId?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show || !ref.current) return;
    if (anchorId && window.location.hash.replace(/^#/, "") === anchorId) {
      setShow(true);
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [show, rootMargin, anchorId]);

  return (
    <div ref={ref} data-anchor={anchorId} style={show ? undefined : { minHeight }}>
      {show ? children : null}
    </div>
  );
}
