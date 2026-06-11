import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Range = { from: string; to: string };

function validate(input: unknown): Range {
  const i = (input ?? {}) as Partial<Range>;
  const to = i.to ?? new Date().toISOString();
  const from = i.from ?? new Date(Date.now() - 30 * 86400_000).toISOString();
  if (isNaN(Date.parse(from)) || isNaN(Date.parse(to))) {
    throw new Error("Invalid date range");
  }
  return { from, to };
}

export const getVisitorStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Admin check
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Range query
    const { data: rangeRows, error: e1 } = await supabaseAdmin
      .from("page_views")
      .select("id, session_id, path, device, browser, os, country, ip, duration_ms, is_bounce, created_at, referrer")
      .gte("created_at", data.from)
      .lte("created_at", data.to)
      .order("created_at", { ascending: false })
      .limit(20000);
    if (e1) throw new Error(e1.message);

    const rows = rangeRows ?? [];

    // All-time totals (cheap counts)
    const { count: totalAll } = await supabaseAdmin
      .from("page_views")
      .select("id", { count: "exact", head: true });

    // Aggregations
    const sessions = new Set<string>();
    const byDevice: Record<string, number> = {};
    const byBrowser: Record<string, number> = {};
    const byOs: Record<string, number> = {};
    const byCountry: Record<string, number> = {};
    const byPath: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    let bounces = 0;
    let totalDuration = 0;

    for (const r of rows as any[]) {
      sessions.add(r.session_id);
      byDevice[r.device || "unknown"] = (byDevice[r.device || "unknown"] || 0) + 1;
      byBrowser[r.browser || "Other"] = (byBrowser[r.browser || "Other"] || 0) + 1;
      byOs[r.os || "Other"] = (byOs[r.os || "Other"] || 0) + 1;
      byCountry[r.country || "—"] = (byCountry[r.country || "—"] || 0) + 1;
      byPath[r.path] = (byPath[r.path] || 0) + 1;
      const day = String(r.created_at).slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
      if (r.is_bounce) bounces += 1;
      totalDuration += Number(r.duration_ms) || 0;
    }

    return {
      range: data,
      totals: {
        views: rows.length,
        sessions: sessions.size,
        bounces,
        bounceRate: rows.length ? bounces / rows.length : 0,
        avgDurationMs: rows.length ? totalDuration / rows.length : 0,
        allTimeViews: totalAll ?? 0,
      },
      byDevice,
      byBrowser,
      byOs,
      byCountry,
      byPath,
      byDay,
      recent: rows.slice(0, 500),
    };
  });
