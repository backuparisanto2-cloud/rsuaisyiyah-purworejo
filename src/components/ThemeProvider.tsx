import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  applyThemeVars,
  THEME_STORAGE_KEY,
  type ThemeRow,
} from "@/lib/theme-vars";

export default function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: ThemeRow | null;
}) {
  useEffect(() => {
    let alive = true;

    // 1) Terapkan tema dari server (SSR sudah menyisipkan CSS, ini penjaga saat navigasi klien)
    if (initialTheme) {
      applyThemeVars(initialTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(initialTheme));
      } catch {
        /* ignore */
      }
    } else {
      // 2) Cadangan dari localStorage bila server belum menyediakan
      try {
        const cached = localStorage.getItem(THEME_STORAGE_KEY);
        if (cached) applyThemeVars(JSON.parse(cached) as ThemeRow);
      } catch {
        /* ignore */
      }
    }

    const load = async () => {
      const { data } = await supabase.from("theme_settings").select("*").maybeSingle();
      if (!alive || !data) return;
      const row = data as unknown as ThemeRow;
      applyThemeVars(row);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(row));
      } catch {
        /* ignore */
      }
    };

    const ch = supabase
      .channel("theme_settings_public")
      .on("postgres_changes", { event: "*", schema: "public", table: "theme_settings" }, load)
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, [initialTheme]);

  return <>{children}</>;
}
