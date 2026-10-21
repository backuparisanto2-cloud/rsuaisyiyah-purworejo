import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Home, Compass } from "lucide-react";

export default function NotFoundPage({
  description = "Halaman yang Anda cari tidak ada atau telah dipindahkan.",
}: {
  description?: string;
}) {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-16">
      {/* Ornamen latar mengikuti tema */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-secondary/10 blur-3xl"
      />

      <div className="relative max-w-md text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-primary/20 bg-primary/10 shadow-sm">
          <Compass className="h-12 w-12 text-primary" strokeWidth={1.5} />
        </div>

        <h1 className="mt-6 font-display text-7xl font-bold tracking-tight text-primary">404</h1>
        <h2 className="mt-3 text-xl font-semibold text-foreground">Halaman tidak ditemukan</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => router.history.back()}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Home className="h-4 w-4" />
            Menuju Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
