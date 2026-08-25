import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export type SideButtonRow = {
  id: string;
  key: string;
  label: string;
  url: string | null;
  wa_prolog: string | null;
  is_active: boolean;
  display_order: number;
};

let cache: { at: number; rows: SideButtonRow[] | null } | null = null;
const TTL_MS = 60_000;

export const getSideButtons = createServerFn({ method: "GET" }).handler(async () => {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.rows;

  try {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return null;

    const supabasePublic = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input as RequestInfo, { ...init, headers: h });
        },
      },
    });

    const { data } = await supabasePublic
      .from("side_buttons")
      .select("id,key,label,url,wa_prolog,is_active,display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    const rows = (data as unknown as SideButtonRow[]) ?? null;
    cache = { at: now, rows };
    return rows;
  } catch {
    return null;
  }
});
