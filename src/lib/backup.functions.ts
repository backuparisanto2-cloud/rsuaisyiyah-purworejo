import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import JSZip from "jszip";

const TABLES = [
  "about_page",
  "chatbot_knowledge",
  "chatbot_settings",
  "contact_settings",
  "custom_pages",
  "doctor_schedules",
  "doctors",
  "faqs",
  "hero_content",
  "hero_settings",
  "hero_slides",
  "home_sections",
  "instagram_posts",
  "menu_items",
  "page_menu_items",
  "partners",
  "profiles",
  "services",
  "theme_settings",
  "user_roles",
  "visiting_hours",
] as const;

const RELATIONS: Record<string, { column: string; references: string }[]> = {
  doctor_schedules: [{ column: "doctor_id", references: "doctors.id" }],
  page_menu_items: [
    { column: "page_id", references: "custom_pages.id" },
    { column: "parent_id", references: "page_menu_items.id" },
  ],
  menu_items: [{ column: "parent_id", references: "menu_items.id" }],
  user_roles: [{ column: "user_id", references: "auth.users.id" }],
  profiles: [{ column: "id", references: "auth.users.id" }],
};

// Order matters when restoring: parents first, then children
const RESTORE_ORDER = [
  "profiles",
  "user_roles",
  "about_page",
  "hero_content",
  "hero_settings",
  "hero_slides",
  "home_sections",
  "contact_settings",
  "theme_settings",
  "chatbot_settings",
  "chatbot_knowledge",
  "services",
  "partners",
  "faqs",
  "visiting_hours",
  "instagram_posts",
  "doctors",
  "doctor_schedules",
  "custom_pages",
  "page_menu_items",
  "menu_items",
] as const;

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const cols = Array.from(
    rows.reduce<Set<string>>((acc, r) => {
      Object.keys(r).forEach((k) => acc.add(k));
      return acc;
    }, new Set()),
  );
  const esc = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const head = cols.join(",");
  const body = rows.map((r) => cols.map((c) => esc(r[c])).join(",")).join("\n");
  return head + "\n" + body;
}

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: roles, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  if (!roles?.some((r: { role: string }) => r.role === "admin")) {
    throw new Error("Akses ditolak: hanya admin");
  }
}

export const createFullBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { format?: "json" | "csv" | "both" } | undefined) => data ?? {})
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    const format = data?.format ?? "both";
    await assertAdmin(userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const zip = new JSZip();
    const jsonDir = zip.folder("data")!;
    const csvDir = zip.folder("csv")!;
    const schema: Record<string, { columns: string[]; row_count: number; relations: { column: string; references: string }[] }> = {};

    for (const t of TABLES) {
      const { data: rows, error } = await supabaseAdmin.from(t).select("*");
      if (error) {
        jsonDir.file(`${t}.error.txt`, error.message);
        continue;
      }
      const list = (rows ?? []) as Record<string, unknown>[];
      if (format === "json" || format === "both") {
        jsonDir.file(`${t}.json`, JSON.stringify(list, null, 2));
      }
      if (format === "csv" || format === "both") {
        csvDir.file(`${t}.csv`, toCSV(list));
      }
      const cols = list[0] ? Object.keys(list[0]) : [];
      schema[t] = { columns: cols, row_count: list.length, relations: RELATIONS[t] ?? [] };
    }

    const { data: buckets, error: bErr } = await supabaseAdmin.storage.listBuckets();
    if (bErr) throw new Error(bErr.message);
    const storageManifest: { bucket: string; path: string; size: number }[] = [];
    const storageDir = zip.folder("storage")!;

    async function walk(bucket: string, prefix: string) {
      const { data: entries, error } = await supabaseAdmin.storage
        .from(bucket)
        .list(prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });
      if (error) return;
      for (const e of entries ?? []) {
        const full = prefix ? `${prefix}/${e.name}` : e.name;
        if (!e.id && !e.metadata) {
          await walk(bucket, full);
          continue;
        }
        const { data: file, error: dlErr } = await supabaseAdmin.storage.from(bucket).download(full);
        if (dlErr || !file) continue;
        const buf = new Uint8Array(await file.arrayBuffer());
        storageDir.file(`${bucket}/${full}`, buf);
        storageManifest.push({ bucket, path: full, size: buf.byteLength });
      }
    }
    for (const b of buckets ?? []) await walk(b.name, "");

    const manifest = {
      generated_at: new Date().toISOString(),
      generated_by: userId,
      format,
      tables: schema,
      buckets: (buckets ?? []).map((b) => ({ name: b.name, public: b.public })),
      storage_files: storageManifest,
      restore_order: RESTORE_ORDER,
      notes:
        "Restore: gunakan menu Restore di admin panel, atau impor data/<tabel>.json sesuai restore_order. File CSV bersifat read-only untuk analisa (Excel/Sheets).",
    };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    zip.file(
      "README.txt",
      `Backup RSU Aisyiyah Purworejo\nDibuat: ${manifest.generated_at}\nFormat: ${format}\n\nIsi:\n- data/<tabel>.json: data per tabel (untuk restore)\n- csv/<tabel>.csv: data per tabel (untuk analisa di Excel/Sheets)\n- storage/<bucket>/<path>: file media\n- manifest.json: skema, relasi, urutan restore, daftar file storage\n`,
    );

    const buf = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < buf.length; i += chunk) {
      binary += String.fromCharCode(...buf.subarray(i, i + chunk));
    }
    return {
      filename: `backup-${manifest.generated_at.replace(/[:.]/g, "-")}.zip`,
      base64: btoa(binary),
      size: buf.length,
      tables: Object.keys(schema).length,
      files: storageManifest.length,
      format,
    };
  });

