import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { detectRouteOrigin } from "@/lib/route-info";

const BodySchema = z.object({
  origin: z.string().min(2).max(120),
});

export const Route = createFileRoute("/api/public/chatbot-route")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip =
          request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "anon";
        const { rateLimit, getRouteInfo } = await import("@/lib/route-info.server");
        if (!rateLimit(`route:${ip}`, 12, 60_000)) {
          return new Response(JSON.stringify({ error: "Terlalu banyak permintaan. Coba lagi sebentar." }), {
            status: 429,
            headers: { "Content-Type": "application/json" },
          });
        }

        let body: z.infer<typeof BodySchema>;
        try {
          body = BodySchema.parse(await request.json());
        } catch {
          return new Response(JSON.stringify({ error: "Permintaan tidak valid." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const originKey = detectRouteOrigin(body.origin);
        if (!originKey) {
          return new Response(JSON.stringify({ error: "Lokasi asal tidak dikenal. Sebutkan kota seperti Yogyakarta, Magelang, atau Kebumen." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const info = await getRouteInfo(originKey);
        return new Response(JSON.stringify(info), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
