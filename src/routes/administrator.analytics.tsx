import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getVisitorStats } from "@/lib/analytics.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/administrator/analytics")({
  component: AnalyticsPage,
});

function toLocalInput(d: Date) {
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60_000);
  return local.toISOString().slice(0, 16);
}

function fmtMs(ms: number) {
  if (!ms) return "0d";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}d`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${m}m ${rs}d`;
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const w = max ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="truncate pr-2" title={label}>{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 rounded bg-muted overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${w}%` }} />
      </div>
    </div>
  );
}

function Breakdown({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const max = entries[0]?.[1] ?? 0;
  return (
    <Card className="p-4 space-y-3">
      <h3 className="font-semibold text-sm">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">Belum ada data</p>
      ) : (
        <div className="space-y-2">
          {entries.map(([k, v]) => <Bar key={k} label={k} value={v} max={max} />)}
        </div>
      )}
    </Card>
  );
}

function AnalyticsPage() {
  const fn = useServerFn(getVisitorStats);
  const [from, setFrom] = useState(() => toLocalInput(new Date(Date.now() - 7 * 86400_000)));
  const [to, setTo] = useState(() => toLocalInput(new Date()));

  const range = useMemo(() => ({
    from: new Date(from).toISOString(),
    to: new Date(to).toISOString(),
  }), [from, to]);

  const q = useQuery({
    queryKey: ["visitor-stats", range],
    queryFn: () => fn({ data: range }),
  });

  const setPreset = (days: number) => {
    setFrom(toLocalInput(new Date(Date.now() - days * 86400_000)));
    setTo(toLocalInput(new Date()));
  };

  return (
    <div className="space-y-4" data-tour="analytics-root">
      <div>
        <h1 className="text-2xl font-bold">Statistik Pengunjung</h1>
        <p className="text-sm text-muted-foreground">
          Data kunjungan halaman publik. Filter berdasarkan rentang tanggal.
        </p>
      </div>

      <Card className="p-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">Dari</label>
          <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Sampai</label>
          <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreset(1)}>24 jam</Button>
          <Button variant="outline" size="sm" onClick={() => setPreset(7)}>7 hari</Button>
          <Button variant="outline" size="sm" onClick={() => setPreset(30)}>30 hari</Button>
          <Button variant="outline" size="sm" onClick={() => setPreset(90)}>90 hari</Button>
        </div>
        <Button onClick={() => q.refetch()} disabled={q.isFetching}>
          {q.isFetching && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          Muat ulang
        </Button>
      </Card>

      {q.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat…
        </div>
      ) : q.error ? (
        <Card className="p-4 text-sm text-destructive">
          Gagal memuat: {(q.error as Error).message}
        </Card>
      ) : q.data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Stat label="Kunjungan" value={q.data.totals.views.toLocaleString("id-ID")} />
            <Stat label="Sesi unik" value={q.data.totals.sessions.toLocaleString("id-ID")} />
            <Stat label="Bounce rate" value={pct(q.data.totals.bounceRate)} sub={`${q.data.totals.bounces} bounce`} />
            <Stat label="Rata-rata durasi" value={fmtMs(q.data.totals.avgDurationMs)} />
            <Stat label="Total sepanjang waktu" value={q.data.totals.allTimeViews.toLocaleString("id-ID")} />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Breakdown title="Perangkat" data={q.data.byDevice} />
            <Breakdown title="Browser" data={q.data.byBrowser} />
            <Breakdown title="Sistem Operasi" data={q.data.byOs} />
            <Breakdown title="Negara" data={q.data.byCountry} />
            <Breakdown title="Halaman terpopuler" data={q.data.byPath} />
            <Breakdown title="Kunjungan per hari" data={q.data.byDay} />
          </div>

          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3">50 kunjungan terbaru</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-1 pr-3">Waktu</th>
                    <th className="py-1 pr-3">Halaman</th>
                    <th className="py-1 pr-3">Device</th>
                    <th className="py-1 pr-3">Browser</th>
                    <th className="py-1 pr-3">Negara</th>
                    <th className="py-1 pr-3">Durasi</th>
                    <th className="py-1 pr-3">Bounce</th>
                  </tr>
                </thead>
                <tbody>
                  {q.data.recent.map((r: any) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-1 pr-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString("id-ID")}</td>
                      <td className="py-1 pr-3 max-w-[240px] truncate" title={r.path}>{r.path}</td>
                      <td className="py-1 pr-3">{r.device}</td>
                      <td className="py-1 pr-3">{r.browser}</td>
                      <td className="py-1 pr-3">{r.country ?? "—"}</td>
                      <td className="py-1 pr-3">{fmtMs(r.duration_ms)}</td>
                      <td className="py-1 pr-3">{r.is_bounce ? "Ya" : "Tidak"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </Card>
  );
}
