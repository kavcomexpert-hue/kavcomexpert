# Cleanup Report — Final Release Pass (2026-07-23)

Every deletion and consolidation performed in Phases 2–3 of the release pass.
All changes verified with a passing `npm run build` (zero TS/ESLint errors, 231 static pages generated).

## 1. Forms builder removal (Phase 2)

Precheck confirmed the public site never used the Forms system: `/contact-us` renders the
hardcoded `ContactForm` → `submitContactForm` → `leads` table (Turnstile + honeypot +
time-check intact). No `DynamicForm` component existed; the builder was admin-only CRUD.

Data safety: `exports/form-submissions-2026-07-23.json` written before dropping. The
`forms` / `form_submissions` tables had never been created on the connected database
(migration 0027 was unapplied), so the export contains 0 forms / 0 submissions.

### Deleted files
- `src/app/(admin)/admin/forms/page.tsx`
- `src/app/(admin)/admin/forms/new/page.tsx`
- `src/app/(admin)/admin/forms/[id]/page.tsx`
- `src/app/(admin)/admin/forms/[id]/submissions/page.tsx`
- `src/components/admin/forms-table.tsx`
- `src/components/admin/form-editor.tsx`
- `src/components/admin/form-submissions-table.tsx`
- `src/actions/forms.ts`
- `src/lib/queries/admin-forms.ts`

### Edited
- `src/lib/db/schema.ts` — removed `forms`, `formSubmissions` tables, `FormField`/`FormFieldType` types, and both relations
- `src/components/admin/admin-nav.ts` — removed the "Forms" sidebar entry

