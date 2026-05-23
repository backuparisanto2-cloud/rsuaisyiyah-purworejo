import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const SITE_URL = "https://rsuaisyiyah-purworejo.lovable.app";

function htmlToText(html: string): string {
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

/**
 * Fetch the published website + aggregate DB content, then use AI to extract
 * concise knowledge entries. Replaces all entries with source='website'.
 */
export const syncKnowledgeFromWebsite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ isActive: z.boolean().optional().default(true) }).parse(input ?? {})
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY belum dikonfigurasi");

    // 1) Aggregate from existing DB tables (structured, reliable).
    const [about, services, faqs, visiting, doctors, contact] = await Promise.all([
      supabaseAdmin.from("about_page").select("title,subtitle,body").maybeSingle(),
      supabaseAdmin.from("services").select("title,content").eq("is_active", true).order("display_order"),
      supabaseAdmin.from("faqs").select("question,answer").eq("is_active", true).order("display_order"),
      supabaseAdmin.from("visiting_hours").select("label,time_range").eq("is_active", true).order("display_order"),
      supabaseAdmin.from("doctors").select("name,specialty").eq("is_active", true).order("display_order"),
      supabaseAdmin.from("contact_settings").select("whatsapp,phone,address,email,instagram,footer_text").maybeSingle(),
    ]);

    const entries: { title: string; content: string; source: string; source_url: string | null; is_active: boolean }[] = [];
    const push = (title: string, content: string, source_url: string | null = SITE_URL) =>
      entries.push({ title, content, source: "website", source_url, is_active: data.isActive });

    if (about.data) push(`Tentang: ${about.data.title}`, `${about.data.subtitle}\n\n${about.data.body}`);
    for (const s of services.data ?? []) push(`Layanan: ${s.title}`, s.content || s.title);
    for (const f of faqs.data ?? []) push(`FAQ: ${f.question}`, f.answer);
    if ((visiting.data ?? []).length)
      push("Jam Besuk", (visiting.data ?? []).map((v) => `${v.label}: ${v.time_range}`).join("\n"));
    if ((doctors.data ?? []).length)
      push("Daftar Dokter", (doctors.data ?? []).map((d) => `- ${d.name} (${d.specialty})`).join("\n"));
    if (contact.data) {
      const c = contact.data;
      push("Kontak Rumah Sakit",
        `WhatsApp: ${c.whatsapp}\nTelepon: ${c.phone}\nEmail: ${c.email}\nAlamat: ${c.address}\nInstagram: ${c.instagram}`);
    }

    // 2) Fetch the live website and let AI extract additional Q&A-style entries.
    try {
      const res = await fetch(SITE_URL, { headers: { "user-agent": "ChatbotKnowledgeSync/1.0" } });
      if (res.ok) {
        const text = htmlToText(await res.text()).slice(0, 12000);
        if (text.length > 200) {
          const parsed = await callLovableAI(
            apiKey,
            "Anda mengekstrak basis pengetahuan chatbot dari konten website rumah sakit. Balas hanya JSON valid berbentuk {\"entries\":[{\"title\":\"...\",\"content\":\"...\"}]}. Setiap entri singkat (1-3 kalimat), faktual, dalam Bahasa Indonesia, dan unik (tidak duplikat).",
            `Konten website RSU Aisyiyah Purworejo:\n\n${text}\n\nBuat 6-10 entri pengetahuan paling berguna untuk pasien/pengunjung.`
          );
          for (const e of parsed.entries ?? []) {
            if (e?.title && e?.content) push(`Web: ${e.title}`, e.content);
          }
        }
      }
    } catch (e) {
      console.warn("Website fetch failed:", (e as Error).message);
    }

    await supabaseAdmin.from("chatbot_knowledge").delete().eq("source", "website");
    if (entries.length) {
      const { error } = await supabaseAdmin.from("chatbot_knowledge").insert(entries);
      if (error) throw new Error(error.message);
    }
    return { count: entries.length };
  });

/**
 * Use Lovable AI to generate knowledge entries about the hospital from general internet knowledge.
 */
export const generateKnowledgeFromAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
