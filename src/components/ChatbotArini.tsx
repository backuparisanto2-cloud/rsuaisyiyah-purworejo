import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, RotateCcw, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import arini from "@/assets/arini.png";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "assistant" | "user"; content: string };

const STORAGE_KEY = "arini_chat_v2";
const ENDPOINT = "/api/public/chatbot-chat";

const FALLBACK_QUICK = ["Jadwal dokter", "Pendaftaran online", "Layanan unggulan", "Jam besuk", "Hubungi CS"];
const DEFAULT_GREETING = "Assalamu'alaikum 👋 Saya Arini, asisten virtual RSU Aisyiyah Purworejo. Ada yang bisa saya bantu?";

export default function ChatbotArini() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [name, setName] = useState("Arini");
  const [avatar, setAvatar] = useState<string>(arini);
  const [greeting, setGreeting] = useState(DEFAULT_GREETING);
  const [quick, setQuick] = useState<string[]>(FALLBACK_QUICK);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: DEFAULT_GREETING }]);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Hydrate from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Msg[];
        if (Array.isArray(parsed) && parsed.length) setMsgs(parsed);
      }
    } catch {}
  }, []);

  // Persist
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-30)));
    } catch {}
  }, [msgs]);

  // Load settings
  useEffect(() => {
    (async () => {
      const { data: s } = await supabase
        .from("chatbot_settings")
        .select("name,avatar_url,greeting,quick_questions")
        .maybeSingle();
      if (s) {
        if (s.name) setName(s.name);
        if (s.avatar_url) setAvatar(s.avatar_url);
        if (s.greeting) {
          setGreeting(s.greeting);
          setMsgs((prev) =>
            prev.length === 1 && prev[0].role === "assistant" && prev[0].content === DEFAULT_GREETING
              ? [{ role: "assistant", content: s.greeting }]
              : prev
          );
        }
        const qq = (s as { quick_questions?: unknown }).quick_questions;
        if (Array.isArray(qq) && qq.length) setQuick(qq.filter((x): x is string => typeof x === "string"));
      }
    })();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open, streaming]);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  const resetChat = useCallback(() => {
    stopStream();
    setMsgs([{ role: "assistant", content: greeting }]);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  }, [greeting, stopStream]);

  const send = useCallback(async (text: string) => {
    const v = text.trim();
    if (!v || streaming) return;
    const userMsg: Msg = { role: "user", content: v };
    const history = [...msgs, userMsg];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-12) }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        let errMsg = "Maaf, terjadi kendala. Silakan hubungi CS WhatsApp 0896-4671-0859.";
        try {
          const j = await resp.json();
          if (j?.error) errMsg = j.error;
        } catch {}
        setMsgs((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: errMsg };
          return copy;
        });
        return;
      }
      if (!resp.body) throw new Error("No stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length) {
              acc += delta;
              setMsgs((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (!acc) {
        setMsgs((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "Maaf, saya belum bisa memberi jawaban. Silakan hubungi CS WhatsApp 0896-4671-0859.",
          };
          return copy;
        });
      }
    } catch (e) {
      if ((e as { name?: string }).name !== "AbortError") {
        setMsgs((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant" && !last.content) {
            copy[copy.length - 1] = {
              role: "assistant",
              content: "Koneksi terputus. Coba ulang sebentar lagi.",
            };
          }
          return copy;
        });
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
    }
  }, [msgs, streaming]);

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
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">{name}</div>
              <div className="text-xs opacity-90 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-secondary" />
                {streaming ? "Sedang mengetik…" : "Asisten Virtual • Online"}
              </div>
            </div>
            <button onClick={resetChat} className="p-1 hover:bg-white/10 rounded" aria-label="Mulai percakapan baru" title="Mulai baru">
              <RotateCcw className="h-4 w-4" />
            </button>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded" aria-label="Tutup">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
            {msgs.map((m, i) => {
              const isLast = i === msgs.length - 1;
              const isTyping = streaming && isLast && m.role === "assistant" && !m.content;
              return (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border rounded-bl-sm"}`}>
                    {isTyping ? (
                      <div className="flex gap-1 py-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    ) : m.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-a:text-primary">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    )}
                  </div>
                </div>
              );
            })}
            {!streaming && msgs.length <= 2 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {quick.map((q) => (
                  <button key={q} onClick={() => send(q)} className="text-xs px-3 py-1.5 rounded-full bg-card border hover:bg-accent">
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="p-3 border-t flex gap-2 bg-card">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={streaming ? "Sedang menjawab…" : "Tulis pesan…"}
              disabled={streaming}
              className="flex-1 rounded-full border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
            {streaming ? (
              <button type="button" onClick={stopStream} className="rounded-full bg-destructive text-destructive-foreground p-2 hover:opacity-90" aria-label="Hentikan">
                <Square className="h-4 w-4" />
              </button>
            ) : (
              <button type="submit" className="rounded-full bg-primary text-primary-foreground p-2 hover:bg-primary-dark disabled:opacity-50" aria-label="Kirim" disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>
      )}

      <MessageCircle className="hidden" />
    </>
  );
}
