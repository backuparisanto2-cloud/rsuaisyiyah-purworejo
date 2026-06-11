import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  LayoutDashboard, Images, Settings as SettingsIcon, Info, Clock, Stethoscope,
  Users, Handshake, HelpCircle, Phone, ListTree, LayoutTemplate, Palette,
  Bot, LogOut, Loader2, Type, FileText, Instagram, Menu as MenuIcon, Database,
  UserCog, BarChart3, ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { startTour, syncTourWithRoute } from "@/lib/tour";
import { AccessBanner, ForbiddenView } from "@/components/admin/AccessBanner";
import { useForbiddenInterceptor } from "@/hooks/use-forbidden-interceptor";


export const Route = createFileRoute("/administrator")({
  head: () => ({ meta: [{ title: "Admin CMS · RSU Aisyiyah Purworejo" }] }),
  component: AdminLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; disabled?: boolean; adminOnly?: boolean };

const NAV: NavItem[] = [
  { to: "/administrator", label: "Dashboard", icon: LayoutDashboard },
  { to: "/administrator/hero-content", label: "Hero Teks & Logo", icon: Type },
  { to: "/administrator/hero-slider", label: "Hero Slider", icon: Images },
  { to: "/administrator/hero-settings", label: "Pengaturan Slider", icon: SettingsIcon },
  { to: "/administrator/tentang", label: "Tentang", icon: Info },
  { to: "/administrator/jam-besuk", label: "Jam Besuk", icon: Clock },
  { to: "/administrator/layanan", label: "Layanan", icon: Stethoscope },
  { to: "/administrator/dokter", label: "Jadwal Dokter", icon: Users },
  { to: "/administrator/mitra", label: "Mitra", icon: Handshake },
  { to: "/administrator/faq", label: "FAQ", icon: HelpCircle },
  { to: "/administrator/kontak", label: "Kontak / Footer", icon: Phone },
  { to: "/administrator/instagram", label: "Berita & Instagram", icon: Instagram },
  { to: "/administrator/pages", label: "Page Builder", icon: FileText },
  { to: "/administrator/menu", label: "Menu Builder", icon: ListTree },
  { to: "/administrator/sections", label: "Urutan Section", icon: LayoutTemplate },
  { to: "/administrator/theme", label: "Tema Warna", icon: Palette, adminOnly: true },
  { to: "/administrator/chatbot", label: "Chatbot", icon: Bot },
  { to: "/administrator/analytics", label: "Statistik Pengunjung", icon: BarChart3, adminOnly: true },
  { to: "/administrator/users", label: "Pengguna", icon: UserCog, adminOnly: true },
  { to: "/administrator/backup", label: "Backup Database", icon: Database, adminOnly: true },
  { to: "/administrator/audit-log", label: "Audit Log", icon: ScrollText, adminOnly: true },
];

function NavList({ pathname, onNavigate, isAdmin }: { pathname: string; onNavigate?: () => void; isAdmin: boolean }) {
  return (
    <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
      {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => {
        const Icon = n.icon;
        const active = pathname === n.to;
        const cls = cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
          active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
          n.disabled && "opacity-50 cursor-not-allowed",
        );
        if (n.disabled) return <div key={n.to} className={cls} title="Fase berikutnya"><Icon className="h-4 w-4" /> {n.label}</div>;
        return <Link key={n.to} to={n.to} className={cls} onClick={onNavigate} data-tour={`nav-${n.to}`}><Icon className="h-4 w-4" /> {n.label}</Link>;

      })}
    </nav>
  );
}

function AdminLayout() {
  const { session, role, isAdmin, loading, signOut, user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  useForbiddenInterceptor();

  useEffect(() => {
    if (loading) return;
    if (!session) navigate({ to: "/auth" });
    else if (!role) {
      toast.error("Akses ditolak: belum memiliki role");
      navigate({ to: "/" });
    }
  }, [session, role, loading, navigate]);

  const currentNav = NAV.find((n) => n.to === pathname);
  const blockedAdminOnly = !!currentNav?.adminOnly && !!role && !isAdmin;

  // Keep the active tour highlight in sync when the admin route changes mid-tour
  useEffect(() => {
    syncTourWithRoute(pathname, (to) => navigate({ to: to as string }));
  }, [pathname, navigate]);

  if (loading || !session || !role) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const currentLabel = NAV.find((n) => n.to === pathname)?.label ?? "Panel Admin";
  const roleLabel = role === "admin" ? "Admin" : role === "editor" ? "Editor" : "Reader";
  const roleBadgeCls = role === "admin"
    ? "bg-primary text-primary-foreground"
    : role === "editor"
    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
    : "bg-muted text-muted-foreground";

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-card border-r flex-col" data-tour="sidebar">
        <div className="p-4 border-b"><div className="font-bold">RSU Aisyiyah</div><div className="text-xs text-muted-foreground">Admin CMS</div></div>
        <NavList pathname={pathname} isAdmin={isAdmin} />
        <div className="p-3 border-t text-xs text-muted-foreground flex items-center justify-between gap-2">
          <span className="truncate">{user?.email}</span>
          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0", roleBadgeCls)}>{roleLabel}</span>
        </div>
      </aside>


      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-card border-b flex items-center justify-between px-3 sm:px-4 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile menu trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="md:hidden h-9 w-9 shrink-0" data-tour="mobile-menu-trigger">
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 flex flex-col">
                <SheetTitle className="sr-only">Menu Admin</SheetTitle>
                <div className="p-4 border-b">
                  <div className="font-bold">RSU Aisyiyah</div>
                  <div className="text-xs text-muted-foreground">Admin CMS</div>
                </div>
                <NavList pathname={pathname} isAdmin={isAdmin} onNavigate={() => setMobileOpen(false)} />
                <div className="p-3 border-t text-xs text-muted-foreground truncate">{user?.email}</div>
              </SheetContent>
            </Sheet>
            <div className="text-sm font-medium truncate">{currentLabel}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/" className="hidden sm:inline text-sm text-muted-foreground hover:underline">Lihat website ↗</Link>
            <Button
              size="sm"
              variant="outline"
              onClick={() => startTour(pathname, (to) => navigate({ to: to as string }))}
              data-tour="header-tutorial"
              title="Mulai tutorial halaman ini"
            >
              <HelpCircle className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Tutorial</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => signOut().then(() => navigate({ to: "/auth" }))}>
              <LogOut className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>

        </header>
        <main className="flex-1 p-3 sm:p-6 overflow-x-hidden">
          <AccessBanner />
          {blockedAdminOnly ? <ForbiddenView title={`${currentNav?.label ?? "Halaman ini"} khusus admin`} /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}
