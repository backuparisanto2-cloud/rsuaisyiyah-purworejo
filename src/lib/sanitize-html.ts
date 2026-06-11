import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize untrusted HTML before rendering with dangerouslySetInnerHTML.
 * Strict allowlist: formatting tags, safe links/images. Blocks script,
 * iframe, event handlers, javascript: URLs, and inline styles.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "a", "p", "br", "span", "div", "strong", "em", "b", "i", "u", "s",
      "ul", "ol", "li", "blockquote", "code", "pre",
      "h1", "h2", "h3", "h4", "h5", "h6", "hr",
      "img", "figure", "figcaption",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    ALLOWED_ATTR: ["href", "title", "target", "rel", "src", "alt", "class", "colspan", "rowspan"],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|#|\/)/i,
    FORBID_TAGS: ["script", "iframe", "object", "embed", "style", "form", "input", "button"],
    FORBID_ATTR: ["style", "onerror", "onload", "onclick"],
    ALLOW_DATA_ATTR: false,
  });
}
