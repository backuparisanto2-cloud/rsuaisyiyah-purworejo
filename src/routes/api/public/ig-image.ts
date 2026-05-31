import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/ig-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const target = url.searchParams.get("u");
        if (!target) return new Response("Missing u", { status: 400 });

        let parsed: URL;
        try {
          parsed = new URL(target);
        } catch {
          return new Response("Bad URL", { status: 400 });
        }
        const host = parsed.hostname;
        const allowed =
          host.endsWith("cdninstagram.com") ||
          host.endsWith("fbcdn.net") ||
          host.endsWith("elfsight.com") ||
          host.endsWith("elfsightcdn.com") ||
          host === "instagram.com" ||
          host.endsWith(".instagram.com");
        if (!allowed) return new Response("Host not allowed", { status: 400 });

        const upstream = await fetch(parsed.toString(), {
          headers: {
            Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          },
        });
        if (!upstream.ok) {
          return new Response(`Upstream ${upstream.status}`, {
            status: upstream.status,
          });
        }
        const contentType =
          upstream.headers.get("content-type") ?? "image/jpeg";
        return new Response(upstream.body, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});
