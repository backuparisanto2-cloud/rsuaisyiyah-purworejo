import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

/** Server-only helper to write an audit row. Safe to call from other server fns. */
export async function writeAuditEntry(params: {
  actorId: string | null;
  actorEmail?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let ipHash: string | null = null;
    try {
      const req = getRequest();
      const ip =
        req?.headers.get("cf-connecting-ip") ||
        req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        null;
      if (ip) {
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
        ipHash = Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      }
    } catch {}
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: params.actorId,
      actor_email: params.actorEmail ?? null,
      action: params.action,
      entity: params.entity ?? null,
      entity_id: params.entityId ?? null,
      metadata: (params.metadata ?? {}) as any,
      ip_hash: ipHash,
    });
  } catch (e) {
    console.error("[audit] failed to write entry", e);
  }
}

const ListInput = z.object({
  limit: z.number().int().min(1).max(200).default(100),
  offset: z.number().int().min(0).max(100_000).default(0),
  action: z.string().trim().max(100).optional(),
  entity: z.string().trim().max(100).optional(),
  actorEmail: z.string().trim().max(255).optional(),
});

export const listAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ListInput.parse(data ?? {}))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("audit_logs")
      .select("id, actor_id, actor_email, action, entity, entity_id, metadata, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (data.action) q = q.eq("action", data.action);
    if (data.entity) q = q.eq("entity", data.entity);
    if (data.actorEmail) q = q.ilike("actor_email", `%${data.actorEmail}%`);
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const listAuditFacets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("audit_logs")
      .select("action, entity")
      .order("created_at", { ascending: false })
      .limit(1000);
    const actions = Array.from(new Set((data ?? []).map((r: any) => r.action).filter(Boolean))).sort();
    const entities = Array.from(new Set((data ?? []).map((r: any) => r.entity).filter(Boolean))).sort();
    return { actions, entities };
  });
