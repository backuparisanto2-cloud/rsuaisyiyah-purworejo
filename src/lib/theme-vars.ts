export type ThemeRow = Record<string, string>;

export const THEME_COLUMNS = [
  "primary_color",
  "primary_dark",
  "primary_foreground",
  "secondary_color",
  "secondary_foreground",
  "accent_color",
  "accent_foreground",
  "gold_color",
  "background_color",
  "foreground_color",
  "muted_color",
  "muted_foreground",
  "border_color",
  "ring_color",
  "destructive_color",
] as const;

export const VAR_MAP: Record<string, string> = {
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

/** Maps a theme_settings row to a list of [cssVar, value] pairs. */
export function themeVarPairs(row: ThemeRow | null | undefined): Array<[string, string]> {
  if (!row) return [];
  const pairs: Array<[string, string]> = [];
  for (const [col, cssVar] of Object.entries(VAR_MAP)) {
    const v = row[col];
    if (v) pairs.push([cssVar, v]);
  }
  // Mirror card/popover/input for consistency
  if (row.background_color) {
    pairs.push(["--card", row.background_color]);
    pairs.push(["--popover", row.background_color]);
  }
  if (row.foreground_color) {
    pairs.push(["--card-foreground", row.foreground_color]);
    pairs.push(["--popover-foreground", row.foreground_color]);
  }
  if (row.border_color) pairs.push(["--input", row.border_color]);
  return pairs;
}

/** CSS text injected in <head> so the very first paint uses the admin theme. */
export function themeCssText(row: ThemeRow | null | undefined): string {
  const pairs = themeVarPairs(row);
  if (!pairs.length) return "";
  return `:root{${pairs.map(([k, v]) => `${k}:${v};`).join("")}}`;
}

/** Applies theme vars to the document at runtime (client only). */
export function applyThemeVars(row: ThemeRow | null | undefined) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [k, v] of themeVarPairs(row)) root.style.setProperty(k, v);
}

export const THEME_STORAGE_KEY = "app_theme_settings";
