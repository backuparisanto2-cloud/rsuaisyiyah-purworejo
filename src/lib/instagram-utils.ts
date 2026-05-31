// Extract Instagram shortcode from a raw URL or an embed <blockquote> snippet
export function extractShortcode(input: string): string | null {
  if (!input) return null;
  const m = input.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

export function buildPermalink(shortcode: string) {
  return `https://www.instagram.com/p/${shortcode}/`;
}

// Public Instagram media thumbnail endpoint. Redirects to a CDN image.
// Proxied through our /api/public/ig-image to bypass CORS / referer checks.
export function buildThumbnail(shortcode: string) {
  const raw = `https://www.instagram.com/p/${shortcode}/media/?size=l`;
  return `/api/public/ig-image?u=${encodeURIComponent(raw)}`;
}
