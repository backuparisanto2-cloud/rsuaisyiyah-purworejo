import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PROTECTED_EMAIL = "rsaisyiyahpurworejo@gmail.com";

const RoleEnum = z.enum(["admin", "editor", "reader"]);

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

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const all: any[] = [];
    let page = 1;
    // paginate
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error(error.message);
      all.push(...data.users);
      if (data.users.length < 200) break;
      page++;
      if (page > 25) break;
    }

    const ids = all.map((u) => u.id);
    const [{ data: roles }, { data: profiles }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
      supabaseAdmin.from("profiles").select("id, display_name").in("id", ids),
    ]);
    const roleMap = new Map<string, string>();
    // pick highest role per user
    const rank: Record<string, number> = { admin: 3, editor: 2, reader: 1, user: 0 };
    (roles ?? []).forEach((r: any) => {
      const prev = roleMap.get(r.user_id);
      if (!prev || (rank[r.role] ?? 0) > (rank[prev] ?? 0)) roleMap.set(r.user_id, r.role);
    });
    const nameMap = new Map<string, string | null>(
      (profiles ?? []).map((p: any) => [p.id, p.display_name]),
    );

    return all
      .map((u) => ({
        id: u.id,
        email: u.email ?? "",
        displayName: nameMap.get(u.id) ?? null,
        role: (roleMap.get(u.id) as "admin" | "editor" | "reader" | "user" | undefined) ?? null,
        isProtected: (u.email ?? "").toLowerCase() === PROTECTED_EMAIL,
        createdAt: u.created_at,
      }))
      .sort((a, b) => (a.email || "").localeCompare(b.email || ""));
  });

export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        email: z.string().email().max(255),
        password: z.string().min(8).max(128),
        displayName: z.string().trim().max(100).optional(),
        role: RoleEnum,
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: data.displayName ? { display_name: data.displayName } : undefined,
    });
    if (error) throw new Error(error.message);
    const userId = created.user!.id;

    // ensure profile row (trigger should create it, but be safe)
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, email: data.email, display_name: data.displayName ?? data.email.split("@")[0] });

    // clear any auto-assigned role (e.g. protected email) then set requested
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: data.role });
    if (roleErr) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(roleErr.message);
    }
    return { id: userId };
  });

export const updateAdminUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), role: RoleEnum }).parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: target } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (!target?.user) throw new Error("Pengguna tidak ditemukan");
    if ((target.user.email ?? "").toLowerCase() === PROTECTED_EMAIL && data.role !== "admin") {
      throw new Error("Role admin pertama tidak dapat diturunkan");
    }

    // Replace role rows with the single target role (trigger blocks removing last admin)
    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    const hadAdmin = (existing ?? []).some((r: any) => r.role === "admin");

    if (hadAdmin && data.role !== "admin") {
      // ensure at least one other admin exists
      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) <= 1) throw new Error("Harus tersisa minimal satu admin");
    }

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetAdminUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), password: z.string().min(8).max(128) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("Tidak dapat menghapus akun sendiri");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: target } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if ((target?.user?.email ?? "").toLowerCase() === PROTECTED_EMAIL) {
      throw new Error("Admin pertama tidak dapat dihapus");
    }

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
