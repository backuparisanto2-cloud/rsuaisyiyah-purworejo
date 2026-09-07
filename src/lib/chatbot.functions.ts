import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAdmin } from "@/integrations/supabase/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const SITE_URL = "https://rsuaisyiyah-purworejo.lovable.app";
const EMBEDDING_MODEL = "openai/text-embedding-3-small"; // 1536 dims
const EMBEDDING_DIMS = 1536;

export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function callLovableAI(apiKey: string, system: string, user: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (res.status === 429) throw new Error("Terlalu banyak permintaan, coba lagi sebentar.");
  if (res.status === 402) throw new Error("Kredit Lovable AI habis. Silakan top up.");
  if (!res.ok) throw new Error(`AI error: ${res.status}`);
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content ?? "{}";
  try { return JSON.parse(content) as { entries?: { title: string; content: string }[] }; }
  catch { throw new Error("AI mengembalikan format tidak valid"); }
}

export async function embedTexts(apiKey: string, inputs: string[]): Promise<number[][]> {
  if (!inputs.length) return [];
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: inputs }),
  });
  if (res.status === 429) throw new Error("Permintaan AI terlalu banyak. Coba lagi sebentar.");
  if (res.status === 402) throw new Error("Kuota AI habis.");
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Embedding error ${res.status}: ${t.slice(0, 200)}`);
  }
  const j = await res.json();
  return (j.data ?? []).map((d: { embedding: number[] }) => d.embedding);
}

export function chunkText(text: string, target = 800, overlap = 80): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  if (!cleaned) return [];
  // Split by paragraphs first
  const paras = cleaned.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let cur = "";
  for (const p of paras) {
    if ((cur + "\n\n" + p).length <= target * 1.4) {
      cur = cur ? `${cur}\n\n${p}` : p;
    } else {
      if (cur) chunks.push(cur);
      if (p.length <= target * 1.4) {
        cur = p;
      } else {
        // Long paragraph: hard-split by sentence
        const sents = p.split(/(?<=[.!?])\s+/);
        let buf = "";
        for (const s of sents) {
          if ((buf + " " + s).length > target) {
            if (buf) chunks.push(buf.trim());
            buf = s;
          } else {
            buf = buf ? `${buf} ${s}` : s;
          }
        }
        if (buf) cur = buf.trim();
        else cur = "";
      }
    }
  }
  if (cur) chunks.push(cur);
  // Apply small overlap
  if (overlap > 0 && chunks.length > 1) {
    for (let i = 1; i < chunks.length; i++) {
      const tail = chunks[i - 1].slice(-overlap);
      chunks[i] = `${tail} ${chunks[i]}`.trim();
    }
  }
  return chunks;
}

function vectorLiteral(arr: number[]): string {
  return `[${arr.join(",")}]`;
}

/**
 * Fetch the published website + aggregate DB content, then use AI to extract
 * concise knowledge entries. Replaces all entries with source='website'.
 */
export const syncKnowledgeFromWebsite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAdmin])
  .inputValidator((input) =>
    z.object({ isActive: z.boolean().optional().default(true) }).parse(input ?? {})
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY belum dikonfigurasi");
    const { runKnowledgeSync } = await import("@/lib/chatbot-sync.server");
    return await runKnowledgeSync(apiKey, data.isActive);
  });

/**
 * Use Lovable AI to generate knowledge entries about the hospital from general internet knowledge.
 */
export const generateKnowledgeFromAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAdmin])
  .inputValidator((input) =>
    z.object({
      topic: z.string().min(3).max(500),
      isActive: z.boolean().optional().default(true),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY belum dikonfigurasi");

    const parsed = await callLovableAI(
      apiKey,
      "Anda asisten yang menghasilkan data pengetahuan rumah sakit dalam Bahasa Indonesia. Balas hanya JSON valid.",
      `Buat 5 entri pengetahuan singkat untuk chatbot RSU Aisyiyah Purworejo tentang topik: "${data.topic}".
