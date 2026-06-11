import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listAuditLogs, listAuditFacets } from "@/lib/audit.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Eye, Search, X } from "lucide-react";

export const Route = createFileRoute("/administrator/audit-log")({
  component: AuditLogPage,
});

type Row = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

const PAGE = 50;

// "datetime-local" input value <-> ISO string
const toIso = (v: string) => (v ? new Date(v).toISOString() : undefined);
const toLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16);
};

function AuditLogPage() {
  const list = useServerFn(listAuditLogs);
  const facets = useServerFn(listAuditFacets);

  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [entityId, setEntityId] = useState("");
  const [actorEmail, setActorEmail] = useState("");
  const [from, setFrom] = useState<string>(""); // datetime-local
  const [to, setTo] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const [detail, setDetail] = useState<Row | null>(null);

  useEffect(() => { setOffset(0); }, [q, action, entity, entityId, actorEmail, from, to]);

  const facetsQ = useQuery({
    queryKey: ["audit-facets"],
    queryFn: () => facets(),
  });

  const params = useMemo(
    () => ({
      limit: PAGE,
      offset,
      q: q.trim() || undefined,
      action: action || undefined,
      entity: entity || undefined,
      entityId: entityId.trim() || undefined,
      actorEmail: actorEmail.trim() || undefined,
      from: toIso(from),
      to: toIso(to),
    }),
    [q, action, entity, entityId, actorEmail, from, to, offset],
  );

  const qy = useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => list({ data: params }),
  });

  const total = qy.data?.total ?? 0;
  const rows = (qy.data?.rows ?? []) as Row[];
  const pageNum = Math.floor(offset / PAGE) + 1;
  const lastPage = Math.max(1, Math.ceil(total / PAGE));

  const fmt = useMemo(
    () => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "medium" }),
    [],
  );

  const hasFilter = !!(q || action || entity || entityId || actorEmail || from || to);

  function reset() {
    setQ(""); setAction(""); setEntity(""); setEntityId(""); setActorEmail(""); setFrom(""); setTo("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-muted-foreground">Riwayat tindakan admin pada sistem.</p>
        </div>
        <div className="flex gap-2">
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <X className="h-4 w-4 mr-1" /> Reset filter
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => { void qy.refetch(); void facetsQ.refetch(); }}>
            <RefreshCw className="h-4 w-4 mr-1" /> Muat ulang
          </Button>
        </div>
      </div>

      <Card className="p-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari di aksi, pelaku, entitas, atau ID target…"
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Aksi</Label>
            <Select value={action || "__all"} onValueChange={(v) => setAction(v === "__all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Semua aksi</SelectItem>
                {(facetsQ.data?.actions ?? []).map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Entitas (target type)</Label>
            <Select value={entity || "__all"} onValueChange={(v) => setEntity(v === "__all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Semua entitas</SelectItem>
                {(facetsQ.data?.entities ?? []).map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Actor (email)</Label>
            <Select value={actorEmail || "__all"} onValueChange={(v) => setActorEmail(v === "__all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Semua actor</SelectItem>
                {(facetsQ.data?.actors ?? []).map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Target ID</Label>
            <Input
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="ID atau bagiannya"
            />
          </div>
          <div>
            <Label className="text-xs">Dari</Label>
            <Input
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              max={to || undefined}
            />
          </div>
          <div>
            <Label className="text-xs">Sampai</Label>
            <Input
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              min={from || undefined}
            />
          </div>
          <div className="flex items-end gap-2 sm:col-span-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                const start = new Date(now);
                start.setHours(0, 0, 0, 0);
                setFrom(toLocalInput(start.toISOString()));
                setTo(toLocalInput(now.toISOString()));
              }}
            >
              Hari ini
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                const start = new Date(now.getTime() - 7 * 24 * 3600_000);
                setFrom(toLocalInput(start.toISOString()));
                setTo(toLocalInput(now.toISOString()));
              }}
            >
              7 hari
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                const start = new Date(now.getTime() - 30 * 24 * 3600_000);
                setFrom(toLocalInput(start.toISOString()));
                setTo(toLocalInput(now.toISOString()));
              }}
            >
              30 hari
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        {qy.isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : qy.error ? (
          <div className="p-6 text-sm text-destructive">{(qy.error as Error).message}</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground text-center">
            {hasFilter ? "Tidak ada catatan yang cocok dengan filter." : "Belum ada catatan."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Waktu</TableHead>
                <TableHead>Pelaku</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Entitas</TableHead>
                <TableHead>Target ID</TableHead>
                <TableHead className="text-right">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-xs">{fmt.format(new Date(r.created_at))}</TableCell>
                  <TableCell className="text-sm">{r.actor_email ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell><Badge variant="secondary">{r.action}</Badge></TableCell>
                  <TableCell className="text-sm">{r.entity ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs max-w-[14ch] truncate">{r.entity_id ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setDetail(r)}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">{total} catatan</div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>Sebelumnya</Button>
          <span>Hal. {pageNum} / {lastPage}</span>
          <Button size="sm" variant="outline" disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>Berikutnya</Button>
        </div>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detail catatan</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-muted-foreground">Waktu</div><div className="col-span-2">{fmt.format(new Date(detail.created_at))}</div>
                <div className="text-muted-foreground">Pelaku</div><div className="col-span-2">{detail.actor_email ?? "—"}</div>
                <div className="text-muted-foreground">User ID</div><div className="col-span-2 font-mono text-xs break-all">{detail.actor_id ?? "—"}</div>
                <div className="text-muted-foreground">Aksi</div><div className="col-span-2">{detail.action}</div>
                <div className="text-muted-foreground">Entitas</div><div className="col-span-2">{detail.entity ?? "—"}</div>
                <div className="text-muted-foreground">Entity ID</div><div className="col-span-2 font-mono text-xs break-all">{detail.entity_id ?? "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Metadata</div>
                <pre className="bg-muted rounded p-2 text-xs overflow-auto max-h-80">{JSON.stringify(detail.metadata, null, 2)}</pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
