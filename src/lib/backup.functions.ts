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

// Foreign-key relationships documented manually so the export carries
// relational context alongside the raw data.
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

export const createFullBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Admin gate
    const { data: roles, error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (roleErr) throw new Error(roleErr.message);
    if (!roles?.some((r: { role: string }) => r.role === "admin")) {
      throw new Error("Akses ditolak: hanya admin");
    }

    const zip = new JSZip();
    const dataDir = zip.folder("data")!;
    const schema: Record<string, { columns: string[]; row_count: number; relations: { column: string; references: string }[] }> = {};

    // Dump tables
    for (const t of TABLES) {
      const { data, error } = await supabaseAdmin.from(t).select("*");
      if (error) {
        dataDir.file(`${t}.error.txt`, error.message);
        continue;
      }
      const rows = (data ?? []) as Record<string, unknown>[];
      dataDir.file(`${t}.json`, JSON.stringify(rows, null, 2));
      const cols = rows[0] ? Object.keys(rows[0]) : [];
      schema[t] = { columns: cols, row_count: rows.length, relations: RELATIONS[t] ?? [] };
    }

    // Storage: dump every bucket
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
        // Folders have no id/metadata
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

    for (const b of buckets ?? []) {
      await walk(b.name, "");
    }

    const manifest = {
      generated_at: new Date().toISOString(),
      generated_by: userId,
      tables: schema,
      buckets: (buckets ?? []).map((b) => ({ name: b.name, public: b.public })),
      storage_files: storageManifest,
      notes:
        "Restore tip: import data/*.json into the matching tables in order, then re-upload storage/<bucket>/<path> using supabase.storage. Relations are documented per-table in this manifest.",
    };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    zip.file(
      "README.txt",
      `Backup RSU Aisyiyah Purworejo\nDibuat: ${manifest.generated_at}\n\nIsi:\n- data/<table>.json: seluruh baris per tabel\n- storage/<bucket>/<path>: file media\n- manifest.json: skema kolom, relasi antar tabel, dan daftar file storage\n`,
    );

    const buf = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
    // Convert to base64 for transport via server fn
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < buf.length; i += chunk) {
      binary += String.fromCharCode(...buf.subarray(i, i + chunk));
    }
    const base64 = btoa(binary);
    return {
      filename: `backup-${manifest.generated_at.replace(/[:.]/g, "-")}.zip`,
      base64,
      size: buf.length,
      tables: Object.keys(schema).length,
      files: storageManifest.length,
    };
  });
