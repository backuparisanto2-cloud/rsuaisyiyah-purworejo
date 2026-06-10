import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/administrator/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="space-y-4" data-tour="dashboard-root">
      <h1 className="text-2xl font-bold">Selamat datang di Admin CMS</h1>
      <p className="text-muted-foreground">
        Pilih modul di sidebar kiri. Fase 1 sudah aktif: <b>Hero Slider</b> dan <b>Pengaturan Slider</b>.
      </p>
      <div className="grid sm:grid-cols-2 gap-3 max-w-2xl" data-tour="dashboard-shortcuts">
        <Link to="/administrator/hero-slider" className="border rounded-lg p-4 bg-card hover:bg-muted transition">
          <div className="font-semibold">Hero Slider</div>
          <div className="text-xs text-muted-foreground mt-1">Kelola gambar slide hero (maks. 5)</div>
        </Link>
        <Link to="/administrator/hero-settings" className="border rounded-lg p-4 bg-card hover:bg-muted transition">
          <div className="font-semibold">Pengaturan Slider</div>
          <div className="text-xs text-muted-foreground mt-1">Kecepatan, autoplay, transisi</div>
        </Link>
      </div>
    </div>
  );
}
