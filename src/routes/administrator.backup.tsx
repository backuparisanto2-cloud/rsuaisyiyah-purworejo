import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createFullBackup } from "@/lib/backup.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Loader2, Database } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/administrator/backup")({ component: BackupAdmin });

function BackupAdmin() {
  const run = useServerFn(createFullBackup);
  const [loading, setLoading] = useState(false);
  const [last, setLast] = useState<{ size: number; tables: number; files: number; filename: string } | null>(null);

  async function onDownload() {
    setLoading(true);
    try {
      const res = await run();
      // Decode base64 → Blob → trigger download
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
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Gagal membuat backup: " + msg);
    } finally {
      setLoading(false);
    }
  }

  function fmt(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Backup Database</h1>
        <p className="text-sm text-muted-foreground">
          Unduh seluruh isi database (data + skema + relasi) beserta semua file di storage bucket ke dalam satu arsip ZIP.
        </p>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Database className="h-8 w-8 text-primary shrink-0" />
          <div className="text-sm space-y-1">
            <p className="font-medium">Isi backup:</p>
            <ul className="list-disc ml-5 text-muted-foreground space-y-0.5">
              <li><code>data/&lt;tabel&gt;.json</code> — seluruh baris per tabel</li>
              <li><code>storage/&lt;bucket&gt;/&lt;path&gt;</code> — semua file media</li>
              <li><code>manifest.json</code> — skema kolom, relasi antar tabel, jumlah baris, daftar file</li>
            </ul>
          </div>
        </div>

        <Button onClick={onDownload} disabled={loading} data-tour="backup-download">
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          {loading ? "Mengemas backup…" : "Unduh Backup Lengkap"}
        </Button>

        {loading && (
          <p className="text-xs text-muted-foreground">
            Proses ini mungkin memakan waktu beberapa detik hingga semenit tergantung jumlah file di storage.
          </p>
        )}

        {last && (
          <div className="text-sm bg-muted/50 rounded-md p-3 space-y-1">
            <div className="font-medium">Backup terakhir</div>
            <div className="text-muted-foreground">
              {last.filename} · {fmt(last.size)} · {last.tables} tabel · {last.files} file storage
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
