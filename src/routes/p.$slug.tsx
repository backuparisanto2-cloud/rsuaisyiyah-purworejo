import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const Route = createFileRoute("/p/$slug")({
  component: CustomPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
      <Link to="/" className="text-primary underline">Kembali ke beranda</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <h1 className="text-2xl font-bold">Terjadi kesalahan</h1>
      <p className="text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
});

type Page = {
  title: string;
  content: string;
  meta_description: string;
  is_published: boolean;
  image_url: string | null;
  image_position: "top" | "bottom" | "left" | "right";
};

function CustomPage() {
  const { slug } = Route.useParams();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("custom_pages")
        .select("title, content, meta_description, is_published, image_url, image_position")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (!alive) return;
      if (error || !data) setNotFoundFlag(true);
      else setPage(data as Page);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => {
    if (page?.title) document.title = page.title;
    if (page?.meta_description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) {
        m = document.createElement("meta");
        m.setAttribute("name", "description");
        document.head.appendChild(m);
      }
      m.setAttribute("content", page.meta_description);
    }
  }, [page]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (notFoundFlag || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
        <Link to="/" className="text-primary underline">Kembali ke beranda</Link>
      </div>
    );
  }

  const pos = page.image_position || "top";
  const isSide = pos === "left" || pos === "right";
  const flexDir = pos === "left" ? "md:flex-row" : pos === "right" ? "md:flex-row-reverse" : pos === "bottom" ? "flex-col-reverse" : "flex-col";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Beranda</Link>
          <h1 className="text-4xl font-bold mt-4 mb-6">{page.title}</h1>
          <div className={`flex gap-8 ${flexDir}`}>
            {page.image_url && (
              <img
                src={page.image_url}
                alt={page.title}
                className={`rounded-xl object-cover shadow-md ${isSide ? "md:w-2/5 w-full self-start" : "w-full max-h-[480px]"}`}
              />
            )}
            <article
              className="prose prose-lg max-w-none dark:prose-invert flex-1"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

