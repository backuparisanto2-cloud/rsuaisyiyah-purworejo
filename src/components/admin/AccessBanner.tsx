import { Link } from "@tanstack/react-router";
import { ShieldAlert, Eye, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

/**
 * Persistent banner shown at the top of admin pages for non-admin users,
 * explaining what they can and cannot do. Pre-empts confusing permission errors.
 */
export function AccessBanner() {
  const { role } = useAuth();
  if (role === "admin" || !role) return null;

  if (role === "reader") {
    return (
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/50 p-3 sm:p-4 flex items-start gap-3">
        <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="font-medium text-amber-900 dark:text-amber-200">Mode Lihat Saja</div>
          <div className="text-amber-800/80 dark:text-amber-200/80">
            Akun Anda berperan sebagai <b>Reader</b>. Anda dapat menelusuri semua konten,
            tetapi tombol Simpan, Hapus, dan Unggah dinonaktifkan. Hubungi admin untuk
            ditingkatkan menjadi Editor.
          </div>
        </div>
      </div>
    );
  }

  // editor — only friendly heads-up; no restriction on normal content
  return (
    <div className="mb-4 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
      <Lock className="h-3.5 w-3.5" />
      Sebagai <b className="text-foreground">Editor</b>, Anda bisa mengubah semua konten kecuali Tema Warna dan Pengguna.
    </div>
  );
}

/**
 * Full-page friendly forbidden view, rendered when a user lands on an
 * admin-only route via direct URL.
 */
export function ForbiddenView({ title = "Halaman khusus admin", description, backTo = "/administrator" }: {
  title?: string;
  description?: string;
  backTo?: string;
}) {
  const { role } = useAuth();
  const roleLabel = role === "editor" ? "Editor" : role === "reader" ? "Reader" : "Pengguna";
  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="rounded-2xl border bg-card p-6 sm:p-8 text-center shadow-sm">
        <div className="mx-auto h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-4">
          <ShieldAlert className="h-7 w-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {description ?? `Halaman ini hanya bisa diakses oleh Admin. Akun Anda berperan sebagai ${roleLabel}.`}
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          Bila Anda perlu akses, silakan minta admin menaikkan peran akun Anda
          di menu <i>Pengguna</i>.
        </p>
        <div className="mt-5">
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

const RLS_HINTS = [
  "row-level security",
  "permission denied",
  "violates row-level security",
  "new row violates",
  "policy",
];

/** Detects backend permission errors (RLS / role-based). */
export function isForbiddenError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();
  return RLS_HINTS.some((h) => msg.includes(h));
}
