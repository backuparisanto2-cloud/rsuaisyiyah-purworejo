import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

import { THEME_COLUMNS, type ThemeRow } from "./theme-vars";

let cache: { at: number; row: ThemeRow | null } | null = null;
const TTL_MS = 60_000;

export const getThemeSettings = createServerFn({ method: "GET" }).handler(async () => {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.row;

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
      .from("theme_settings")
      .select(THEME_COLUMNS.join(","))
      .limit(1)
      .maybeSingle();

    const row = (data as unknown as ThemeRow) ?? null;
    cache = { at: now, row };
    return row;
  } catch {
    return null;
  }
});
