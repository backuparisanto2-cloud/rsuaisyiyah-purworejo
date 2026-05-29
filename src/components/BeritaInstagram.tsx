import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Heart, Instagram } from "lucide-react";
import { getInstagramPosts } from "@/lib/instagram.functions";

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BeritaInstagram() {
  const fetchPosts = useServerFn(getInstagramPosts);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["instagram-posts"],
    queryFn: () => fetchPosts(),
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-2xl bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (isError || !data?.posts?.length) {
    return (
      <div className="mt-8 text-center text-muted-foreground">
        Belum bisa memuat post terbaru.{" "}
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

  return (
    <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {data.posts.map((p) => (
        <a
          key={p.id}
          href={p.link}
          target="_blank"
          rel="noreferrer"
          className="group relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-md hover:shadow-xl transition-all"
        >
          <SmartIgImage
            src={p.image}
            alt={p.caption.slice(0, 80) || "Post Instagram RSU Aisyiyah"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white">
            <p className="text-xs line-clamp-3 mb-2">{p.caption}</p>
            <div className="flex items-center justify-between text-[10px] opacity-90">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" /> {p.likes}
              </span>
              <span>{formatDate(p.publishedAt)}</span>
            </div>
          </div>
          <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Instagram className="w-3.5 h-3.5 text-primary" />
          </div>
        </a>
      ))}
    </div>
  );
}
