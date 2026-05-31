// Robust Instagram URL / embed parser.
// Supports:
//   https://www.instagram.com/p/SHORTCODE/
//   https://www.instagram.com/reel/SHORTCODE/
//   https://www.instagram.com/tv/SHORTCODE/
//   https://www.instagram.com/username/p/SHORTCODE/
//   https://www.instagram.com/username/reel/SHORTCODE/
//   Full <blockquote class="instagram-media" data-instgrm-permalink="..."> embed
//   URLs with ?igsh=..., ?utm_source=..., trailing slashes, etc.
export function extractShortcode(input: string): string | null {
  if (!input) return null;
  const text = input.trim();

  // Try data-instgrm-permalink first (official embed)
  const permalinkAttr = text.match(/data-instgrm-permalink=["']([^"']+)["']/i);
  const candidates: string[] = [];
  if (permalinkAttr) candidates.push(permalinkAttr[1]);
  candidates.push(text);

  for (const c of candidates) {
    // Matches /p/, /reel/, /reels/, /tv/ optionally preceded by /username/
    const m = c.match(
      /instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i,
    );
    if (m) return m[1];
  }
  return null;
}

export function isValidShortcode(sc: string | null | undefined): sc is string {
  return !!sc && /^[A-Za-z0-9_-]{5,20}$/.test(sc);
}

export function buildPermalink(shortcode: string) {
  return `https://www.instagram.com/p/${shortcode}/`;
}

// Proxied thumbnail (bypasses CORS / referer).
export function buildThumbnail(shortcode: string) {
  const raw = `https://www.instagram.com/p/${shortcode}/media/?size=l`;
  return `/api/public/ig-image?u=${encodeURIComponent(raw)}`;
}

// Normalize caption: strip HTML, collapse whitespace, trim, cap length.
export function normalizeCaption(input: string, maxLen = 500): string {
  if (!input) return "";
  const noTags = input.replace(/<[^>]+>/g, " ");
  const decoded = noTags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
  const collapsed = decoded.replace(/\s+/g, " ").trim();
  return collapsed.length > maxLen ? collapsed.slice(0, maxLen - 1) + "…" : collapsed;
}

// Try to pull a caption out of a pasted embed snippet (best-effort fallback).
export function extractCaptionFromEmbed(input: string): string {
  if (!input) return "";
  // Official embed wraps caption in <p ...> ... </p> inside the blockquote
  const p = input.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (p) return normalizeCaption(p[1]);
  return "";
}

// Generate the official Instagram desktop embed code for a given URL/shortcode.
// Output matches Instagram's "Embed" dialog so it can be dropped anywhere
// instgrm.Embeds.process() is available.
export function buildEmbedCode(shortcode: string, captionText = ""): string {
  const permalink = buildPermalink(shortcode);
  const safeCaption = captionText
    ? `<p style="color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; line-height:17px; margin-bottom:0; margin-top:8px; overflow:hidden; padding:8px 0 7px; text-align:center; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(
        captionText,
      )}</p>`
    : "";
  return `<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="${permalink}?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><div style="padding:16px;"> <a href="${permalink}?utm_source=ig_embed&amp;utm_campaign=loading" style=" background:#FFFFFF; line-height:0; padding:0 0; text-align:center; text-decoration:none; width:100%;" target="_blank" rel="noopener noreferrer">View this post on Instagram</a>${safeCaption}</div></blockquote>
<script async src="//www.instagram.com/embed.js"></script>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
