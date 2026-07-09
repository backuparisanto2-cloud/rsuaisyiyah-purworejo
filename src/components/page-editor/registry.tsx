import type { ReactNode } from "react";

export type NodeType =
  | "section"
  | "container"
  | "columns2"
  | "columns3"
  | "columns4"
  | "heading"
  | "text"
  | "image"
  | "button"
  | "divider"
  | "spacer"
  | "video"
  | "gallery"
  | "icon"
  | "rawHtml";

export type EditorNode = {
  id: string;
  type: NodeType;
  props: Record<string, any>;
  children?: EditorNode[];
};

export type PropField =
  | { key: string; label: string; kind: "text" }
  | { key: string; label: string; kind: "textarea" }
  | { key: string; label: string; kind: "number"; min?: number; max?: number; step?: number }
  | { key: string; label: string; kind: "select"; options: { label: string; value: string }[] }
  | { key: string; label: string; kind: "url" }
  | { key: string; label: string; kind: "color" };

export type WidgetDef = {
  type: NodeType;
  label: string;
  group: "Dasar" | "Layout" | "Media" | "Lanjutan";
  isContainer?: boolean;
  slots?: number;
  defaultProps: Record<string, any>;
  fields: PropField[];
  render: (props: Record<string, any>, slots: ReactNode[]) => ReactNode;
};

const wrap = (cls: string, children: ReactNode) => <div className={cls}>{children}</div>;

