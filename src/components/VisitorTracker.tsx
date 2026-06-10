import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

function getSessionId() {
  if (typeof window === "undefined") return "";
  const KEY = "rsap_sid";
  let sid = sessionStorage.getItem(KEY);
  if (!sid) {
    sid = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    sessionStorage.setItem(KEY, sid);
  }
  return sid;
}

const SKIP = /^\/(administrator|auth|api)(\/|$)/;

export default function VisitorTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const startedRef = useRef<number>(0);
  const viewIdRef = useRef<string | null>(null);
  const lastPathRef = useRef<string | null>(null);

  // Send "end" for the previous view
  function flush() {
    const id = viewIdRef.current;
    if (!id) return;
    const duration = Date.now() - startedRef.current;
    const payload = JSON.stringify({
      sessionId: getSessionId(),
      path: lastPathRef.current ?? "/",
      event: "end",
      viewId: id,
      durationMs: duration,
    });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/public/track", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/public/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
      }
    } catch {}
    viewIdRef.current = null;
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (SKIP.test(pathname)) return;

    // Close previous view first
    flush();

    startedRef.current = Date.now();
    lastPathRef.current = pathname;
    const sid = getSessionId();
    const referrer = document.referrer || null;

    let cancelled = false;
    fetch("/api/public/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sid, path: pathname, referrer, event: "view" }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.id) viewIdRef.current = d.id;
      })
      .catch(() => {});

    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);

    return () => {
      cancelled = true;
      window.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
