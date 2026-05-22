import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  value?: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  className?: string;
};

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

export default function ImageUpload({ value, onChange, folder = "uploads", className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!ALLOWED.includes(file.type)) {
      toast.error("Tipe file tidak didukung (JPG/PNG/WEBP/GIF/SVG)");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Ukuran maksimal 5 MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "bin";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false });
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      {value ? (
        <div className="relative w-full aspect-video rounded-md overflow-hidden border bg-muted">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
              Ganti
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={() => onChange(null)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-video rounded-md border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
        >
          {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
          <span className="mt-2 text-xs">{uploading ? "Mengunggah..." : "Klik untuk upload (≤ 5 MB)"}</span>
        </button>
      )}
    </div>
  );
}
