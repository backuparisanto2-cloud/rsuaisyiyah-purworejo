// Client-safe route helpers shared between the browser (route card) and
// server (live duration/traffic lookup). Never read env vars here.

export type TrafficLevel = "Lancar" | "Cukup padat" | "Padat";

export type RouteInfo = {
  originKey: string;
  originLabel: string;
  destination: string;
  available: boolean;
  durationText?: string;
  distanceText?: string;
  traffic?: TrafficLevel;
  gmapsUrl: string;
  navUrl: string;
  embedUrl: string;
  waShareUrl: string;
  fetchedAt: string;
};

export const ROUTE_ORIGINS = {
  yogyakarta: {
    label: "Yogyakarta",
    waypoint: "Yogyakarta, Daerah Istimewa Yogyakarta",
    keywords: ["yogyakarta", "yogya", "jogja", "jogjakarta"],
  },
  yia: {
    label: "Bandara YIA",
    waypoint: "Yogyakarta International Airport, Kulon Progo, Daerah Istimewa Yogyakarta",
    keywords: ["bandara yia", "bandara yogyakarta", "bandara internasional yogyakarta"],
  },
  magelang: {
    label: "Magelang",
    waypoint: "Magelang, Jawa Tengah",
    keywords: ["magelang"],
  },
  kebumen: {
    label: "Kebumen",
    waypoint: "Kebumen, Jawa Tengah",
    keywords: ["kebumen"],
  },
} as const;

export type RouteOriginKey = keyof typeof ROUTE_ORIGINS;

const ORDER: RouteOriginKey[] = ["yia", "yogyakarta", "magelang", "kebumen"];

export function detectRouteOrigin(text: string): RouteOriginKey | null {
  const t = ` ${text.toLowerCase()} `;
  for (const key of ORDER) {
    for (const kw of ROUTE_ORIGINS[key].keywords) {
      if (kw.includes(" ")) {
        if (t.includes(kw)) return key;
      } else {
        // Match whole words only ("jogja" must not match inside "tanjogjapan").
        const re = new RegExp(`[\\s,.!?;:"']${kw}[\\s,.!?;:"']`, "i");
        if (re.test(t)) return key;
      }
    }
  }
  return null;
}

export function buildRouteLinks(originKey: RouteOriginKey, destination: string) {
  const origin = ROUTE_ORIGINS[originKey];
  const o = encodeURIComponent(origin.waypoint);
  const d = encodeURIComponent(destination);
  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=driving`;
  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${d}&travelmode=driving`;
  // Keyless embed (no API key needed, works on any domain).
  const embedUrl = `https://maps.google.com/maps?saddr=${o}&daddr=${d}&output=embed`;
  const waShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Rute menuju RSU Aisyiyah Purworejo: ${gmapsUrl}`
  )}`;
  return { gmapsUrl, navUrl, embedUrl, waShareUrl };
}
