const HEADER_OFFSET = 100;

function scrollToEl(el: Element) {
  const top = window.scrollY + el.getBoundingClientRect().top - HEADER_OFFSET;
  window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
}

/**
 * Scrolls to an in-page anchor, waiting for lazily rendered sections.
 * Placeholders rendered by LazySection carry data-anchor="<id>"; scrolling them
 * into view triggers the real section to mount, then we retarget the real element.
 */
export function scrollToAnchor(id: string, tries = 0) {
  if (typeof window === "undefined") return;
  const clean = id.replace(/^#/, "");
  if (!clean) return;

  const el = document.getElementById(clean);
  if (el) {
    scrollToEl(el);
    // Sections above may still expand while lazy content mounts: re-align shortly after.
    if (tries < 6) {
      window.setTimeout(() => {
        const again = document.getElementById(clean);
        if (again) scrollToEl(again);
      }, 450);
    }
    return;
  }

  const placeholder = document.querySelector(`[data-anchor="${clean}"]`);
  if (placeholder) {
    placeholder.scrollIntoView({ block: "start" });
  }

  if (tries < 30) {
    window.setTimeout(() => scrollToAnchor(clean, tries + 1), 100);
  }
}
