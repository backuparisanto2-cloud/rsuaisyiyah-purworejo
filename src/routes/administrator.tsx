import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Images,
  Settings as SettingsIcon,
  Info,
  Clock,
  Stethoscope,
  Users,
  Handshake,
  HelpCircle,
  Phone,
  ListTree,
  LayoutTemplate,
  Palette,
  LogOut,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/administrator")({
  head: () => ({ meta: [{ title: "Admin CMS · RSU Aisyiyah Purworejo" }] }),
  component: AdminLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; disabled?: boolean };

const NAV: NavItem[] = [
  { to: "/administrator", label: "Dashboard", icon: LayoutDashboard },
  { to: "/administrator/hero-slider", label: "Hero Slider", icon: Images },
  { to: "/administrator/hero-settings", label: "Pengaturan Slider", icon: SettingsIcon },
  { to: "/administrator/tentang", label: "Tentang", icon: Info, disabled: true },
  { to: "/administrator/jam-besuk", label: "Jam Besuk", icon: Clock, disabled: true },
  { to: "/administrator/layanan", label: "Layanan", icon: Stethoscope, disabled: true },
  { to: "/administrator/dokter", label: "Jadwal Dokter", icon: Users, disabled: true },
  { to: "/administrator/mitra", label: "Mitra", icon: Handshake, disabled: true },
  { to: "/administrator/faq", label: "FAQ", icon: HelpCircle, disabled: true },
  { to: "/administrator/kontak", label: "Kontak / Footer", icon: Phone, disabled: true },
  { to: "/administrator/menu", label: "Menu Builder", icon: ListTree, disabled: true },
  { to: "/administrator/sections", label: "Urutan Section", icon: LayoutTemplate, disabled: true },
  { to: "/administrator/theme", label: "Tema Warna", icon: Palette, disabled: true },
];

function AdminLayout() {
  const { session, isAdmin, loading, signOut, user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!session) navigate({ to: "/auth" });
    else if (!isAdmin) {
      toast.error("Akses ditolak: bukan admin");
      navigate({ to: "/" });
    }
  }, [session, isAdmin, loading, navigate]);

  if (loading || !session || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="w-64 shrink-0 bg-card border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="font-bold">RSU Aisyiyah</div>
          <div className="text-xs text-muted-foreground">Admin CMS</div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = pathname === n.to;
            const cls = cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
              active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              n.disabled && "opacity-50 cursor-not-allowed",
            );
            if (n.disabled)
              return (
                <div key={n.to} className={cls} title="Tersedia di fase berikutnya">
                  <Icon className="h-4 w-4" /> {n.label}
                </div>
              );
            return (
              <Link key={n.to} to={n.to} className={cls}>
                <Icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t text-xs text-muted-foreground truncate">{user?.email}</div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-card border-b flex items-center justify-between px-4">
          <div className="text-sm text-muted-foreground">Panel Admin</div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-sm text-muted-foreground hover:underline">Lihat website ↗</Link>
            <Button size="sm" variant="outline" onClick={() => signOut().then(() => navigate({ to: "/auth" }))}>
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
