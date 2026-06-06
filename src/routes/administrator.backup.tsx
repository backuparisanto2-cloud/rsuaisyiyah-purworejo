import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createFullBackup, restoreFromBackup } from "@/lib/backup.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, Loader2, Database, Upload, FileWarning } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/administrator/backup")({ component: BackupAdmin });

function BackupAdmin() {
  const runBackup = useServerFn(createFullBackup);
  const runRestore = useServerFn(restoreFromBackup);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [format, setFormat] = useState<"json" | "csv" | "both">("both");
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [includeStorage, setIncludeStorage] = useState(true);
  const [last, setLast] = useState<{ size: number; tables: number; files: number; filename: string } | null>(null);
  const [restoreLog, setRestoreLog] = useState<{ table: string; inserted: number; skipped: number; error?: string }[] | null>(null);
  const [restoreSummary, setRestoreSummary] = useState<{ storageRestored: number; storageFailed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function onDownload() {
    setLoading(true);
    try {
      const res = await runBackup({ data: { format } });
      const bin = atob(res.base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
      setLast({ size: res.size, tables: res.tables, files: res.files, filename: res.filename });
      toast.success("Backup berhasil diunduh");
    } catch (e) {
      toast.error("Gagal membuat backup: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }

  async function onRestore() {
    if (!selectedFile) {
      toast.error("Pilih file backup ZIP terlebih dahulu");
      return;
    }
    setRestoring(true);
    setRestoreLog(null);
    setRestoreSummary(null);
    try {
      const arr = new Uint8Array(await selectedFile.arrayBuffer());
      let bin = "";
      const chunk = 0x8000;
      for (let i = 0; i < arr.length; i += chunk) {
        bin += String.fromCharCode(...arr.subarray(i, i + chunk));
      }
      const base64 = btoa(bin);
      const res = await runRestore({ data: { base64, mode, includeStorage } });
      setRestoreLog(res.log);
      setRestoreSummary({ storageRestored: res.storageRestored, storageFailed: res.storageFailed });
      const errs = res.log.filter((l) => l.error).length;
      if (errs > 0) toast.warning(`Restore selesai dengan ${errs} error pada tabel`);
      else toast.success("Restore berhasil");
    } catch (e) {
      toast.error("Gagal restore: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setRestoring(false);
    }
  }

  function fmt(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Backup & Restore Database</h1>
        <p className="text-sm text-muted-foreground">
          Unduh seluruh isi database (JSON + CSV) beserta file storage, atau pulihkan kembali dari arsip backup.
        </p>
      </div>

      <Tabs defaultValue="backup">
        <TabsList>
          <TabsTrigger value="backup"><Download className="h-4 w-4 mr-1" /> Backup</TabsTrigger>
          <TabsTrigger value="restore"><Upload className="h-4 w-4 mr-1" /> Restore</TabsTrigger>
        </TabsList>

        <TabsContent value="backup">
          <Card className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Database className="h-8 w-8 text-primary shrink-0" />
              <div className="text-sm space-y-1">
                <p className="font-medium">Isi backup:</p>
                <ul className="list-disc ml-5 text-muted-foreground space-y-0.5">
                  <li><code>data/&lt;tabel&gt;.json</code> — untuk restore</li>
                  <li><code>csv/&lt;tabel&gt;.csv</code> — untuk dibuka di Excel/Sheets</li>
                  <li><code>storage/&lt;bucket&gt;/&lt;path&gt;</code> — file media</li>
                  <li><code>manifest.json</code> — skema, relasi, urutan restore</li>
                </ul>
              </div>
            </div>

            <div className="grid sm:grid-cols-[200px_1fr] gap-3 items-center">
              <Label>Format ekspor</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as "json" | "csv" | "both")}>
                <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">JSON + CSV (lengkap)</SelectItem>
                  <SelectItem value="json">JSON saja</SelectItem>
                  <SelectItem value="csv">CSV saja (tanpa restore)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={onDownload} disabled={loading} data-tour="backup-download">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {loading ? "Mengemas backup…" : "Unduh Backup Lengkap"}
            </Button>

            {last && (
              <div className="text-sm bg-muted/50 rounded-md p-3 space-y-1">
                <div className="font-medium">Backup terakhir</div>
                <div className="text-muted-foreground">
                  {last.filename} · {fmt(last.size)} · {last.tables} tabel · {last.files} file storage
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="restore">
          <Card className="p-5 space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-md bg-destructive/10 border border-destructive/30">
              <FileWarning className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Peringatan</p>
                <p className="text-muted-foreground">
                  Restore akan menulis ulang data. Pada mode <b>Replace</b>, data tabel yang ada akan dihapus terlebih dahulu. Disarankan unduh backup baru sebelum melakukan restore.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>File backup (.zip)</Label>
              <input
                ref={fileRef}
                type="file"
                accept=".zip,application/zip"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                className="block text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border file:border-input file:bg-background file:text-sm hover:file:bg-muted"
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground">{selectedFile.name} · {fmt(selectedFile.size)}</p>
              )}
            </div>

            <div className="grid sm:grid-cols-[200px_1fr] gap-3 items-center">
              <Label>Mode restore</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as "merge" | "replace")}>
                <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="merge">Merge (upsert berdasarkan id)</SelectItem>
                  <SelectItem value="replace">Replace (hapus & timpa)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Switch id="storage" checked={includeStorage} onCheckedChange={setIncludeStorage} />
              <Label htmlFor="storage" className="cursor-pointer">Pulihkan juga file storage</Label>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={restoring || !selectedFile} variant="destructive">
                  {restoring ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  {restoring ? "Memulihkan…" : "Mulai Restore"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi restore</AlertDialogTitle>
                  <AlertDialogDescription>
                    Mode <b>{mode === "replace" ? "Replace" : "Merge"}</b>{includeStorage ? " + file storage" : ""}. Aksi ini tidak dapat dibatalkan. Lanjutkan?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={onRestore}>Ya, lanjutkan</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {restoreLog && (
              <div className="text-sm border rounded-md divide-y">
                <div className="px-3 py-2 bg-muted/50 font-medium flex justify-between">
                  <span>Hasil restore</span>
                  {restoreSummary && (
                    <span className="text-muted-foreground">
                      Storage: {restoreSummary.storageRestored} ok · {restoreSummary.storageFailed} gagal
                    </span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {restoreLog.map((l) => (
                    <div key={l.table} className="px-3 py-1.5 flex justify-between gap-2 text-xs">
                      <span className="font-mono">{l.table}</span>
                      <span className={l.error ? "text-destructive" : "text-muted-foreground"}>
                        {l.error ? `error: ${l.error}` : `${l.inserted} ditulis${l.skipped ? ` · ${l.skipped} skip` : ""}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
