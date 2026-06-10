import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAdmin } from "@/integrations/supabase/admin-middleware";
import { z } from "zod";

const scheduleItemSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  time_start: z.string().regex(/^\d{2}:\d{2}$/),
  time_end: z.string().regex(/^\d{2}:\d{2}$/),
  poli: z.string().default(""),
});

const singleResultSchema = z.object({ schedules: z.array(scheduleItemSchema).default([]) });
const multiResultSchema = z.object({
  doctors: z.array(
    z.object({
      name: z.string().default(""),
      specialty: z.string().default(""),
      schedules: z.array(scheduleItemSchema).default([]),
    })
  ).default([]),
});

const SYSTEM_SINGLE = `Anda mengekstrak jadwal praktik DOKTER dari sebuah gambar (foto/scan jadwal poliklinik).
Output WAJIB JSON valid dengan skema:
{ "schedules": [ { "day_of_week": 0-6, "time_start": "HH:MM", "time_end": "HH:MM", "poli": "string" } ] }
Aturan:
- day_of_week: Minggu=0, Senin=1, Selasa=2, Rabu=3, Kamis=4, Jumat=5, Sabtu=6.
- Jika 1 baris menyebut beberapa hari (mis. "Senin & Rabu"), pecah jadi beberapa entri.
- Normalkan jam ke 24-jam "HH:MM" (contoh "08.00 - 12.00 WIB" -> start "08:00", end "12:00").
- "poli" boleh kosong jika tidak ada keterangan tambahan.
- Hanya kembalikan JSON, tanpa teks lain.`;

const SYSTEM_MULTI = `Anda mengekstrak DAFTAR DOKTER dan jadwalnya dari gambar (papan/lembar jadwal poliklinik rumah sakit).
Output WAJIB JSON valid dengan skema:
{ "doctors": [ { "name": "dr. ...", "specialty": "SPESIALIS ...", "schedules": [ { "day_of_week": 0-6, "time_start": "HH:MM", "time_end": "HH:MM", "poli": "string" } ] } ] }
Aturan:
- day_of_week: Minggu=0, Senin=1, Selasa=2, Rabu=3, Kamis=4, Jumat=5, Sabtu=6.
- Pisahkan multi-hari menjadi entri terpisah.
- Normalkan jam ke "HH:MM" 24-jam.
- "specialty" huruf besar (mis. "SPESIALIS ANAK"). Jika tidak diketahui, kosong.
- Hanya kembalikan JSON, tanpa teks lain.`;

export const extractScheduleFromImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      imageBase64: z.string().min(50),
      mode: z.enum(["single", "multi"]),
      doctorName: z.string().optional(),
      doctorSpecialty: z.string().optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY belum dikonfigurasi");

    const system = data.mode === "single" ? SYSTEM_SINGLE : SYSTEM_MULTI;
    const userText = data.mode === "single"
      ? `Ekstrak jadwal untuk dokter: ${data.doctorName ?? "(nama dari gambar)"} — ${data.doctorSpecialty ?? ""}. Ambil baris-baris jadwalnya dari gambar.`
      : "Ekstrak semua dokter dan jadwalnya dari gambar ini.";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              { type: "image_url", image_url: { url: data.imageBase64 } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Terlalu banyak permintaan, coba lagi sebentar.");
    if (res.status === 402) throw new Error("Kredit Lovable AI habis. Silakan top up.");
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
    }

    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try { parsed = JSON.parse(content); } catch { throw new Error("AI mengembalikan format tidak valid"); }

    if (data.mode === "single") {
      const r = singleResultSchema.safeParse(parsed);
      if (!r.success) throw new Error("Struktur hasil AI tidak sesuai");
      return { mode: "single" as const, schedules: r.data.schedules };
    } else {
      const r = multiResultSchema.safeParse(parsed);
      if (!r.success) throw new Error("Struktur hasil AI tidak sesuai");
      return { mode: "multi" as const, doctors: r.data.doctors };
    }
  });
