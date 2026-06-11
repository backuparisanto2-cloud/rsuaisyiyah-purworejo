import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";

type Body = {
  sessionId: string;
  path: string;
  referrer?: string;
  event: "view" | "end";
  durationMs?: number;
  viewId?: string;
};

function parseUA(ua: string) {
  const u = ua || "";
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(u);
  const isTablet = /iPad|Tablet/i.test(u);
  const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";
  let browser = "Other";
  if (/Edg\//.test(u)) browser = "Edge";
  else if (/OPR\/|Opera/.test(u)) browser = "Opera";
  else if (/Chrome\//.test(u) && !/Edg\//.test(u)) browser = "Chrome";
  else if (/Firefox\//.test(u)) browser = "Firefox";
  else if (/Safari\//.test(u) && !/Chrome\//.test(u)) browser = "Safari";
  let os = "Other";
  if (/Windows/.test(u)) os = "Windows";
  else if (/Android/.test(u)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(u)) os = "iOS";
  else if (/Mac OS X/.test(u)) os = "macOS";
  else if (/Linux/.test(u)) os = "Linux";
  return { device, browser, os };
}

export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Body;
        try {
          body = await request.json();
        } catch {
          return new Response("bad json", { status: 400 });
        }
        if (!body?.sessionId || !body?.path || !body?.event) {
          return new Response("missing fields", { status: 400 });
        }
        // Block admin/auth/api paths defensively
        const p = String(body.path).slice(0, 500);
        if (/^\/(administrator|auth|api)(\/|$)/.test(p)) {
          return new Response("ignored", { status: 204 });
        }
        const ua = request.headers.get("user-agent") ?? "";
        const country =
          request.headers.get("cf-ipcountry") ||
          request.headers.get("x-vercel-ip-country") ||
          null;
        const ip =
          request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "";
        const ipHash = ip
          ? createHash("sha256").update(ip + "|rsap-salt").digest("hex").slice(0, 32)
          : null;
        const { device, browser, os } = parseUA(ua);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (body.event === "view") {
          const { data, error } = await supabaseAdmin
            .from("page_views")
            .insert({
              session_id: String(body.sessionId).slice(0, 64),
              path: p,
              referrer: body.referrer ? String(body.referrer).slice(0, 500) : null,
              device,
              browser,
              os,
              country,
              ip_hash: ipHash,
              duration_ms: 0,
              is_bounce: true,
            })
            .select("id")
            .single();
          if (error) return new Response(error.message, { status: 500 });
          return Response.json({ id: data.id });
        }

        // event === "end"
        if (!body.viewId) return new Response("missing viewId", { status: 400 });
        const duration = Math.max(0, Math.min(60 * 60 * 1000, Number(body.durationMs) || 0));
        const { error } = await supabaseAdmin
          .from("page_views")
          .update({
            duration_ms: duration,
            is_bounce: duration < 10_000,
            ended_at: new Date().toISOString(),
          })
          .eq("id", body.viewId);
        if (error) return new Response(error.message, { status: 500 });
        return new Response("ok");
      },
    },
  },
});
