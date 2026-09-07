import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { embedTexts } from "@/lib/chatbot.functions";
import { z } from "zod";

// Naive in-worker rate limiter (resets on cold start).
const rl = new Map<string, { count: number; reset: number }>();
function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const cur = rl.get(key);
  if (!cur || cur.reset < now) {
    rl.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (cur.count >= limit) return false;
  cur.count += 1;
  return true;
}

const BodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(20),
});

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function scoreKnowledge(query: string, items: { title: string; content: string }[], topN = 6) {
  const q = query.toLowerCase();
  const tokens = Array.from(new Set(q.split(/\s+/).filter((t) => t.length > 2)));
  if (!tokens.length) return items.slice(0, topN);
  const scored = items.map((it) => {
    const hay = `${it.title}\n${it.content}`.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (hay.includes(t)) score += 2;
    }
    return { it, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, topN).map((s) => s.it);
  // If nothing matched, fall back to the first few entries so the model still has context.
  return top.length ? top : items.slice(0, Math.min(3, items.length));
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
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

async function buildSystemContext(userQuery: string, apiKey: string) {
  const [
    { data: settings },
    { data: kbAll },
    { data: contact },
    { data: visiting },
    { data: doctors },
    { data: schedules },
    { data: pages },
    { data: menus },
    { data: services },
    { data: faqs },
    { data: about },
    { data: summaries },
  ] = await Promise.all([
    supabaseAdmin.from("chatbot_settings").select("*").maybeSingle(),
    supabaseAdmin.from("chatbot_knowledge").select("title,content,category").eq("is_active", true),
    supabaseAdmin.from("contact_settings").select("whatsapp,phone,address,email,instagram").maybeSingle(),
    supabaseAdmin.from("visiting_hours").select("label,time_range").eq("is_active", true).order("display_order"),
    supabaseAdmin.from("doctors").select("id,name,specialty").eq("is_active", true).order("display_order"),
    supabaseAdmin.from("doctor_schedules").select("doctor_id,day_of_week,time_start,time_end,poli"),
    supabaseAdmin.from("custom_pages").select("title,slug,meta_description,content").eq("is_published", true),
    supabaseAdmin.from("menu_items").select("label,href,parent_id,display_order").eq("is_active", true).order("display_order"),
    supabaseAdmin.from("services").select("title,content").eq("is_active", true).order("display_order"),
    supabaseAdmin.from("faqs").select("question,answer").eq("is_active", true).order("display_order"),
    supabaseAdmin.from("about_page").select("title,subtitle,body").maybeSingle(),
    supabaseAdmin.from("home_summary_sections").select("title,summary,cta_href,cta_label").eq("is_active", true).order("display_order"),
  ]);

  // Try semantic match first; fall back to keyword scoring if it fails or returns nothing.
  let top: { title: string; content: string; category?: string | null }[] = [];
  if (userQuery.trim().length > 1) {
    try {
      const [vec] = await embedTexts(apiKey, [userQuery]);
      if (vec?.length) {
        const { data: matched, error } = await supabaseAdmin.rpc("match_chatbot_knowledge", {
          query_embedding: `[${vec.join(",")}]` as unknown as never,
          match_count: 6,
          min_similarity: 0.25,
        });
        if (!error && matched?.length) {
          top = matched.map((m: { title: string; content: string; category: string | null }) => ({
            title: m.title, content: m.content, category: m.category,
          }));
        }
      }
    } catch (e) {
      console.warn("semantic match failed:", (e as Error).message);
    }
  }
  if (!top.length) top = scoreKnowledge(userQuery, kbAll ?? []);

  const lines: string[] = [];
  lines.push("KONTEKS RSU AISYIYAH PURWOREJO (gunakan hanya info ini untuk fakta spesifik):");

  if (contact) {
    lines.push("\n[KONTAK]");
    if (contact.whatsapp) lines.push(`WhatsApp CS: ${contact.whatsapp}`);
    if (contact.phone) lines.push(`Telepon: ${contact.phone}`);
    if (contact.email) lines.push(`Email: ${contact.email}`);
    if (contact.address) lines.push(`Alamat: ${contact.address}`);
    if (contact.instagram) lines.push(`Instagram: ${contact.instagram}`);
  }

  if (visiting?.length) {
    lines.push("\n[JAM BESUK]");
    for (const v of visiting) lines.push(`- ${v.label}: ${v.time_range}`);
  }

  if (doctors?.length) {
    const byDoc = new Map<string, { day_of_week: number; time_start: string; time_end: string; poli: string | null }[]>();
    for (const s of schedules ?? []) {
      const arr = byDoc.get(s.doctor_id) ?? [];
      arr.push(s);
      byDoc.set(s.doctor_id, arr);
    }
    lines.push("\n[DOKTER & JADWAL]");
    for (const d of doctors) {
      const sch = (byDoc.get(d.id) ?? []).sort((a, b) => a.day_of_week - b.day_of_week);
      const schStr = sch.length
        ? sch.map((s) => `${DAYS[s.day_of_week] ?? s.day_of_week} ${s.time_start.slice(0, 5)}-${s.time_end.slice(0, 5)}${s.poli ? ` (${s.poli})` : ""}`).join("; ")
        : "jadwal belum tercatat";
      lines.push(`- ${d.name} — ${d.specialty}: ${schStr}`);
    }
  }

  if (about) {
    lines.push("\n[TENTANG KAMI] (tautan: /#tentang)");
    lines.push(`${about.title}${about.subtitle ? ` — ${about.subtitle}` : ""}`);
    if (about.body) lines.push(stripHtml(about.body).slice(0, 1500));
  }

  if (services?.length) {
    lines.push("\n[LAYANAN] (tautan: /#layanan)");
    for (const s of services) lines.push(`- ${s.title}: ${stripHtml(s.content ?? "").slice(0, 300)}`);
  }

  if (faqs?.length) {
    lines.push("\n[FAQ]");
    for (const f of faqs) lines.push(`- T: ${f.question}\n  J: ${stripHtml(f.answer ?? "").slice(0, 400)}`);
  }

  if (summaries?.length) {
    lines.push("\n[RINGKASAN BERANDA]");
    for (const s of summaries)
      lines.push(`- ${s.title}: ${stripHtml(s.summary ?? "").slice(0, 300)}${s.cta_href ? ` (tautan: ${s.cta_href})` : ""}`);
  }

  if (menus?.length) {
    lines.push("\n[MENU NAVIGASI SITUS] (label → tautan)");
    for (const m of menus) lines.push(`- ${m.label} → ${m.href}`);
  }

  if (pages?.length) {
    lines.push("\n[DAFTAR HALAMAN WEBSITE] (semua tautan relatif, boleh dipakai dalam jawaban)");
    for (const p of pages) lines.push(`- ${p.title} → /p/${p.slug}${p.meta_description ? ` — ${p.meta_description}` : ""}`);

    // Include the full text of the pages most relevant to the question.
    const relevant = scoreKnowledge(
      userQuery,
      pages.map((p) => ({ title: p.title, content: `${p.meta_description ?? ""} ${stripHtml(p.content ?? "")}`, slug: p.slug })) as never,
      3
    ) as unknown as { title: string; content: string; slug: string }[];
    if (relevant.length) {
      lines.push("\n[ISI HALAMAN TERKAIT]");
      for (const p of relevant) lines.push(`### ${p.title} (/p/${p.slug})\n${p.content.slice(0, 2500)}`);
    }
  }

  if (top.length) {
    lines.push("\n[BASIS PENGETAHUAN TERKAIT]");
    for (const k of top) lines.push(`• ${k.title}\n  ${k.content}`);
  }

  return {
    settings,
    contextText: lines.join("\n"),
  };
}

export const Route = createFileRoute("/api/public/chatbot-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Rate limit per IP
        const ip =
          request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "anon";
        if (!rateLimit(`ip:${ip}`, 30, 60_000)) {
          return new Response(JSON.stringify({ error: "Terlalu banyak permintaan. Coba lagi sebentar." }), {
            status: 429,
            headers: { "Content-Type": "application/json" },
          });
        }

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "AI belum dikonfigurasi." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        let body: z.infer<typeof BodySchema>;
        try {
          body = BodySchema.parse(await request.json());
        } catch (e) {
          return new Response(JSON.stringify({ error: "Permintaan tidak valid." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Refresh knowledge first when site content changed (throttled internally).
        try {
          const { maybeAutoSync } = await import("@/lib/chatbot-sync.server");
          await maybeAutoSync(apiKey);
        } catch (e) {
          console.warn("auto sync skipped:", (e as Error).message);
        }

        const lastUser = [...body.messages].reverse().find((m) => m.role === "user");
        const { settings, contextText } = await buildSystemContext(lastUser?.content ?? "", apiKey);

        if (settings && settings.ai_enabled === false) {
          return new Response(JSON.stringify({ error: "Mode AI sedang dinonaktifkan." }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        }

        const persona = settings?.system_prompt ?? "Anda adalah Arini, asisten virtual RSU Aisyiyah Purworejo. Jawab ringkas dan ramah dalam Bahasa Indonesia.";
        const model = settings?.model ?? "google/gemini-3-flash-preview";
        const temperature = typeof settings?.temperature === "number" ? settings.temperature : 0.4;

        // Keep only the last 12 turns to keep prompts small.
        const trimmed = body.messages.slice(-12);

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            temperature,
            stream: true,
            messages: [
              { role: "system", content: persona },
              { role: "system", content: contextText },
              ...trimmed,
            ],
          }),
        });

        if (upstream.status === 429) {
          return new Response(JSON.stringify({ error: "Permintaan AI sedang ramai. Coba lagi sebentar." }), {
            status: 429,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (upstream.status === 402) {
          return new Response(JSON.stringify({ error: "Kuota AI rumah sakit habis. Silakan hubungi admin." }), {
            status: 402,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (!upstream.ok || !upstream.body) {
          const t = await upstream.text().catch(() => "");
          console.error("AI gateway error:", upstream.status, t);
          return new Response(JSON.stringify({ error: "AI gagal merespons." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
