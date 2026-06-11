## Goal
Address the highest-risk findings that are still open in the scanner, instead of leaving them ignored.

## Findings to fix

### 1. Stored XSS on public CMS pages (severity: error)
`custom_pages.content` is editor-writable and rendered with `dangerouslySetInnerHTML` on the public `/p/$slug` route. A compromised or malicious editor can execute scripts in every visitor's browser.

Fix:
- Add `isomorphic-dompurify` (works in browser + SSR worker).
- Sanitize `content` at render time inside `PagePreview` with a strict allowlist (formatting tags, links with `http/https/mailto`, images). Strip `<script>`, `<iframe>`, event handlers, `javascript:` URLs, `style`/`on*` attributes.
- Also sanitize on save in the admin pages editor as defense-in-depth so stored content is clean going forward.

### 2. Raw visitor IP stored and shown in admin (severity: warn, PII/GDPR)
`page_views.ip` keeps the plaintext IP alongside `ip_hash`, and the analytics table renders it.

Fix:
- Stop inserting `ip` in `src/routes/api/public/track.ts` (keep only `ip_hash` + country from CDN header).
- Drop the `ip` column in a migration.
- Remove `ip` from the `getVisitorStats` projection and from the admin analytics table column.

### 3. Admin password reset field uses `type="text"` (severity: warn)
`src/routes/administrator.users.tsx` exposes new passwords on screen and to browser history.

Fix:
- Change both the create-user and reset-password inputs to `type="password"`.
- Add a small show/hide eye toggle so admins can still verify what they typed.

## Out of scope (kept ignored, documented in security memory)
- The 3 `SECURITY DEFINER` linter warnings cover `has_role`, `has_min_role`, and `get_public_chatbot_settings`. The first two are required to avoid RLS recursion; the third is the intentional public surface for chatbot branding. `EXECUTE` is already revoked from `anon`/`public` where appropriate.
- `Extension in public` is a Supabase-managed pgvector install — not actionable from app code.
- Storage `media` SELECT policy is intentionally service-role only (public URLs still work; listing is blocked by design).
- Chatbot in-memory rate limiter — flagged for a follow-up (needs a durable store). Will be left noted, not fixed in this pass unless you want it included.

## Files touched
- `src/routes/administrator.pages.tsx` — sanitize in `PagePreview` + on save
- `src/routes/p.$slug.tsx` — relies on sanitized `PagePreview` (no change needed beyond #1)
- `src/routes/api/public/track.ts` — drop raw IP insert
- `src/lib/analytics.functions.ts` — drop `ip` from select
- `src/routes/administrator.analytics.tsx` — remove IP column
- `src/routes/administrator.users.tsx` — password input type + toggle
- New migration: `ALTER TABLE public.page_views DROP COLUMN ip;`
- `package.json` — add `isomorphic-dompurify`
- Update `@security-memory` and mark the three findings fixed.

Want me to also include a fix for the in-memory chatbot rate limiter (move to a Supabase-backed counter) in this same pass?