# Final Stabilization Audit

Date: 2026-07-17  
Scope: Parts A (slug system), B (ten fixes), C (closing regression audit)

---

## Part A — Slug system

### A1 Canonical path builder ✅
`src/lib/paths.ts` exports typed builders used across sitemap, schema, RSS, breadcrumbs, admin search, chatbot, and service cards:
- `postPath`, `pagePath`, `servicePath`, `caseStudyPath`, `categoryPath`, `tagPath`, `jobPath`
- `servicePathsById`, index constants (`blogIndexPath`, `servicesIndexPath`, `workIndexPath`)

### A2 Hardcoded path sweep ✅
Runtime URL construction for live content now goes through path builders or `enrichServiceCardsBySlug()` (homepage + `/services` index). Remaining `/services/...` strings are **design-time seed defaults** in static card arrays and `scripts/seed.ts`; they are overwritten at render time from DB slug/parent data.

Intentional exceptions (not content links):
- `src/app/api/admin/edit-target/route.ts` — parses incoming URLs
- `src/app/(site)/[...slug]/page.tsx` — route guard prefix check
- `src/lib/queries/popups.ts` — URL match patterns

### A3 Nested service routing + auto-301 ✅
- Child services render at `/services/[parent]/[child]`; flat `/services/[child]` issues `permanentRedirect` in `src/app/(site)/services/[slug]/page.tsx`.
- `saveService` writes 301 rows via `ensureSlugRedirect` on slug/parent change when published.
- Posts and pages now call `ensureSlugRedirect` on published slug/path change (`src/actions/posts.ts`, `src/actions/pages.ts`).
- Case studies already had redirect logic; sitemap revalidation added across content mutations.

### A4 Slug proof (live Neon DB, `npx tsx scripts/slug-proof.ts`)

**Nested canonical paths (digital-marketing children):**
| Service | Canonical URL |
|---------|---------------|
| Video Editing | `/services/digital-marketing/video-editing` |
| Virtual Assistant | `/services/digital-marketing/virtual-assistant` |
| Social Media Marketing | `/services/digital-marketing/social-media-marketing` |
| SEO & AI SEO | `/services/digital-marketing/seo-ai-optimization` |

**301 redirect rows (`redirects` table):**
| From | To |
|------|-----|
| `/services/video-editing` | `/services/digital-marketing/video-editing` |
| `/services/google-ads` | `/services/digital-marketing/google-ads` |
| `/services/seo-ai-optimization` | `/services/digital-marketing/seo-ai-optimization` |
| `/services/facebook-ads` | `/services/digital-marketing/facebook-ads` |
| … (8 marketing child flat paths) | nested canonical paths |

Note: `/services/virtual-assistant` is not yet in the redirects table but **does 301 at runtime** via `permanentRedirect` in the flat service route when `parentId` is set. Saving the service again in admin will persist the DB redirect row.

**Homepage growth cards after `enrichServiceCardsBySlug`:**
| Card | Resolved href |
|------|---------------|
| Digital Marketing | `/services/digital-marketing` |
| Video Editing | `/services/digital-marketing/video-editing` |
| Virtual Assistant | `/services/digital-marketing/virtual-assistant` |