type RestoreInput = {
  base64: string;
  mode?: "merge" | "replace";
  includeStorage?: boolean;
};

export const restoreFromBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: RestoreInput) => {
    if (!data || typeof data.base64 !== "string" || data.base64.length === 0) {
      throw new Error("File backup tidak valid");
    }
    return {
      base64: data.base64,
      mode: data.mode === "replace" ? "replace" : "merge",
      includeStorage: data.includeStorage !== false,
    } as Required<RestoreInput>;
  })
  .handler(async ({ context, data }) => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Decode base64 → bytes
    const bin = atob(data.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const zip = await JSZip.loadAsync(bytes);
    const log: { table: string; inserted: number; skipped: number; error?: string }[] = [];

    for (const t of RESTORE_ORDER) {
      const entry = zip.file(`data/${t}.json`);
      if (!entry) continue;
      try {
        const txt = await entry.async("string");
        const rows = JSON.parse(txt) as Record<string, unknown>[];
        if (!Array.isArray(rows)) {
          log.push({ table: t, inserted: 0, skipped: 0, error: "format tidak valid" });
          continue;
        }
        if (data.mode === "replace") {
          // Delete all existing rows (filter that always matches non-null id)
          const { error: delErr } = await supabaseAdmin.from(t).delete().not("id", "is", null);
          if (delErr) {
            // Some tables (e.g. with composite keys) may not have id; try generic
            await supabaseAdmin.from(t).delete().gte("created_at", "1900-01-01").throwOnError;
          }
        }
        if (rows.length === 0) {
          log.push({ table: t, inserted: 0, skipped: 0 });
          continue;
        }
        // Upsert in batches of 500
        let inserted = 0;
        const batchSize = 500;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          const { error: upErr } = await supabaseAdmin.from(t).upsert(batch, { onConflict: "id" });
          if (upErr) {
            // Fall back to insert without onConflict (e.g. composite PK tables)
            const { error: insErr } = await supabaseAdmin.from(t).insert(batch);
            if (insErr) {
              log.push({ table: t, inserted, skipped: rows.length - inserted, error: insErr.message });
              break;
            }
          }
          inserted += batch.length;
        }
        log.push({ table: t, inserted, skipped: rows.length - inserted });
      } catch (e) {
        log.push({ table: t, inserted: 0, skipped: 0, error: e instanceof Error ? e.message : String(e) });
      }
    }

    // Restore storage files
    let storageRestored = 0;
    let storageFailed = 0;
    if (data.includeStorage) {
      const storageFolder = zip.folder("storage");
      if (storageFolder) {
        const files: { path: string; bucket: string; key: string }[] = [];
        storageFolder.forEach((relPath, file) => {
          if (file.dir) return;
          const parts = relPath.split("/");
          if (parts.length < 2) return;
          const bucket = parts[0];
          const key = parts.slice(1).join("/");
          files.push({ path: `storage/${relPath}`, bucket, key });
        });
        for (const f of files) {
          const file = zip.file(f.path);
          if (!file) continue;
          const buf = await file.async("uint8array");
          const { error } = await supabaseAdmin.storage
            .from(f.bucket)
            .upload(f.key, buf, { upsert: true, contentType: "application/octet-stream" });
          if (error) storageFailed++;
          else storageRestored++;
        }
      }
    }

    return {
      mode: data.mode,
      log,
      storageRestored,
      storageFailed,
    };
  });
