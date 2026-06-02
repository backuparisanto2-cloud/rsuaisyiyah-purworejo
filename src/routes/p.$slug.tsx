import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PagePreview } from "./administrator.pages";

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

type PageImage = { url: string; position: "top" | "bottom" | "left" | "right" | "inline"; width: number; caption?: string };

type Page = {
  id: string;
  title: string;
  content: string;
  meta_description: string;
  is_published: boolean;
  image_url: string | null;
  image_position: "top" | "bottom" | "left" | "right";
  images: PageImage[];
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
        .select("id, title, content, meta_description, is_published, image_url, image_position, images")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (!alive) return;
      if (error || !data) setNotFoundFlag(true);
      else {
        const d = data as any;
        setPage({ ...d, images: Array.isArray(d.images) ? d.images : [] } as Page);
      }
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

  // Merge legacy image_url into images if no images set
  let imgs = page.images;
  if (imgs.length === 0 && page.image_url) {
    imgs = [{ url: page.image_url, position: page.image_position || "top", width: 100 }];
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header pageId={page.id} />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Beranda</Link>
          <h1 className="text-4xl font-bold mt-4 mb-6">{page.title}</h1>
          <PagePreview content={page.content} images={imgs} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
