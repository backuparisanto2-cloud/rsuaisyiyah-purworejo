import { nanoid } from "nanoid";
import { WIDGETS, type EditorNode, type NodeType } from "./registry";

const escapeHtml = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const attr = (o: Record<string, any>) =>
  Object.entries(o)
    .map(([k, v]) => `data-prop-${k}="${escapeHtml(JSON.stringify(v))}"`)
    .join(" ");

/** Serialize the editor tree to portable HTML. Each node is wrapped in a
 *  `<div data-widget="...">` so parseHtml can round-trip losslessly. */
export function serializeTree(nodes: EditorNode[]): string {
  const one = (n: EditorNode): string => {
    const childrenHtml = (n.children ?? []).map(one).join("");
    return `<div data-widget="${n.type}" data-id="${n.id}" ${attr(n.props)}>${childrenHtml}</div>`;
  };
  return nodes.map(one).join("\n");
}

/** Attempt to parse HTML back into an editor tree. Any element that lacks a
 *  `data-widget` marker becomes a single `rawHtml` node containing its outer
 *  HTML. */
export function parseHtml(html: string): EditorNode[] {
  if (typeof window === "undefined") return [];
  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
  const root = doc.getElementById("root");
  if (!root) return [];

  const readNode = (el: Element): EditorNode | null => {
    const type = el.getAttribute("data-widget") as NodeType | null;
    if (!type || !WIDGETS[type]) return null;
    const props: Record<string, any> = {};
    for (const a of Array.from(el.attributes)) {
      if (a.name.startsWith("data-prop-")) {
        const key = a.name.slice("data-prop-".length);
        try { props[key] = JSON.parse(a.value); } catch { props[key] = a.value; }
      }
    }
    const def = WIDGETS[type];
    const kids: EditorNode[] = [];
    for (const child of Array.from(el.children)) {
      const parsed = readNode(child);
      if (parsed) kids.push(parsed);
    }
    return {
      id: el.getAttribute("data-id") || nanoid(6),
      type,
      props: { ...def.defaultProps, ...props },
      children: def.isContainer ? kids : undefined,
    };
  };

  const out: EditorNode[] = [];
  for (const el of Array.from(root.children)) {
    const parsed = readNode(el);
    if (parsed) out.push(parsed);
    else {
      // fallback: wrap unknown content as rawHtml
      out.push({
        id: nanoid(6),
        type: "rawHtml",
        props: { html: (el as HTMLElement).outerHTML },
      });
    }
  }
  return out;
}

/** Deep clone with fresh IDs (for copy/paste/duplicate). */
export function cloneWithIds(node: EditorNode): EditorNode {
  return {
    id: nanoid(6),
    type: node.type,
    props: { ...node.props },
    children: node.children?.map(cloneWithIds),
  };
}