### Database
- New migration `drizzle/0029_drop_forms.sql` (`DROP TABLE IF EXISTS form_submissions; DROP TABLE IF EXISTS forms;`) + journal entry. Applied; migration tracking is now consistent through 0029 (0027/0028 were unrecorded and were applied in the same run — 0028's content-block updates are guarded and idempotent).

### Kept intentionally
- `src/lib/security/form-spam.ts`, `src/components/site/form-spam-fields.tsx` — shared spam protection used by contact/careers/popups
- `src/lib/admin/content-export.ts` "forms" export key — it exports `leads`, not the builder tables

## 2. Dead code deleted (Phase 3a)

All verified zero-reference (imports, `next/dynamic` string paths, scripts, config) before deletion.

### Orphaned site components (never mounted)
- `src/components/site/home/testimonials-marquee.tsx` + `testimonials-marquee-loader.tsx`
- `src/components/site/home/proof-section.tsx`
- `src/components/site/home/about-kavcom-section.tsx` (superseded by live `about-section.tsx`)
- `src/components/site/home/why-kavcom-section.tsx` (superseded by live `why-section.tsx`)
- `src/components/site/home/blog-preview-section.tsx`
- `src/components/site/home/services-grid.tsx`
- `src/components/site/home/trust-strip.tsx`
- `src/components/site/home/work-section.tsx`
- `src/components/site/home/featured-case-study-loader.tsx` + `featured-case-study-section.tsx`
- `src/components/site/home/growth-ledger-loader.tsx` + `growth-ledger.tsx`
- `src/components/site/home/motion/growth-scene.tsx`
- `src/components/site/home/motion/service-icons.tsx`
- `src/components/site/hubspot-meetings-embed.tsx`
- `src/components/site/lead/currency-count-up.tsx` (ROI remnant; removed the empty `lead/` dir)
- `src/components/site/post-author-card.tsx`
- `src/components/site/service-icon.tsx`
- `src/components/site/tiptap-content.tsx` (dead re-export; the `.tiptap-content` CSS class remains in use)

### Orphaned admin components
- `src/components/admin/categories-manager.tsx` (replaced by `taxonomy-manager.tsx`)
- `src/components/admin/tags-manager.tsx` (same; `/admin/tags` remains as a redirect stub to `/admin/taxonomy`)

### Unused lib modules
- `src/lib/roi/calculate.ts` (ROI remnant; removed the empty `roi/` dir)
- `src/lib/schema/reviews.ts` (aggregate-rating schema helpers, never imported)
- `src/lib/site/service-icons.ts` (duplicate icon map, never imported)
- `src/lib/site/youtube-embed.ts` (deprecated shim; its two live importers — `video-testimonials-section.tsx`, `about-social-proof.tsx` — migrated to `@/lib/site/video-embed`)

### Unused server actions
- `deletePost` / `deletePage` / `deleteService` / `deleteCaseStudy` — deprecated aliases for the trash actions, zero callers
- `uploadMedia` in `src/actions/media.ts` — superseded by `POST /api/admin/upload` (which all UI uses)

### ROI/results remnants
- Removed empty route dirs `src/app/(site)/results/` and `src/app/(site)/roi-calculator/`
- `src/actions/lead-capture.ts` — removed `"roi-calculator"` from the allowed lead sources
- Kept: `/results` and `/roi-calculator` permanent redirects (`sync-system-redirects.ts`) and their sitemap exclusion — intentional for old-URL SEO

### Empty admin route dirs
- `src/app/(admin)/admin/forms/` (post-removal), `src/app/(admin)/admin/content/`

### Unused public assets
- `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg` (Next.js starter leftovers)
- `public/logos/wordmark-white.svg` (not referenced by `logos.ts` or anything else)
- `public/blog-media/**` and `public/media/**` intentionally untouched — referenced from database content, not code

### Dependencies / env
- npm dependencies: none unused (all verified)
- Env template mismatches noted for release notes: `LEAD_NOTIFY_EMAIL` is listed in `.env.production.example`/preflight — now actually read by lead notifications (fixed in Phase 5); `PREVIEW_SECRET` is used in code but missing from the example

## 3. Consolidations (Phase 3a)

Output-identical refactors only:

- **New `src/lib/admin/editor-format.ts`** — `toSlug`, `toDatetimeLocalValue`, `fromDatetimeLocalValue`, `formatSavedAt` were copy-pasted in all four content editors. `post-editor.tsx`, `page-editor.tsx`, `case-study-editor.tsx`, `service-editor.tsx` now import the shared helpers (and drop their direct `slugify` imports).
- **New `src/lib/site/format-date.ts`** — identical `formatDate` helpers (same Intl options) in `blog-cards.tsx` and `post-sidebar.tsx` consolidated into `formatShortDate`.

### Considered and deliberately deferred
- `work-gallery-slider.tsx` vs `general-gallery-slider.tsx` — share the carousel pattern but diverge on breakpoints (3-up vs 1–5-up), video-slide support, and section chrome (~34% line overlap). Merging would risk visual regressions on the frozen UI for little weight saving.
- The four `*-revisions-panel.tsx` admin components are near-clones; a generic panel is a worthwhile post-release refactor but touches four working admin flows — too risky for a release pass.

## 4. SEO duplication fixes (Phase 3b)

- **Sitemap no longer emits `/blog?category=…` and `/blog?tag=…`** (`src/lib/seo/sitemap-data.ts`, both the public sitemap and the admin SEO rows). Those filtered views declare `canonical: /blog` (blog `generateMetadata` ignores search params), so listing them was a sitemap/canonical conflict — and `?tag=` isn't even read by the blog index. In-page category filter links are unaffected.
- **CMS pages can no longer claim route-owned URL space** (`src/lib/pages/path.ts`): page paths nested under `/blog/`, `/work/`, `/careers/`, `/case-studies/` are rejected at save time (those URLs are claimed by the dynamic routes and would 404/mismatch while leaking into the sitemap), as are the redirect-owned exact paths `/about`, `/contact`, `/maintenance`. Verified no existing rows violate the rule.
- **Verified clean** (no changes needed):
  - Route overlap: static segments always win over the `[...slug]` catch-all; the catch-all's `generateStaticParams` skips `/services/*`; nested child services 301 from their flat URL; `/case-studies/*` 301s to `/work/*` in middleware + page stubs.
  - Canonicals: every content-rendering public page sets exactly one `alternates.canonical` via `buildContentMetadata`/`systemPageMetadata` and the `lib/paths.ts` builders.
  - Sitemap dedupe: `upsertEntry` keys by normalized path — a static route and a CMS row for the same URL merge into one entry.
  - Trailing slash: Next default (no trailing slash), no conflicting middleware; sitemap normalizes trailing slashes.

## 5. Verification

- `npm run build` after each stage: zero TypeScript errors, zero ESLint errors, 231 static pages.
- No existing DB rows conflicted with the new page-path guard.
- Contact form flow untouched and re-verified (renders 200; submits to `leads`).
