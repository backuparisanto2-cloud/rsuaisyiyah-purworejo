import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

export type IgPost = {
  id: string;
  image: string;
  link: string;
  caption: string;
  publishedAt: string;
  likes: number;
};

const SOURCE_PID = "ed159bad-a965-4414-821f-cb202d5d5af5";

export const getInstagramPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ posts: IgPost[]; error: string | null }> => {
    const sources = encodeURIComponent(
      JSON.stringify({ pid: SOURCE_PID, filters: [] })
    );
    const url = `https://widget-data.service.elfsight.com/api/posts?sources[]=${sources}&sort=date&limit=10&offset=0`;


    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        return { posts: [], error: `Upstream ${res.status}` };
      }
      const json = (await res.json()) as {
        payload?: Array<{
          vendorId?: string;
          link?: string;
          publishedAt?: string;
          caption?: string;
          likesCount?: number;
          media?: Array<{ thumbnail?: { url?: string } }>;
        }>;
      };
      const posts: IgPost[] = (json.payload ?? [])
        .slice(0, 15)
        .map((p, i) => ({
          id: p.vendorId ?? `${i}`,
          image: p.media?.[0]?.thumbnail?.url ?? "",
          link: p.link ?? "https://www.instagram.com/rsu_aisyiyah",
          caption: (p.caption ?? "").split("...")[0].trim(),
          publishedAt: p.publishedAt ?? "",
          likes: p.likesCount ?? 0,
        }))
        .filter((p) => p.image);

      setResponseHeaders(
        new Headers({
          "Cache-Control": "public, max-age=600, s-maxage=600",
        })
      );

      return { posts, error: null };
    } catch (err) {
      console.error("Instagram fetch failed:", err);
      return { posts: [], error: "Gagal memuat post Instagram" };
    }
  }
);
