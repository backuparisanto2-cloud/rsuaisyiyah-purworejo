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
import { Loader2, RefreshCw, Eye } from "lucide-react";

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

function AuditLogPage() {
  const list = useServerFn(listAuditLogs);
  const facets = useServerFn(listAuditFacets);

  const [action, setAction] = useState<string>("");
  const [entity, setEntity] = useState<string>("");
  const [actorEmail, setActorEmail] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const [detail, setDetail] = useState<Row | null>(null);

  useEffect(() => { setOffset(0); }, [action, entity, actorEmail]);

  const facetsQ = useQuery({
    queryKey: ["audit-facets"],
    queryFn: () => facets(),
  });

  const q = useQuery({
    queryKey: ["audit-logs", { action, entity, actorEmail, offset }],
    queryFn: () =>
      list({
        data: {
          limit: PAGE,
          offset,
          action: action || undefined,
          entity: entity || undefined,
          actorEmail: actorEmail.trim() || undefined,
        },
      }),
  });

  const total = q.data?.total ?? 0;
  const rows = (q.data?.rows ?? []) as Row[];
  const pageNum = Math.floor(offset / PAGE) + 1;
  const lastPage = Math.max(1, Math.ceil(total / PAGE));

  const fmt = useMemo(
    () => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "medium" }),
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-muted-foreground">Riwayat tindakan admin pada sistem.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { void q.refetch(); void facetsQ.refetch(); }}>
          <RefreshCw className="h-4 w-4 mr-1" /> Muat ulang
        </Button>
      </div>

      <Card className="p-3 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs">Aksi</Label>
          <Select value={action || "__all"} onValueChange={(v) => setAction(v === "__all" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Semua" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Semua</SelectItem>
              {(facetsQ.data?.actions ?? []).map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Entitas</Label>
          <Select value={entity || "__all"} onValueChange={(v) => setEntity(v === "__all" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Semua" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Semua</SelectItem>
              {(facetsQ.data?.entities ?? []).map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs">Email pelaku</Label>
          <Input
            value={actorEmail}
            onChange={(e) => setActorEmail(e.target.value)}
            placeholder="cari email…"
          />
        </div>
      </Card>

      <Card className="overflow-x-auto">
        {q.isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : q.error ? (
          <div className="p-6 text-sm text-destructive">{(q.error as Error).message}</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground text-center">Belum ada catatan.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Waktu</TableHead>
                <TableHead>Pelaku</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Entitas</TableHead>
                <TableHead>ID</TableHead>
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
