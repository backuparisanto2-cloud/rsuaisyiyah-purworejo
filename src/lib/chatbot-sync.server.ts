// Server-only: rebuilds the chatbot knowledge base from live site content.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { embedTexts, chunkText, htmlToText } from "@/lib/chatbot.functions";

const EMBEDDING_DIMS = 1536;
const SITE_URL = "https://rsuaisyiyah-purworejo.lovable.app";

type Entry = {
  title: string;
  content: string;
  source: string;
  source_url: string | null;
  category: string;
  is_active: boolean;
  embedding?: unknown;
};

function vectorLiteral(arr: number[]): string {
  return `[${arr.join(",")}]`;
}

/**
 * Rebuild all auto-generated knowledge (source='website') from the database:
 * about, services, FAQ, visiting hours, doctors, contact, home summaries,
 * navigation menu and every published page-builder page.
 * Embeddings are generated for each entry so semantic search works immediately.
 */
export async function runKnowledgeSync(apiKey: string, isActive = true) {
  const [about, services, faqs, visiting, doctors, contact, summaries, menus, pages] = await Promise.all([
    supabaseAdmin.from("about_page").select("title,subtitle,body").maybeSingle(),
    supabaseAdmin.from("services").select("title,content").eq("is_active", true).order("display_order"),
    supabaseAdmin.from("faqs").select("question,answer").eq("is_active", true).order("display_order"),
    supabaseAdmin.from("visiting_hours").select("label,time_range").eq("is_active", true).order("display_order"),
    supabaseAdmin.from("doctors").select("name,specialty").eq("is_active", true).order("display_order"),
    supabaseAdmin.from("contact_settings").select("whatsapp,phone,address,email,instagram").maybeSingle(),
    supabaseAdmin
      .from("home_summary_sections")
      .select("title,summary,cta_href,cta_label")
      .eq("is_active", true)
      .order("display_order"),
    supabaseAdmin.from("menu_items").select("label,href").eq("is_active", true).order("display_order"),
    supabaseAdmin.from("custom_pages").select("title,slug,meta_description,content").eq("is_published", true),
  ]);

  const entries: Entry[] = [];
  const push = (title: string, content: string, category: string, source_url: string | null = SITE_URL) => {
    const text = content.trim();
    if (!text) return;
    entries.push({ title, content: text, source: "website", source_url, category, is_active: isActive });
  };

  if (about.data)
    push(
      `Tentang: ${about.data.title}`,
      `${about.data.subtitle ?? ""}\n\n${htmlToText(about.data.body ?? "")}`,
      "profil",
      `${SITE_URL}/#tentang`
    );

  for (const s of services.data ?? [])
    push(`Layanan: ${s.title}`, htmlToText(s.content ?? "") || s.title, "layanan", `${SITE_URL}/#layanan`);

  for (const f of faqs.data ?? []) push(`FAQ: ${f.question}`, htmlToText(f.answer ?? ""), "faq", `${SITE_URL}/#faq`);

  if ((visiting.data ?? []).length)
    push("Jam Besuk", (visiting.data ?? []).map((v) => `${v.label}: ${v.time_range}`).join("\n"), "jam-besuk");

  if ((doctors.data ?? []).length)
    push("Daftar Dokter", (doctors.data ?? []).map((d) => `- ${d.name} (${d.specialty})`).join("\n"), "dokter");

  if (contact.data) {
    const c = contact.data;
    push(
      "Kontak Rumah Sakit",
      `WhatsApp: ${c.whatsapp}\nTelepon: ${c.phone}\nEmail: ${c.email}\nAlamat: ${c.address}\nInstagram: ${c.instagram}`,
      "kontak"
    );
  }

  for (const s of summaries.data ?? [])
    push(
      `Ringkasan: ${s.title}`,
      `${htmlToText(s.summary ?? "")}${s.cta_href ? `\n\nSelengkapnya: [${s.cta_label || s.title}](${s.cta_href})` : ""}`,
      "beranda"
    );

  if ((menus.data ?? []).length)
    push(
      "Peta Navigasi Situs",
      (menus.data ?? []).map((m) => `- [${m.label}](${m.href})`).join("\n"),
      "navigasi"
    );

  // Page-builder pages: chunk the body so long pages stay searchable.
  for (const p of pages.data ?? []) {
    const path = `/p/${p.slug}`;
    const body = htmlToText(p.content ?? "");
    const head = [p.meta_description ?? "", body].filter(Boolean).join("\n\n");
    const chunks = chunkText(head);
    if (!chunks.length) {
      push(`Halaman: ${p.title}`, `Halaman "${p.title}" tersedia di ${path}`, "halaman", `${SITE_URL}${path}`);
      continue;
    }
    chunks.forEach((chunk: string, i: number) => {
      push(
        chunks.length === 1 ? `Halaman: ${p.title}` : `Halaman: ${p.title} — bagian ${i + 1}`,
        `${chunk}\n\n(Tautan halaman: ${path})`,
        "halaman",
        `${SITE_URL}${path}`
      );
    });
  }

  // Embed everything in batches so semantic search works right away.
  for (let i = 0; i < entries.length; i += 50) {
    const batch = entries.slice(i, i + 50);
    try {
      const vecs = await embedTexts(apiKey, batch.map((e) => `${e.title}\n\n${e.content}`.slice(0, 6000)));
      if (vecs.length === batch.length) {
        vecs.forEach((v, j) => {
          if (v.length === EMBEDDING_DIMS) batch[j].embedding = vectorLiteral(v);
        });
      }
    } catch (e) {
      console.warn("embedding batch failed:", (e as Error).message);
    }
  }

  await supabaseAdmin.from("chatbot_knowledge").delete().eq("source", "website");
  if (entries.length) {
    const { error } = await supabaseAdmin.from("chatbot_knowledge").insert(entries as never);
    if (error) throw new Error(error.message);
  }

  await supabaseAdmin
    .from("knowledge_sync_state")
    .update({ dirty: false, last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", true);

  return { count: entries.length };
}

let inFlight: Promise<unknown> | null = null;
let lastAttempt = 0;

/**
 * Called on every chat request: refreshes knowledge when site content changed,
 * at most once every 30 seconds and never twice concurrently.
 */
export async function maybeAutoSync(apiKey: string) {
  const now = Date.now();
  if (inFlight || now - lastAttempt < 30_000) return;
  const { data } = await supabaseAdmin
    .from("knowledge_sync_state")
    .select("dirty,last_synced_at")
    .eq("id", true)
    .maybeSingle();
  if (!data?.dirty) return;
  lastAttempt = now;
  inFlight = runKnowledgeSync(apiKey)
    .catch((e) => console.warn("auto knowledge sync failed:", (e as Error).message))
    .finally(() => {
      inFlight = null;
    });
  await inFlight;
}
