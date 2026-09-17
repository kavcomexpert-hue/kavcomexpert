# Release Notes — Final Release Preparation

Date: 2026-07-23
Build: Next.js 16.2.11 · production build passes with zero TypeScript and zero ESLint errors/warnings.

---

## Post-release hotfixes (2026-07-24)

- **Slider / video preview clicks restored.** Drag handlers were applying transform/scroll on sub-threshold pointer jitter and could swallow the next click. Threshold raised to 20px; visual drag only starts after the threshold; click-suppression clears on a short timeout.
- **Blog hyperlinks fixed.** TipTap link marks were being saved without `href` (React Flight + mark attrs). New `toPlainTiptapJson` serializer, safer Link extension config (relative paths allowed), RichText fallback when link text is a URL, and a one-time heal of existing content (`scripts/heal-tiptap-links.ts` — already run against the configured DB: 138 posts, 2 pages, 2 case studies).
- **Default theme control** moved to Admin → Settings → **General** (Dark / Light / Match system). Sidebar theme toggle still controls the admin UI for the signed-in user.

## 1. Change list by phase

### Phase 1 — Security patches
- `next` and `eslint-config-next` upgraded 16.2.10 → **16.2.11** (exact pin).
- `postcss` pinned as an explicit devDependency at **^8.5.12** (resolves 8.5.22); npm `overrides` force `next`'s internal `postcss`/`sharp` to patched versions.
- `sharp` verified at **0.35.3** (satisfies ^0.35.0).
- `npm audit`: the `postcss` and `sharp` advisories are resolved. Remaining: 4 **moderate**, dev-only `esbuild` advisories via `drizzle-kit`/`tsx` toolchain (GHSA-67mh-4wv8-2f99, affects local dev servers only, never shipped to production; no non-breaking fix available).

### Phase 2 — Forms builder removed
- `form_submissions` + `forms` data exported to `exports/form-submissions-2026-07-23.json` before removal.
- Deleted: `/admin/forms` pages, forms tables/components, `src/actions/forms.ts`, forms queries, schema tables + types, admin-nav entry.
- Migration **`drizzle/0029_drop_forms.sql`** drops both tables (`IF EXISTS`, safe to re-run). Already applied to the configured Neon database.
- `/contact-us` uses the independent hardcoded contact form (`leads` table, Turnstile + honeypot + time-check) — verified working.

### Phase 3 — Dedup & dead code
Full detail in `CLEANUP-REPORT.md`. Highlights: removed ROI/results remnants, orphaned home sections, unused assets and shims; consolidated editor/date-format helpers into `src/lib/admin/editor-format.ts` and `src/lib/site/format-date.ts`; sitemap no longer emits category/tag query-param URLs; CMS page paths can no longer shadow app-router routes.

### Phase 4 — Slider interaction pass
All 11 live sliders/marquees now support (as applicable): prev/next buttons with disabled states, pointer drag + touch swipe, keyboard arrows when focused, autoplay pause on hover/interaction, reduced-motion compliance. CSS marquees pause on hover and hide duplicate tracks under reduced motion. Visuals unchanged.

### Phase 5 — Defect sweep
- Added missing `audit()` calls to `createCategoryInline` and `reorderServices`.
- Lead notification email now honors `LEAD_NOTIFY_EMAIL` and `RESEND_FROM_EMAIL`.
- **Duplicate-content fix for child services**: flat URLs (e.g. `/services/virtual-assistant`) now 301 to nested paths (`/services/digital-marketing/virtual-assistant`). Root cause was a missing row in the `redirects` table (all 8 siblings had one; `virtual-assistant` did not) — row added. As a safety net the page itself also records a static 308 redirect at build time.
- Cleared legacy hardcoded `canonical_url` values in `services`, `posts`, `pages`, `case_studies` so canonicals derive from `NEXT_PUBLIC_SITE_URL`; static service sync no longer seeds them.
- Defensive-rendering audit of all public components: null/empty CMS data renders empty sections, never throws. One genuine crash class found and fixed: TipTap inline images and `SafeImage` passed CMS-sourced URLs straight to `next/image`, which **throws at render** for hosts outside `remotePatterns` (an editor pasting an external image URL would blank the page). Such URLs are now classified via `src/lib/site/image-src.ts` — allowlisted hosts stay optimized, other http(s) URLs render `unoptimized` (identical markup, no crash), malformed values render nothing.
- Hydration-risk scan: no locale-dependent dates, `Math.random`, or window-branching in server-rendered markup.
- Regression check passed: media upload/webp/thumbnails, cover images, multiple categories, Tiptap links, 2FA, sitemap-on-publish, rate limiter, link-buttons system, hero visual media mode.

### Phase 6 — Performance, accessibility, responsiveness
- Added root `src/app/(site)/loading.tsx` (PageSkeleton, matching nested ones).
- **Lottie hero rework (biggest perf win, zero visual change)**: service pages no longer inline the animation JSON (up to 1.2 MB) into the HTML/RSC payload — `wordpress-development` HTML shrank **830 KB → 200 KB**. A new same-origin proxy (`/api/lottie`, origin-validated against `R2_PUBLIC_URL`) serves the JSON to the client player, which now uses the lighter `lottie_light` build (verified: none of the 11 animations use expressions) and initializes after browser idle so hydration stays responsive.
- Middleware runs its two per-request lookups (redirect rules, maintenance flag) in parallel — cold-window TTFB halved.
- Verified: no `fill` images missing `sizes`, `priority` on hero media, all fonts via `next/font`, no `cookies()`/`headers()` forcing dynamic rendering on public pages, ISR tags on every public query module, dynamic imports for chatbot/popups/cookie-consent/hero visuals.
- A11y verified: one `h1` per page, skip link, focus-visible rings, aria-labels on icon buttons (menu, theme toggle), labeled inputs, reduced-motion everywhere.
- Responsive: rich-text tables wrapped in `overflow-x-auto`; all fixed widths are `max-w-*`; no overflow sources found at 375/768/1024/1440.

