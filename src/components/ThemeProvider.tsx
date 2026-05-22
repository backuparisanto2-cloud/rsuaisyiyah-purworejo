import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const VAR_MAP: Record<string, string> = {
  primary_color: "--primary",
  primary_dark: "--primary-dark",
  primary_foreground: "--primary-foreground",
  secondary_color: "--secondary",
  secondary_foreground: "--secondary-foreground",
  accent_color: "--accent",
  accent_foreground: "--accent-foreground",
  gold_color: "--gold",
  background_color: "--background",
  foreground_color: "--foreground",
  muted_color: "--muted",
  muted_foreground: "--muted-foreground",
  border_color: "--border",
  ring_color: "--ring",
  destructive_color: "--destructive",
};

function apply(row: Record<string, string>) {
  const root = document.documentElement;
  for (const [col, cssVar] of Object.entries(VAR_MAP)) {
    const v = row[col];
    if (v) root.style.setProperty(cssVar, v);
  }
  // Mirror card/popover/input to match background/border for consistency
  if (row.background_color) {
    root.style.setProperty("--card", row.background_color);
    root.style.setProperty("--popover", row.background_color);
  }
  if (row.foreground_color) {
    root.style.setProperty("--card-foreground", row.foreground_color);
    root.style.setProperty("--popover-foreground", row.foreground_color);
  }
  if (row.border_color) root.style.setProperty("--input", row.border_color);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data } = await supabase.from("theme_settings").select("*").maybeSingle();
      if (alive && data) apply(data as Record<string, string>);
    };
    void load();
    const ch = supabase
      .channel("theme_settings_public")
      .on("postgres_changes", { event: "*", schema: "public", table: "theme_settings" }, load)
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, []);
  return <>{children}</>;
}
