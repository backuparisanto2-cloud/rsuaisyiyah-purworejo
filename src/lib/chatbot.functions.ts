import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

/**
 * Sync knowledge entries from existing site DB tables.
 * Replaces all entries with source='website' with fresh ones.
 */
export const syncKnowledgeFromWebsite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const [about, services, faqs, visiting, doctors, contact] = await Promise.all([
      supabaseAdmin.from("about_page").select("title,subtitle,body").maybeSingle(),
      supabaseAdmin.from("services").select("title,content").eq("is_active", true).order("display_order"),
      supabaseAdmin.from("faqs").select("question,answer").eq("is_active", true).order("display_order"),
      supabaseAdmin.from("visiting_hours").select("label,time_range").eq("is_active", true).order("display_order"),
      supabaseAdmin.from("doctors").select("name,specialty").eq("is_active", true).order("display_order"),
      supabaseAdmin.from("contact_settings").select("whatsapp,phone,address,email,instagram,footer_text").maybeSingle(),
    ]);

    const entries: { title: string; content: string; source: string }[] = [];
    if (about.data) entries.push({ title: `Tentang: ${about.data.title}`, content: `${about.data.subtitle}\n\n${about.data.body}`, source: "website" });
    for (const s of services.data ?? []) entries.push({ title: `Layanan: ${s.title}`, content: s.content || s.title, source: "website" });
    for (const f of faqs.data ?? []) entries.push({ title: `FAQ: ${f.question}`, content: f.answer, source: "website" });
    if ((visiting.data ?? []).length) {
      entries.push({
        title: "Jam Besuk",
        content: (visiting.data ?? []).map((v) => `${v.label}: ${v.time_range}`).join("\n"),
        source: "website",
      });
    }
    if ((doctors.data ?? []).length) {
      entries.push({
        title: "Daftar Dokter",
        content: (doctors.data ?? []).map((d) => `- ${d.name} (${d.specialty})`).join("\n"),
        source: "website",
      });
    }
    if (contact.data) {
      const c = contact.data;
      entries.push({
        title: "Kontak Rumah Sakit",
        content: `WhatsApp: ${c.whatsapp}\nTelepon: ${c.phone}\nEmail: ${c.email}\nAlamat: ${c.address}\nInstagram: ${c.instagram}`,
        source: "website",
      });
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
  .inputValidator((input) => z.object({ topic: z.string().min(3).max(500) }).parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY belum dikonfigurasi");

    const prompt = `Buat 5 entri pengetahuan singkat untuk chatbot RSU Aisyiyah Purworejo tentang topik: "${data.topic}".
Tiap entri harus relevan untuk pasien/pengunjung dan dapat dijawab oleh asisten virtual rumah sakit.
Balas HANYA JSON valid dengan bentuk: {"entries":[{"title":"...","content":"..."}]}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Anda asisten yang menghasilkan data pengetahuan rumah sakit dalam Bahasa Indonesia. Balas hanya JSON valid." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Terlalu banyak permintaan, coba lagi sebentar.");
    if (res.status === 402) throw new Error("Kredit Lovable AI habis. Silakan top up.");
    if (!res.ok) throw new Error(`AI error: ${res.status}`);

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { entries?: { title: string; content: string }[] };
    try { parsed = JSON.parse(content); } catch { throw new Error("AI mengembalikan format tidak valid"); }
    const entries = (parsed.entries ?? []).filter((e) => e?.title && e?.content);
    if (!entries.length) return { count: 0 };

    const rows = entries.map((e) => ({ title: e.title, content: e.content, source: "internet" }));
    const { error } = await supabaseAdmin.from("chatbot_knowledge").insert(rows);
    if (error) throw new Error(error.message);
    return { count: rows.length };
  });
