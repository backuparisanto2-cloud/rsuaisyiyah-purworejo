import { useEffect } from "react";
import { toast } from "sonner";
import { isForbiddenError } from "@/components/admin/AccessBanner";
import { useAuth } from "@/hooks/use-auth";

/**
 * Listens for unhandled permission errors (RLS / role-based) bubbling from
 * supabase calls in event handlers and replaces the raw error with a
 * friendly toast that explains the user's current role.
 */
export function useForbiddenInterceptor() {
  const { role } = useAuth();

  useEffect(() => {
    if (!role || role === "admin") return;

    function handle(err: unknown) {
      if (!isForbiddenError(err)) return false;
      const roleLabel = role === "reader" ? "Reader (hanya lihat)" : "Editor";
      toast.error("Aksi tidak diizinkan", {
        description:
          role === "reader"
            ? "Akun Reader Anda hanya bisa melihat. Hubungi admin untuk ditingkatkan menjadi Editor."
            : "Halaman atau aksi ini khusus admin. Hubungi admin bila Anda membutuhkan akses.",
        duration: 6000,
      });
      // eslint-disable-next-line no-console
      console.warn(`[forbidden:${roleLabel}]`, err);
      return true;
    }

    const onRejection = (e: PromiseRejectionEvent) => {
      if (handle(e.reason)) e.preventDefault();
    };
    const onError = (e: ErrorEvent) => {
      if (handle(e.error ?? e.message)) e.preventDefault();
    };
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
    };
  }, [role]);
}
