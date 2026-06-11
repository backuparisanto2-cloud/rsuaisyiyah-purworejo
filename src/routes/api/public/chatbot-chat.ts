import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { embedTexts } from "@/lib/chatbot.functions";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Strict allowlisted request schema
// ---------------------------------------------------------------------------
const MAX_MSG_CHARS = 2000;
const MAX_TOTAL_CHARS = 8000;
const MAX_MESSAGES = 20;

// Reject control chars (except \n, \r, \t) — they have no place in chat input
// and are sometimes used to smuggle prompt-injection payloads.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

const MessageSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z
      .string()
      .min(1)
      .max(MAX_MSG_CHARS)
      .refine((s) => !CONTROL_CHARS.test(s), "invalid characters"),
  })
  .strict();

const BodySchema = z
  .object({
    messages: z.array(MessageSchema).min(1).max(MAX_MESSAGES),
  })
  .strict()
  .superRefine((val, ctx) => {
    const total = val.messages.reduce((n, m) => n + m.content.length, 0);
    if (total > MAX_TOTAL_CHARS) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "messages too long" });
    }
    const last = val.messages[val.messages.length - 1];
    if (last.role !== "user") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "last message must be user" });
    }
  });

type Body = z.infer<typeof BodySchema>;

function jsonError(message: string, status: number, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

// ---------------------------------------------------------------------------
// Origin allowlist — block requests that don't originate from our own site.
// `null` Origin is allowed (some browsers strip it on same-origin POST), but
// when a header IS sent it must match. This blocks the most common
// cross-site abuse vectors at the edge.
// ---------------------------------------------------------------------------
const ORIGIN_ALLOWLIST = new Set<string>([
  "https://rsuaisyiyah-purworejo.lovable.app",
  "https://project--rsuaisyiyah-purworejo.lovable.app",
  "https://project--rsuaisyiyah-purworejo-dev.lovable.app",
  "https://id-preview--8951ae56-14f2-4055-9663-0bd10d8dcdcd.lovable.app",
]);
const ALLOWED_HOST_RE = /\.lovable\.app$|\.lovableproject\.com$|^localhost(:\d+)?$/i;

function isAllowedOrigin(raw: string | null): boolean {
  if (!raw) return true; // header not present → allow (same-origin fetch)
  try {
    const u = new URL(raw);
    if (ORIGIN_ALLOWLIST.has(u.origin)) return true;
    return ALLOWED_HOST_RE.test(u.host);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Durable rate limit via Supabase RPC. Two windows per IP:
//   - 30 requests / 60 s   (burst)
//   - 300 requests / 24 h  (daily cap)
// ---------------------------------------------------------------------------
async function consume(key: string, limit: number, windowSeconds: number) {
  const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", {
    _key: key,
    _limit: limit,
    _window_seconds: windowSeconds,
  });
  if (error) {
    console.error("rate_limit rpc failed:", error.message);
    return true; // fail-open so RPC outages don't take the chatbot offline
  }
  return data !== false;
}

// ---------------------------------------------------------------------------
// Knowledge retrieval
// ---------------------------------------------------------------------------
const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function scoreKnowledge(query: string, items: { title: string; content: string }[], topN = 6) {
  const q = query.toLowerCase();
  const tokens = Array.from(new Set(q.split(/\s+/).filter((t) => t.length > 2)));
  if (!tokens.length) return items.slice(0, topN);
  const scored = items.map((it) => {
    const hay = `${it.title}\n${it.content}`.toLowerCase();
    let score = 0;
    for (const t of tokens) if (hay.includes(t)) score += 2;
    return { it, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, topN).map((s) => s.it);
  return top.length ? top : items.slice(0, Math.min(3, items.length));
}

async function buildSystemContext(userQuery: string, apiKey: string) {
  const [{ data: settings }, { data: kbAll }, { data: contact }, { data: visiting }, { data: doctors }, { data: schedules }] =
    await Promise.all([
      supabaseAdmin.from("chatbot_settings").select("*").maybeSingle(),
      supabaseAdmin.from("chatbot_knowledge").select("title,content,category").eq("is_active", true),
      supabaseAdmin.from("contact_settings").select("whatsapp,phone,address,email,instagram").maybeSingle(),
      supabaseAdmin.from("visiting_hours").select("label,time_range").eq("is_active", true).order("display_order"),
      supabaseAdmin.from("doctors").select("id,name,specialty").eq("is_active", true).order("display_order"),
      supabaseAdmin.from("doctor_schedules").select("doctor_id,day_of_week,time_start,time_end,poli"),
    ]);

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

  if (top.length) {
    lines.push("\n[BASIS PENGETAHUAN TERKAIT]");
    for (const k of top) lines.push(`• ${k.title}\n  ${k.content}`);
  }

  return { settings, contextText: lines.join("\n") };
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------
const MAX_BODY_BYTES = 32 * 1024; // 32 KB hard cap before JSON parse

export const Route = createFileRoute("/api/public/chatbot-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Origin allowlist
        const origin = request.headers.get("origin");
        if (!isAllowedOrigin(origin)) {
          return jsonError("Forbidden origin.", 403);
        }

        // 2. Content-Type guard
        const contentType = request.headers.get("content-type") || "";
        if (!contentType.toLowerCase().includes("application/json")) {
          return jsonError("Unsupported content type.", 415);
        }

        // 3. Size guard (don't even parse oversized payloads)
        const declaredLen = Number(request.headers.get("content-length") || "0");
        if (declaredLen > MAX_BODY_BYTES) {
          return jsonError("Payload too large.", 413);
        }

        // 4. Rate limits (durable, atomic via Postgres RPC)
        const ip =
          request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "anon";
        const ipKey = `chatbot:ip:${ip}`;
        const burstOk = await consume(ipKey + ":m", 30, 60);
        if (!burstOk) {
          return jsonError("Terlalu banyak permintaan. Coba lagi sebentar.", 429, { "Retry-After": "60" });
        }
        const dayOk = await consume(ipKey + ":d", 300, 24 * 60 * 60);
        if (!dayOk) {
          return jsonError("Kuota chatbot harian tercapai. Silakan coba besok.", 429, { "Retry-After": "3600" });
        }

        // 5. Read + size-check raw body, then strict-validate
        const raw = await request.text();
        if (raw.length > MAX_BODY_BYTES) {
          return jsonError("Payload too large.", 413);
        }

        let body: Body;
        try {
          const json = JSON.parse(raw);
          body = BodySchema.parse(json);
        } catch {
          return jsonError("Permintaan tidak valid.", 400);
        }

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return jsonError("AI belum dikonfigurasi.", 500);
        }

        const lastUser = body.messages[body.messages.length - 1];
        const { settings, contextText } = await buildSystemContext(lastUser.content, apiKey);

        if (settings && settings.ai_enabled === false) {
          return jsonError("Mode AI sedang dinonaktifkan.", 503);
        }

        const persona = settings?.system_prompt ?? "Anda adalah Arini, asisten virtual RSU Aisyiyah Purworejo. Jawab ringkas dan ramah dalam Bahasa Indonesia.";
        const model = settings?.model ?? "google/gemini-3-flash-preview";
        const temperature = typeof settings?.temperature === "number" ? settings.temperature : 0.4;

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
          return jsonError("Permintaan AI sedang ramai. Coba lagi sebentar.", 429);
        }
        if (upstream.status === 402) {
          return jsonError("Kuota AI rumah sakit habis. Silakan hubungi admin.", 402);
        }
        if (!upstream.ok || !upstream.body) {
          const t = await upstream.text().catch(() => "");
          console.error("AI gateway error:", upstream.status, t);
          return jsonError("AI gagal merespons.", 500);
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
