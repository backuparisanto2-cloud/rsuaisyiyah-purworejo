import { useQuery } from "@tanstack/react-query";
import { Instagram, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildPermalink, buildThumbnail } from "@/lib/instagram-utils";

type Row = {
  id: string;
  shortcode: string;
  permalink: string;
  caption: string;
};

const PAGE_SIZE = 10;

function SmartImg({ shortcode, alt }: { shortcode: string; alt: string }) {
  const sources = [
    buildThumbnail(shortcode),
    `https://images.weserv.nl/?url=${encodeURIComponent(
      `www.instagram.com/p/${shortcode}/media/?size=l`
    )}&w=720&h=720&fit=cover&output=jpg`,
  ];
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground gap-1">
        <Instagram className="w-8 h-8" />
        <span className="text-xs">Buka di Instagram</span>
      </div>
    );
  }
  return (
    <img
      src={sources[idx]}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => {
        if (idx + 1 < sources.length) setIdx(idx + 1);
        else setFailed(true);
      }}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
}

export default function BeritaInstagram() {
  const { data, isLoading } = useQuery({
    queryKey: ["instagram-posts-manual"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("instagram_posts")
        .select("id,shortcode,permalink,caption,created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const [page, setPage] = useState(0);
  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setQuery(rawQuery.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [rawQuery]);

  // Reset to first page on new query
  useEffect(() => {
    setPage(0);
  }, [query]);

  const rows = data ?? [];
  const filtered = useMemo(() => {
    if (!query) return rows;
    return rows.filter((r) => (r.caption ?? "").toLowerCase().includes(query));
  }, [rows, query]);

  if (isLoading) {
    return (
      <div className="mt-6 grid grid-cols-2 gap-4 max-w-3xl mx-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="mt-8 text-center text-muted-foreground">
        Belum ada post.{" "}
        <a
          href="https://www.instagram.com/rsu_aisyiyah"
          target="_blank"
          rel="noreferrer"
          className="text-primary font-semibold hover:underline"
        >
          Lihat di Instagram →
        </a>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="mt-6 max-w-3xl mx-auto">
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
          placeholder="Cari caption berita…"
          className="w-full pl-10 pr-10 py-2.5 rounded-full border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {rawQuery && (
          <button
            onClick={() => setRawQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Bersihkan pencarian"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Tidak ada post yang cocok dengan “{query}”.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            {current.map((p) => (
              <a
                key={p.id}
                href={p.permalink || buildPermalink(p.shortcode)}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-md hover:shadow-xl transition-all"
              >
                <SmartImg shortcode={p.shortcode} alt={p.caption || "Post Instagram"} />
                <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Instagram className="w-4 h-4 text-primary" />
                </div>
                {p.caption ? (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 text-white text-xs line-clamp-3">
                    {p.caption}
                  </div>
                ) : null}
              </a>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-full border bg-card disabled:opacity-40 hover:bg-muted"
                aria-label="Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-full border bg-card disabled:opacity-40 hover:bg-muted"
                aria-label="Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