Tiap entri harus relevan untuk pasien/pengunjung dan dapat dijawab oleh asisten virtual rumah sakit.
Balas HANYA JSON valid dengan bentuk: {"entries":[{"title":"...","content":"..."}]}`
    );

    const entries = (parsed.entries ?? []).filter((e) => e?.title && e?.content);
    if (!entries.length) return { count: 0 };

    const rows = entries.map((e) => ({
      title: e.title,
      content: e.content,
      source: "internet",
      is_active: data.isActive,
    }));
    const { error } = await supabaseAdmin.from("chatbot_knowledge").insert(rows);
    if (error) throw new Error(error.message);
    return { count: rows.length };
  });

/**
 * Ingest a long piece of text (from a pasted document or uploaded text file),
 * automatically chunk it, embed the chunks, and store as knowledge entries.
 */
export const ingestKnowledgeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAdmin])
  .inputValidator((input) =>
    z.object({
      title: z.string().min(1).max(200),
      text: z.string().min(20).max(200_000),
      category: z.string().min(1).max(60).default("umum"),
      sourceUrl: z.string().max(500).optional().nullable(),
      isActive: z.boolean().optional().default(true),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY belum dikonfigurasi");

    const chunks = chunkText(data.text);
    if (!chunks.length) return { count: 0 };

    // Embed in batches of 50 to stay well under provider limits.
    const embeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += 50) {
      const batch = chunks.slice(i, i + 50);
      const vecs = await embedTexts(apiKey, batch);
      if (vecs.length !== batch.length) throw new Error("Jumlah embedding tidak sesuai");
      for (const v of vecs) {
        if (v.length !== EMBEDDING_DIMS) throw new Error(`Dimensi embedding tidak cocok: ${v.length}`);
        embeddings.push(v);
      }
    }

    const rows = chunks.map((content, idx) => ({
      title: chunks.length === 1 ? data.title : `${data.title} — bagian ${idx + 1}`,
      content,
      source: "upload",
      source_url: data.sourceUrl ?? null,
      category: data.category,
      is_active: data.isActive,
      embedding: vectorLiteral(embeddings[idx]) as unknown as never,
    }));

    const { error } = await supabaseAdmin.from("chatbot_knowledge").insert(rows);
    if (error) throw new Error(error.message);
    return { count: rows.length };
  });

/**
 * (Re)build embeddings for knowledge entries.
 * mode="missing" only fills entries with NULL embedding (cheap, default).
 * mode="all" re-embeds every active entry (use after model change).
 */
export const rebuildKnowledgeIndex = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAdmin])
  .inputValidator((input) =>
    z.object({ mode: z.enum(["missing", "all"]).default("missing") }).parse(input ?? {})
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY belum dikonfigurasi");

    const query = supabaseAdmin
      .from("chatbot_knowledge")
      .select("id,title,content,embedding")
      .eq("is_active", true);
    const { data: rows, error } = data.mode === "missing"
      ? await query.is("embedding", null)
      : await query;
    if (error) throw new Error(error.message);
    if (!rows?.length) return { updated: 0, total: 0 };

    let updated = 0;
    const BATCH = 50;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const inputs = batch.map((r) => `${r.title}\n\n${r.content}`.slice(0, 6000));
      const vecs = await embedTexts(apiKey, inputs);
      if (vecs.length !== batch.length) throw new Error("Jumlah embedding tidak sesuai batch");
      // Update one row at a time (pgvector expects a single literal per row).
      for (let j = 0; j < batch.length; j++) {
        const v = vecs[j];
        if (v.length !== EMBEDDING_DIMS) throw new Error(`Dimensi embedding tidak cocok: ${v.length}`);
        const { error: upErr } = await supabaseAdmin
          .from("chatbot_knowledge")
          .update({ embedding: vectorLiteral(v) as unknown as never })
          .eq("id", batch[j].id);
        if (upErr) throw new Error(upErr.message);
        updated += 1;
      }
    }
    return { updated, total: rows.length };
  });

/**
 * Bulk re-categorize, activate/deactivate, or delete entries.
 */
export const bulkUpdateKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAdmin])
  .inputValidator((input) =>
    z.object({
      ids: z.array(z.string().uuid()).min(1).max(500),
      action: z.enum(["set_category", "activate", "deactivate", "delete"]),
      category: z.string().min(1).max(60).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    if (data.action === "delete") {
      const { error } = await supabaseAdmin.from("chatbot_knowledge").delete().in("id", data.ids);
      if (error) throw new Error(error.message);
      return { affected: data.ids.length };
    }
    const patch: { is_active?: boolean; category?: string } = {};
    if (data.action === "activate") patch.is_active = true;
    if (data.action === "deactivate") patch.is_active = false;
    if (data.action === "set_category") {
      if (!data.category) throw new Error("Kategori wajib diisi");
      patch.category = data.category;
    }
    const { error } = await supabaseAdmin.from("chatbot_knowledge").update(patch).in("id", data.ids);
    if (error) throw new Error(error.message);
    return { affected: data.ids.length };
  });

