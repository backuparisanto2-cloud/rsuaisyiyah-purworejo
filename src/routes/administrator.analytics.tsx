import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getVisitorStats } from "@/lib/analytics.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ReTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "#10b981", "#f59e0b", "#ef4444", "#6366f1",
  "#06b6d4", "#ec4899", "#84cc16", "#a855f7", "#f97316",
];

function toChartData(data: Record<string, number>, limit = 8) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, limit).map(([name, value]) => ({ name, value }));
  const rest = entries.slice(limit).reduce((s, [, v]) => s + v, 0);
  if (rest > 0) top.push({ name: "Lainnya", value: rest });
  return top;
}

function PieBreakdown({ title, data }: { title: string; data: Record<string, number> }) {
  const chartData = toChartData(data);
  const total = chartData.reduce((s, d) => s + d.value, 0);
  return (
    <Card className="p-4 space-y-3">
      <h3 className="font-semibold text-sm">{title}</h3>
      {chartData.length === 0 ? (
        <p className="text-xs text-muted-foreground">Belum ada data</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={80}
                paddingAngle={2}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <ReTooltip
                formatter={(v: number, n: string) =>
                  [`${v.toLocaleString("id-ID")} (${((v / total) * 100).toFixed(1)}%)`, n]
                }
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function BarBreakdown({ title, data }: { title: string; data: Record<string, number> }) {
  const chartData = toChartData(data, 10);
  return (
    <Card className="p-4 space-y-3">
      <h3 className="font-semibold text-sm">{title}</h3>
      {chartData.length === 0 ? (
        <p className="text-xs text-muted-foreground">Belum ada data</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
              <ReTooltip
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}


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
          {entries.map(([k, v]) => {
            const w = max ? Math.max(2, Math.round((v / max) * 100)) : 0;
            return (
              <div key={k} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="truncate pr-2" title={k}>{k}</span>
                  <span className="tabular-nums text-muted-foreground">{v}</span>
                </div>
                <div className="h-2 rounded bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${w}%` }} />
                </div>
              </div>
            );
          })}
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

          <div className="grid md:grid-cols-2 gap-3">
            <PieBreakdown title="Perangkat (Mobile/Desktop)" data={q.data.byDevice} />
            <PieBreakdown title="Browser" data={q.data.byBrowser} />
            <BarBreakdown title="Sistem Operasi" data={q.data.byOs} />
            <BarBreakdown title="Negara" data={q.data.byCountry} />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
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