### Phase 7 — Final verification
- ESLint: **0 errors, 0 warnings** (fixed: sync setState in effect, JSX inside try/catch, unused vars). `tsc --noEmit` clean.
- Public OG image label now derives from `NEXT_PUBLIC_SITE_URL` instead of hardcoded domain. Remaining literal `kavcomexpert.com` references are intentional: real mailto addresses, env fallbacks, and cosmetic admin placeholder text.
- robots.txt, sitemap.xml, canonicals, and `metadataBase` all derive from `NEXT_PUBLIC_SITE_URL`.

---

## 2. Lighthouse scores (production build, warm cache)

| Page | Mobile: Perf / A11y / BP / SEO | Desktop: Perf / A11y / BP / SEO |
|---|---|---|
| Homepage `/` | 90 / 96 / 100 / 100 | 99 / 96 / 100 / 100 |
| Blog post | 90 / 97 / 100 / 100 | 97 / 97 / 100 / 100 |
| Service page | 90 / 96 / 100 / 100 | 100 / 96 / 100 / 100 |

Notes: measured locally against `npm run start`. Mobile LCP (~3.5 s simulated slow-4G) is dominated by the approved entrance animation and web font; production TTFB behind a real host/CDN will be better than the local laptop→Neon path. Theme toggle is client-side (identical DOM/CSS between themes), so scores apply to both themes; both palettes use the same AA-checked token pairs.

---

## 3. Preflight (`npm run preflight`)

All checks pass except two values that are placeholders in the local `.env.local` and **must be set correctly in production**:

| Variable | Local state | Production requirement |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://kavcomexpert.com` (https, no trailing slash) |
| `BETTER_AUTH_SECRET` | 29 chars | Random secret ≥ 32 chars (`openssl rand -base64 32`) |

Required production env vars (all currently present in the environment file): `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`, `RESEND_API_KEY`. Optional: `RESEND_FROM_EMAIL`, `LEAD_NOTIFY_EMAIL`, `INDEXNOW_KEY`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_CLARITY_ID`, `GOOGLE_SERVICE_ACCOUNT_*`, `CRON_SECRET`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`.

---

## 4. Deploy checklist (hPanel)

1. Set/verify the env vars above — especially `NEXT_PUBLIC_SITE_URL=https://kavcomexpert.com` and a ≥32-char `BETTER_AUTH_SECRET`.
2. Deploy this codebase and run `npm ci && npm run build`.
3. Run the migration: `npm run db:migrate` (applies `0029_drop_forms`; already applied if production uses the same Neon database as this pass).
4. Restart the app (PM2: `pm2 restart ecosystem.config.js`) and hard-refresh the browser (Cmd+Shift+R).
5. Smoke test:
   - `/` homepage renders, sliders drag, theme toggle works
   - `/blog` + one post (tables, links, images)
   - `/services/digital-marketing` and child page `/services/digital-marketing/virtual-assistant`
   - `/services/virtual-assistant` → 301 to the nested path
   - A service page with a Lottie hero (e.g. `/services/wordpress-development`) — animation plays
   - `/contact-us` — submit the form, confirm lead + notification email
   - `/admin/login` — sign in, save one post, confirm sitemap revalidates
   - `/sitemap.xml` and `/robots.txt` show `https://kavcomexpert.com` URLs

## 5. Data changes applied to the database during this pass

- Dropped `forms`, `form_submissions` (after JSON export to `exports/`).
- Cleared legacy `canonical_url` values matching the default pattern (services, 3 posts, 2 pages, 2 case studies).
- Inserted redirect row `/services/virtual-assistant → /services/digital-marketing/virtual-assistant` (301).

---

## 6. Post-release fixes (2026-07-24)

### Editor was silently deleting link URLs on save (root cause of "blog hyperlinks don't work")
The Tiptap editor's document JSON stores link URLs, heading levels, and image sources in `attrs` objects that ProseMirror creates **without an object prototype**. Next.js server actions reject null-prototype objects during serialization, so every save through the admin editor stripped **all** `attrs` from the document — links kept their underline styling in the editor but lost their `href`, which is why the public site rendered them as plain text. Fixed by JSON-cloning the editor output into plain objects before it leaves the editor (`src/components/admin/tiptap-editor.tsx`). This fixes saves for posts, pages, services, and case studies (all share that editor).

**Data note:** content saved through the editor before this fix already lost its URLs and they are not recoverable. Affected rows: post `how-fast-should-a-business-website-load-in-2026` (5 links), pages `privacy-policy` (4 links) and `terms-of-service` (4 links). Re-add those links once in the admin editor — they will now persist. (Imported posts from July 10 are unaffected.)

### Slider cards did not react to clicks (video testimonial previews, gallery lightboxes)
The drag-to-scroll handlers captured the pointer on pointer-down. Pointer capture retargets the subsequent `click` event to the slider track, so buttons inside the cards (video preview, lightbox) never received the click. All five sliders now capture the pointer only after an actual drag is detected (>10 px movement); plain clicks pass through untouched. Files: `video-testimonials-section`, `work-gallery-slider`, `general-gallery-slider`, `about-social-proof`, `service-work-slider`.

### New: default theme option in admin
Settings → Branding → **Default theme** (Dark / Light / Match visitor's system). Controls the theme first-time visitors see; visitors who used the site's theme toggle keep their own choice. Stored in `site_settings.default_theme` (migration `drizzle/0030_default_theme.sql`, already applied to the configured database — run `npm run db:migrate` in production if it uses a different database).
