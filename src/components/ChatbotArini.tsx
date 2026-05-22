import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import arini from "@/assets/arini.png";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "bot" | "user"; text: string };
type Knowledge = { title: string; content: string };

const QUICK = ["Jadwal dokter", "Pendaftaran online", "Layanan unggulan", "Jam besuk", "Hubungi CS"];

const FALLBACK = "Terima kasih atas pertanyaannya. Untuk informasi lebih lanjut, silakan hubungi CS kami di WhatsApp 0896-4671-0859.";

function findAnswer(input: string, kb: Knowledge[]): string {
  const q = input.toLowerCase();
  const tokens = q.split(/\s+/).filter((t) => t.length > 2);
  if (!tokens.length || !kb.length) return FALLBACK;
  let best: { score: number; item: Knowledge } | null = null;
  for (const item of kb) {
    const hay = `${item.title}\n${item.content}`.toLowerCase();
    let score = 0;
    for (const t of tokens) if (hay.includes(t)) score += 1;
    if (!best || score > best.score) best = { score, item };
  }
  if (!best || best.score === 0) return FALLBACK;
  return `${best.item.title}\n\n${best.item.content}`;
}

export default function ChatbotArini() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [name, setName] = useState("Arini");
  const [avatar, setAvatar] = useState<string>(arini);
  const [greeting, setGreeting] = useState("Assalamu'alaikum 👋 Saya Arini, asisten virtual RSU Aisyiyah Purworejo. Ada yang bisa saya bantu?");
  const [kb, setKb] = useState<Knowledge[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "bot", text: greeting }]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: k }] = await Promise.all([
        supabase.from("chatbot_settings").select("name,avatar_url,greeting").maybeSingle(),
        supabase.from("chatbot_knowledge").select("title,content").eq("is_active", true),
      ]);
      if (s) {
        if (s.name) setName(s.name);
        if (s.avatar_url) setAvatar(s.avatar_url);
        if (s.greeting) {
          setGreeting(s.greeting);
          setMsgs([{ role: "bot", text: s.greeting }]);
        }
      }
      setKb((k as Knowledge[]) ?? []);
    })();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  const send = (text: string) => {
    const v = text.trim();
    if (!v) return;
    setMsgs((m) => [...m, { role: "user", text: v }]);
    setInput("");
    setTimeout(() => setMsgs((m) => [...m, { role: "bot", text: findAnswer(v, kb) }]), 400);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-2xl hover:bg-primary-dark transition-all animate-float"
          aria-label={`Buka chat ${name}`}
        >
          <div className="relative h-12 w-12 rounded-full overflow-hidden bg-white ring-2 ring-white shrink-0">
            <img src={avatar} alt={name} className="absolute inset-0 h-full w-full object-cover object-top scale-110" />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-secondary ring-2 ring-white" />
          </div>
          <div className="text-left pr-2">
            <div className="text-xs opacity-80 leading-none">Tanya</div>
            <div className="font-bold leading-tight">{name}</div>
          </div>
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] max-w-sm rounded-2xl bg-card shadow-2xl border overflow-hidden flex flex-col" style={{ height: "min(560px, 80vh)" }}>
          <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-white ring-2 ring-white/50 shrink-0">
              <img src={avatar} alt={name} className="h-full w-full object-cover object-top scale-110" />
            </div>
            <div className="flex-1">
              <div className="font-bold">{name}</div>
              <div className="text-xs opacity-90 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-secondary" /> Asisten Virtual • Online
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded" aria-label="Tutup">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border rounded-bl-sm"}`}>
                  {m.text}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-2">
              {QUICK.map((q) => (
                <button key={q} onClick={() => send(q)} className="text-xs px-3 py-1.5 rounded-full bg-card border hover:bg-accent">
                  {q}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="p-3 border-t flex gap-2 bg-card">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pesan…"
              className="flex-1 rounded-full border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button type="submit" className="rounded-full bg-primary text-primary-foreground p-2 hover:bg-primary-dark" aria-label="Kirim">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* keep icon import to avoid unused error if tree-shaken */}
      <MessageCircle className="hidden" />
    </>
  );
}