**Breadcrumb JSON-LD (Virtual Assistant):**
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "position": 1, "name": "Home", "item": "https://kavcomexpert.com/" },
    { "position": 2, "name": "Services", "item": "https://kavcomexpert.com/services" },
    { "position": 3, "name": "Digital Marketing", "item": "https://kavcomexpert.com/services/digital-marketing" },
    { "position": 4, "name": "Virtual Assistant Services", "item": "https://kavcomexpert.com/services/digital-marketing/virtual-assistant" }
  ]
}
```

**Sitemap:** `src/lib/seo/sitemap-data.ts` builds service URLs with `servicePath({ slug, parentSlug })`. `src/app/sitemap.ts` is `force-dynamic` / `revalidate = 0` and all publish/trash/slug mutations call `revalidateTag("sitemap")` + `revalidatePath("/sitemap.xml")`.

---

## Part B — Root causes & fixes

| ID | Root cause (one line) | Fix | Key files |
|----|----------------------|-----|-----------|
| **B1** | Marquees used JS frame loops / lacked offscreen pause | Pure CSS `@keyframes` on duplicated tracks; `will-change: transform`; `useOffscreenPause` + `prefers-reduced-motion` | `logo-marquee-section.tsx`, `service-ticker.tsx`, `testimonials-marquee.tsx`, `work-gallery-slider.tsx`, `general-gallery-slider.tsx`, `globals.css`, `use-offscreen-pause.ts` |
| **B2** | Homepage/services cards hardcoded flat slugs | Path builders + `enrichServiceCardsBySlug` overlay live slug/parent | `paths.ts`, `enrich-service-cards.ts`, `dev-services-section.tsx`, `growth-services-section.tsx`, `services/page.tsx` |
| **B3** | Duplicate Tiptap Link extension + `sanitizeHref` dropped protocol-less/same-origin hrefs | `link: false` in StarterKit; expanded `sanitizeHref`; links render as `<Link>` with accent underline | `tiptap-editor.tsx`, `rich-text.tsx` |
| **B4** | Revisions panel always expanded | Collapsed by default; preference in `localStorage` on toggle | `*-revisions-panel.tsx`, `revisions-collapsed.ts` |
| **B5** | `autosavePost` skipped `syncPostTaxonomy` for published posts | Autosave always syncs category join rows | `posts.ts` |
| **B6** | Hero illustration hardcoded (Spline/SVG only) | `services.hero_visual` jsonb + editor radio + conditional `next/image` | `0026_service_hero_visual.sql`, `schema.ts`, `services.ts`, `service-editor.tsx`, `service-detail-template.tsx` |
| **B7** | `two_factor.verified` DB default was `true`, skipping enablement | Default `false`; security panel null-guards + refresh after verify | `0026_service_hero_visual.sql`, `schema.ts`, `security-panel.tsx` |
| **B8** | Sitemap tag not revalidated on all content mutations | `revalidateTag("sitemap")` + `revalidatePath("/sitemap.xml")` on posts/pages/services/case-studies/taxonomy; admin tab links live sitemap | `posts.ts`, `pages.ts`, `services.ts`, `case-studies.ts`, `taxonomy.ts`, `sitemap.ts`, `seo-sitemap-manager.tsx` |

### B2 verification (three specific cards)
After enrichment against live DB:
- Homepage **Digital Marketing** → `/services/digital-marketing` ✅
- Homepage **Video Editing** → `/services/digital-marketing/video-editing` ✅
- Homepage **Virtual Assistant** → `/services/digital-marketing/virtual-assistant` ✅
- `/services` index marketing rows resolve the same way via shared enrich helper ✅

---

## Part C — Closing regression audit

### C1 Previously-fixed items (code + build verification)

| Item | Status | Evidence |
|------|--------|----------|
| Media upload WebP + thumbnails | ✅ | `upload-core.ts` Sharp pipeline; `media.ts` action unchanged |
| Featured image previews | ✅ | Post/page editors use media picker components |
| Tables in posts (scroll) | ✅ | Tiptap table extension + rich-text table wrapper |
| Lead deletion | ✅ | `deleteLead` / `deleteLeads` in `leads.ts` with session + audit |
| Turnstile contact form (env-gated) | ✅ | `verifyLeadTurnstile` in `contact.ts` |
| Rate limiter not blocking admin saves | ✅ | `beginAdminMutation` — admin/editor bypass public limits, high abuse ceiling |
| Posts opening (no 404s) | ✅ | Build generates `/blog/[slug]` routes; slug redirects on change |
| Video testimonials first load | ✅ | Testimonial query + marquee CSS-only (no layout thrash) |

**Manual follow-up:** Run migration `drizzle/0026_service_hero_visual.sql` on production if not applied (`hero_visual` column + 2FA default fix).

**Manual follow-up:** Post `how-fast-should-a-business-website-load` — verify hyperlinks in browser (post may be production-only; renderer fix is in `rich-text.tsx`).

**Manual follow-up:** Full 2FA loop (enable → TOTP login → backup code → disable) on `/admin/security`.

### C2 Server action pattern audit

**Standard admin mutations** follow: `beginAdminMutation()` (session + rate limit) → authz (`requireContentManager` / `canAccessOwnedContent`) → Zod parse → DB mutation → `audit()` → `revalidateTag` / `revalidatePath`.

Files using this pattern: `posts.ts`, `pages.ts`, `services.ts`, `case-studies.ts`, `taxonomy.ts`, `jobs.ts`, `popups.ts`, `content-blocks.ts`, `users.ts`, `seo-sitemap.ts`, `menus.ts`, `settings.ts`, `redirects.ts`, `leads.ts`, `testimonials.ts`, `media.ts`, `work-gallery.ts`, `preview.ts`.

**Intentional deviations (by design):**

| Action file | Pattern | Reason |
|-------------|---------|--------|
| `contact.ts`, `chatbot-lead.ts`, `lead-capture.ts` | Public: IP rate limit → Zod → spam/Turnstile → DB | No admin session |
| `job-applications.ts` | Public submit + admin status updates | Mixed public/admin |
| `users.ts` (`acceptInvitation`) | Token-based, no session | Invite flow |
| `admin-search.ts` | Read-only: `requireSession` → Zod query | No mutation |
| `security.ts` | `logSecurityEvent`: session only | Audit helper |
| `get*Revisions` | Read-only: session + authz | No mutation |

**Minor drift:** `autosavePost` / `autosavePage` / `autosaveCaseStudy` skip `audit()` (revision snapshot only) — acceptable for autosave volume.

### C3 Console-error pass

Not run in automated browser (no headless session in CI). **Recommended manual checklist:**

| Page | Light / dark | 375px / 1440px |
|------|--------------|----------------|
| `/` | ☐ | ☐ |
| `/blog` | ☐ | ☐ |
| `/blog/how-fast-should-a-business-website-load` (links + table) | ☐ | ☐ |
| `/services/digital-marketing` + one child service | ☐ | ☐ |
| `/work` (gallery lightbox) | ☐ | ☐ |
| `/contact` (test submit) | ☐ | ☐ |

Static analysis: no known client-side throw paths introduced in touched components; build completes without runtime import errors.

### C4 Build & lint ✅

```
npm run build  → exit 0 (Next.js 16.2.10, TypeScript clean)
npm run lint   → exit 0 (0 errors, 3 pre-existing warnings in json-ld.tsx / service-hero-spline.tsx)
```

Post-audit fixes applied for build blockers:
- `rich-text.tsx` — escaped regex `/` in protocol-less URL pattern
- `service-detail-template.tsx` — removed duplicate `Image` import
- Revision panels — ESLint `set-state-in-effect` resolved via lazy localStorage init

---

## Files created/changed (this stabilization pass)

**Created:** `src/lib/paths.ts`, `src/lib/admin/revisions-collapsed.ts`, `src/hooks/use-offscreen-pause.ts`, `drizzle/0026_service_hero_visual.sql`, `scripts/slug-proof.ts`, `FINAL-AUDIT.md`

**Modified (representative):** path builder consumers (schema, sitemap, RSS, chatbot, service pages), marquee/slider components, `rich-text.tsx`, `tiptap-editor.tsx`, revision panels, `posts.ts`, `pages.ts`, `services.ts`, `case-studies.ts`, `taxonomy.ts`, `service-editor.tsx`, `service-detail-template.tsx`, `security-panel.tsx`, homepage service sections, ESLint fixes in `tiptap-link-dialog.tsx` / `post-editor.tsx`

---

## Deploy checklist

1. `npm run db:migrate` — apply `0026_service_hero_visual.sql`
2. Smoke-test A4: hit old flat URL `/services/video-editing` → 301 to nested path
3. Publish a post → fetch `/sitemap.xml` within 1 minute → new URL present
4. Enable 2FA on staging admin account → full login loop