export const WIDGETS: Record<NodeType, WidgetDef> = {
  section: {
    type: "section",
    label: "Section",
    group: "Layout",
    isContainer: true,
    slots: 1,
    defaultProps: { padding: "py-12 px-4", bg: "" },
    fields: [
      { key: "padding", label: "Padding kelas Tailwind", kind: "text" },
      { key: "bg", label: "Background kelas Tailwind", kind: "text" },
    ],
    render: (p, [s]) => <section className={`${p.padding ?? ""} ${p.bg ?? ""}`}>{s}</section>,
  },
  container: {
    type: "container",
    label: "Container",
    group: "Layout",
    isContainer: true,
    slots: 1,
    defaultProps: { maxWidth: "max-w-5xl" },
    fields: [{ key: "maxWidth", label: "Max width", kind: "select", options: [
      { label: "sm", value: "max-w-3xl" },
      { label: "md", value: "max-w-4xl" },
      { label: "lg", value: "max-w-5xl" },
      { label: "xl", value: "max-w-6xl" },
      { label: "full", value: "max-w-full" },
    ] }],
    render: (p, [s]) => <div className={`mx-auto ${p.maxWidth ?? "max-w-5xl"}`}>{s}</div>,
  },
  columns2: {
    type: "columns2", label: "Columns 2", group: "Layout", isContainer: true, slots: 2,
    defaultProps: { gap: "gap-6" },
    fields: [{ key: "gap", label: "Gap", kind: "text" }],
    render: (p, s) => <div className={`grid grid-cols-1 md:grid-cols-2 ${p.gap ?? "gap-6"}`}>{s.map((c, i) => <div key={i}>{c}</div>)}</div>,
  },
  columns3: {
    type: "columns3", label: "Columns 3", group: "Layout", isContainer: true, slots: 3,
    defaultProps: { gap: "gap-6" },
    fields: [{ key: "gap", label: "Gap", kind: "text" }],
    render: (p, s) => <div className={`grid grid-cols-1 md:grid-cols-3 ${p.gap ?? "gap-6"}`}>{s.map((c, i) => <div key={i}>{c}</div>)}</div>,
  },
  columns4: {
    type: "columns4", label: "Columns 4", group: "Layout", isContainer: true, slots: 4,
    defaultProps: { gap: "gap-6" },
    fields: [{ key: "gap", label: "Gap", kind: "text" }],
    render: (p, s) => <div className={`grid grid-cols-2 md:grid-cols-4 ${p.gap ?? "gap-6"}`}>{s.map((c, i) => <div key={i}>{c}</div>)}</div>,
  },
  heading: {
    type: "heading", label: "Heading", group: "Dasar",
    defaultProps: { text: "Judul Halaman", level: "h2", align: "left" },
    fields: [
      { key: "text", label: "Teks", kind: "text" },
      { key: "level", label: "Level", kind: "select", options: ["h1","h2","h3","h4","h5","h6"].map(v => ({label: v, value: v})) },
      { key: "align", label: "Rata", kind: "select", options: [
        { label: "Kiri", value: "left" }, { label: "Tengah", value: "center" }, { label: "Kanan", value: "right" },
      ]},
    ],
    render: (p) => {
      const Tag = (p.level ?? "h2") as any;
      const sizes: Record<string,string> = { h1: "text-4xl md:text-5xl font-bold", h2: "text-3xl md:text-4xl font-bold", h3: "text-2xl md:text-3xl font-semibold", h4: "text-xl md:text-2xl font-semibold", h5: "text-lg font-semibold", h6: "text-base font-semibold" };
      return <Tag className={`${sizes[p.level ?? "h2"]} text-${p.align ?? "left"}`}>{p.text}</Tag>;
    },
  },
  text: {
    type: "text", label: "Text", group: "Dasar",
    defaultProps: { text: "Tulis paragraf di sini. Anda dapat mengubah teks ini dari panel properti di kanan." },
    fields: [{ key: "text", label: "Teks", kind: "textarea" }],
    render: (p) => <p className="text-base leading-relaxed whitespace-pre-wrap">{p.text}</p>,
  },
  image: {
    type: "image", label: "Image", group: "Dasar",
    defaultProps: { src: "https://placehold.co/800x400?text=Image", alt: "Gambar", rounded: "rounded-md" },
    fields: [
      { key: "src", label: "URL Gambar", kind: "url" },
      { key: "alt", label: "Alt", kind: "text" },
      { key: "rounded", label: "Rounded", kind: "select", options: ["","rounded-md","rounded-lg","rounded-xl","rounded-2xl","rounded-full"].map(v => ({label: v||"none", value: v})) },
    ],
    render: (p) => <img src={p.src} alt={p.alt ?? ""} className={`max-w-full h-auto ${p.rounded ?? ""}`} loading="lazy" />,
  },
  button: {
    type: "button", label: "Button", group: "Dasar",
    defaultProps: { text: "Klik Saya", href: "#", variant: "primary", align: "left" },
    fields: [
      { key: "text", label: "Label", kind: "text" },
      { key: "href", label: "Link (href)", kind: "url" },
      { key: "variant", label: "Style", kind: "select", options: [
        { label: "Primary", value: "primary" },
        { label: "Outline", value: "outline" },
        { label: "Ghost", value: "ghost" },
      ]},
      { key: "align", label: "Rata", kind: "select", options: [
        { label: "Kiri", value: "left" }, { label: "Tengah", value: "center" }, { label: "Kanan", value: "right" },
      ]},
    ],
    render: (p) => {
      const styles: Record<string,string> = {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-border bg-background hover:bg-muted",
        ghost: "hover:bg-muted",
      };
      return (
        <div className={`text-${p.align ?? "left"}`}>
          <a href={p.href ?? "#"} className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${styles[p.variant ?? "primary"]}`}>{p.text}</a>
        </div>
      );
    },
  },
  divider: {
    type: "divider", label: "Divider", group: "Dasar",
    defaultProps: {},
    fields: [],
    render: () => <hr className="my-4 border-border" />,
  },
  spacer: {
    type: "spacer", label: "Spacer", group: "Dasar",
    defaultProps: { height: 48 },
    fields: [{ key: "height", label: "Tinggi (px)", kind: "number", min: 4, max: 400 }],
    render: (p) => <div style={{ height: `${p.height ?? 48}px` }} />,
  },
  video: {
    type: "video", label: "Video Embed", group: "Media",
    defaultProps: { src: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
    fields: [{ key: "src", label: "URL embed", kind: "url" }],
    render: (p) => (
      <div className="aspect-video w-full">
        <iframe src={p.src} className="w-full h-full rounded-md" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    ),
  },
  gallery: {
    type: "gallery", label: "Gallery", group: "Media",
    defaultProps: { urls: "https://placehold.co/400\nhttps://placehold.co/400/222/fff\nhttps://placehold.co/400/eee/222", cols: 3 },
    fields: [
      { key: "urls", label: "URL gambar (satu per baris)", kind: "textarea" },
      { key: "cols", label: "Kolom", kind: "number", min: 1, max: 6 },
    ],
    render: (p) => {
      const list = String(p.urls ?? "").split("\n").map(s => s.trim()).filter(Boolean);
      return (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${p.cols ?? 3}, minmax(0,1fr))` }}>
          {list.map((u, i) => <img key={i} src={u} alt="" className="w-full h-full object-cover rounded-md" loading="lazy" />)}
        </div>
      );
    },
  },
  icon: {
    type: "icon", label: "Icon (emoji)", group: "Media",
    defaultProps: { emoji: "✨", size: 48, align: "left" },
    fields: [
      { key: "emoji", label: "Emoji / Karakter", kind: "text" },
      { key: "size", label: "Ukuran (px)", kind: "number", min: 12, max: 200 },
      { key: "align", label: "Rata", kind: "select", options: [
        { label: "Kiri", value: "left" }, { label: "Tengah", value: "center" }, { label: "Kanan", value: "right" },
      ]},
    ],
    render: (p) => <div className={`text-${p.align ?? "left"}`} style={{ fontSize: `${p.size ?? 48}px`, lineHeight: 1 }}>{p.emoji}</div>,
  },
  rawHtml: {
    type: "rawHtml", label: "Raw HTML", group: "Lanjutan",
    defaultProps: { html: "<p>Raw HTML block</p>" },
    fields: [{ key: "html", label: "HTML", kind: "textarea" }],
    render: (p) => <div dangerouslySetInnerHTML={{ __html: String(p.html ?? "") }} />,
  },
};

export const WIDGET_LIST = Object.values(WIDGETS);
