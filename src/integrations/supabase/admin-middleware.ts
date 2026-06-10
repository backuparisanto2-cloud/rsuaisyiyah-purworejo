import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "./auth-middleware";

/**
 * Ensures the caller is authenticated AND has the `admin` role in
 * `public.user_roles`. Throws a generic Forbidden error otherwise so we don't
 * leak role/membership details.
 */
export const requireSupabaseAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) throw new Error("Forbidden");
    if (!data) throw new Error("Forbidden: admin only");
    return next({ context });
  });
