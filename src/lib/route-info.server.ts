// Server-only route intelligence for Aisha: live travel duration and road
// status from whitelisted origins to the hospital, via the Google Maps
// gateway. Results are cached to keep billable Maps calls bounded.

import {
  ROUTE_ORIGINS,
  buildRouteLinks,
  type RouteInfo,
  type RouteOriginKey,
  type TrafficLevel,
} from "@/lib/route-info";

const CACHE_TTL_MS = 15 * 60 * 1000; // live traffic data stays fresh ~15 min
const FAIL_TTL_MS = 5 * 60 * 1000; // don't hammer the gateway after a failure

const cache = new Map<RouteOriginKey, { info: RouteInfo; expires: number }>();

let destCache: { value: string; expires: number } | null = null;
const DEST_TTL_MS = 60 * 60 * 1000;

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cur = rlMap.get(key);
  if (!cur || cur.reset < now) {
    rlMap.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (cur.count >= limit) return false;
  cur.count += 1;
  return true;
}
const rlMap = new Map<string, { count: number; reset: number }>();

const FALLBACK_DEST =
  "RSU Aisyiyah Purworejo, Jl. May Jend. Soetoyo No.113, Purworejo, Jawa Tengah";

async function getDestination(): Promise<string> {
  const now = Date.now();
  if (destCache && destCache.expires > now) return destCache.value;
  let value = FALLBACK_DEST;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("contact_settings")
      .select("address")
      .maybeSingle();
    if (data?.address) value = `RSU Aisyiyah Purworejo, ${data.address}`;
  } catch {
    // keep fallback destination
  }
  destCache = { value, expires: now + DEST_TTL_MS };
  return value;
}

function humanize(totalSeconds: number): string {
  const m = Math.round(totalSeconds / 60);
  if (m < 60) return `${m} menit`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} jam ${rest} menit` : `${h} jam`;
}

function trafficFromRatio(ratio: number): TrafficLevel {
  if (ratio <= 1.1) return "Lancar";
  if (ratio <= 1.3) return "Cukup padat";
  return "Padat";
}

/**
 * Live route info for a whitelisted origin. Never throws: on any failure it
 * returns the link-only variant (available: false) so the UI can still show
 * the map and navigation buttons.
 */
export async function getRouteInfo(originKey: RouteOriginKey): Promise<RouteInfo> {
  const now = Date.now();
  const hit = cache.get(originKey);
  if (hit && hit.expires > now) return hit.info;

  const origin = ROUTE_ORIGINS[originKey];
  const destination = await getDestination();
  const links = buildRouteLinks(originKey, destination);
  const base: RouteInfo = {
    originKey,
    originLabel: origin.label,
    destination,
    available: false,
    ...links,
    fetchedAt: new Date().toISOString(),
  };

  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
    console.warn("route-info: gateway credentials missing, link-only mode");
    cache.set(originKey, { info: base, expires: now + FAIL_TTL_MS });
    return base;
  }

  try {
    const resp = await fetch(
      "https://connector-gateway.lovable.dev/google_maps/routes/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
          "Content-Type": "application/json",
          "X-Goog-FieldMask": "routes.duration,routes.staticDuration,routes.distanceMeters",
        },
        body: JSON.stringify({
          origin: { waypoint: { address: origin.waypoint } },
          destination: { waypoint: { address: destination } },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE",
        }),
      }
    );

    if (resp.status === 403) {
      const body = await resp.text().catch(() => "");
      let reason = "";
      try {
        const details = (JSON.parse(body)?.error?.details ?? []) as Array<{ reason?: string }>;
        reason = details.find((d) => d.reason)?.reason ?? "";
      } catch {}
      console.error(
        `route-info: Maps gateway 403 (${reason || "PERMISSION_DENIED"}). ` +
          (reason === "API_KEY_HTTP_REFERRER_BLOCKED"
            ? "Set the server key's application restrictions to None or IP addresses in Google Cloud Console."
            : reason === "API_KEY_SERVICE_BLOCKED"
              ? "Add the Routes API to the server key's allowed-APIs list in Google Cloud Console."
              : "Check the server key's restrictions in Google Cloud Console.") +
          ` Body: ${body.slice(0, 300)}`
      );
      cache.set(originKey, { info: base, expires: now + FAIL_TTL_MS });
      return base;
    }

    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.error(`route-info: Maps gateway error [${resp.status}]: ${body.slice(0, 300)}`);
      cache.set(originKey, { info: base, expires: now + FAIL_TTL_MS });
      return base;
    }

    const json = (await resp.json()) as {
      routes?: Array<{ duration?: string; staticDuration?: string; distanceMeters?: number }>;
    };
    const r = json?.routes?.[0];
    const live = parseSeconds(r?.duration);
    if (live == null) {
      console.error("route-info: Maps response missing route duration");
      cache.set(originKey, { info: base, expires: now + FAIL_TTL_MS });
      return base;
    }
    const freeFlow = parseSeconds(r?.staticDuration) ?? live;
    const ratio = freeFlow > 0 ? live / freeFlow : 1;
    const km = (r?.distanceMeters ?? 0) / 1000;

    const info: RouteInfo = {
      ...base,
      available: true,
      durationText: humanize(live),
      distanceText: km > 0 ? `${km.toFixed(km < 20 ? 1 : 0)} km` : undefined,
      traffic: trafficFromRatio(ratio),
    };
    cache.set(originKey, { info, expires: now + CACHE_TTL_MS });
    return info;
  } catch (e) {
    console.error("route-info: lookup failed:", (e as Error).message);
    cache.set(originKey, { info: base, expires: now + FAIL_TTL_MS });
    return base;
  }
}

function parseSeconds(v?: string): number | null {
  if (!v) return null;
  const m = /^(\d+(?:\.\d+)?)s$/.exec(v);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}
