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

async function actorEmail(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle();
  return (data as any)?.email ?? null;
}

async function hashIpFromRequest(): Promise<string | null> {
  try {
    const req = getRequest();
    const ip =
      req?.headers.get("cf-connecting-ip") ||
      req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      null;
    if (!ip) return null;
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
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
    const ipHash = await hashIpFromRequest();
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

/**
 * Allowlist of client-callable audit actions. Add new entries here when an
 * admin UI screen should be able to record its own actions.
 */
const ClientActions = z.enum([
  "page.create",
  "page.update",
  "page.delete",
  "hero.update",
  "hero.logo.update",
  "contact.update",
  "instagram.create",
  "instagram.update",
  "instagram.delete",
  "instagram.reorder",
]);

const RecordInput = z.object({
  action: ClientActions,
  entity: z.string().trim().max(60).optional(),
  entityId: z.string().trim().max(200).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Lets admin UI screens record a high-level action after a successful mutation.
 * Actor and timestamp are taken from the validated session, not the client.
 */
export const recordAdminAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => RecordInput.parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    await writeAuditEntry({
      actorId: context.userId,
      actorEmail: await actorEmail(context.supabase, context.userId),
      action: data.action,
      entity: data.entity ?? null,
      entityId: data.entityId ?? null,
      metadata: data.metadata as Record<string, unknown> | undefined,
    });
    return { ok: true };
  });

const ListInput = z.object({
  limit: z.number().int().min(1).max(200).default(100),
  offset: z.number().int().min(0).max(100_000).default(0),
  action: z.string().trim().max(100).optional(),
  entity: z.string().trim().max(100).optional(),
  entityId: z.string().trim().max(200).optional(),
  actorEmail: z.string().trim().max(255).optional(),
  q: z.string().trim().max(255).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
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
    if (data.entityId) q = q.ilike("entity_id", `%${data.entityId}%`);
    if (data.actorEmail) q = q.ilike("actor_email", `%${data.actorEmail}%`);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    if (data.q) {
      const term = data.q.replace(/[%,]/g, " ").trim();
      if (term) {
        q = q.or(
          [
            `actor_email.ilike.%${term}%`,
            `action.ilike.%${term}%`,
            `entity.ilike.%${term}%`,
            `entity_id.ilike.%${term}%`,
          ].join(","),
        );
      }
    }
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
      .select("action, entity, actor_email")
      .order("created_at", { ascending: false })
      .limit(2000);
    const actions = Array.from(new Set((data ?? []).map((r: any) => r.action).filter(Boolean))).sort();
    const entities = Array.from(new Set((data ?? []).map((r: any) => r.entity).filter(Boolean))).sort();
    const actors = Array.from(new Set((data ?? []).map((r: any) => r.actor_email).filter(Boolean))).sort();
    return { actions, entities, actors };
  });
