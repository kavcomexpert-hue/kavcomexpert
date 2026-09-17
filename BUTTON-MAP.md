# BUTTON-MAP

Admin-editable link buttons use `{ label, href, enabled }`. Position and styling stay in code. When `enabled` is false the button is not rendered (removed from the DOM).

## Content blocks (`content_blocks` jsonb)

| Page / surface | Previous label | Previous href | Admin field |
|---|---|---|---|
| Homepage hero — primary | Get in touch | `/contact-us` | `home.hero.cta_primary` |
| Homepage hero — secondary | All services | `/services` | `home.hero.cta_secondary` |
| Homepage about | More about us | `/about-us` | `home.about.cta` |
| Homepage why | How we work | `/about-us` | `home.why.cta` |
| Homepage dev services | View all services | `/services` | `home.dev.cta` |
| Homepage growth services | View all services | `/services/digital-marketing` | `home.growth.cta` |
| Homepage testimonials | View reviews | `/about-us#testimonials` | `home.testimonials.cta` |
| Homepage FAQ contact card | Talk to our team | `/contact-us` | `home.faq.cta` |
| Homepage CTA band (magnetic) | Start your project | `/contact-us` | `home.cta.button` |
| Global CTA band (`CtaBand`) | Book a call | `/contact-us` | `global.cta_band.button` |
| Site header (desktop + mobile) | Book a call | `/contact-us` | `global.header.cta` |
| Site footer connect | Get in touch | `/contact-us#contact-form` | `global.footer.connect_cta` |
| 404 page | Back home | `/` | `global.404.cta` |
| About hero | Work with us | `/contact-us` | `about.hero.cta` |
| About why | Start a project | `/contact-us` | `about.why.cta` |
| Blog post related | View all articles | `/blog` | `blog.post.view_all` |

**Where to edit:** Admin → Pages (home / about-us / blog) content blocks, or Admin → Settings → Global content for `global.*`.

## Service pages (`services.page_sections` jsonb)

| Surface | Previous label | Previous href | Admin field |
|---|---|---|---|
| Service hero — primary | Get in touch | `/contact-us` | `pageSections.heroCtaPrimary` |
| Service hero — secondary | View our work | `#service-work` | `pageSections.heroCtaSecondary` |
| Service why column | Start a project | `/contact-us` | `pageSections.whyCta` |

**Where to edit:** Admin → Services → [service] → Hero & intro / Why us sections.

Defaults match the previous hardcoded values. Android App Development static seed sets `heroCtaSecondary.enabled = false`.

## Shared CTA on multiple routes

`home.cta.button` powers `HomeCtaSection` on homepage and (via server load) about, services index, blog index, work, work detail, and service detail templates.

`global.cta_band.button` powers `CtaBand` on CMS pages with `showCta` and the legacy service fallback layout.

## Intentionally not converted

| Item | Reason |
|---|---|
| Card “Learn more” / service card links | Per-item navigation, not a single CTA slot |
| Menu “View all” megamenu links | Menu system |
| Blog author “About …” | Minor chrome |
| Featured case study “View project” | Dynamic per-slug href |
| Careers mailto fallback | Driven by careers `pageSections.fallbackEmail` |
| Newsletter Subscribe | Form submit, not a link |
| Popup CTAs | Already have `ctaLabel` / `ctaHref` in popup content |
| Social icon links | Not marketing CTAs |

## Helpers

- Type/schema: `src/lib/content/link-button.ts`
- Render: `src/components/site/site-link-button.tsx`
- Admin field: `src/components/admin/link-button-field.tsx`
- Queries: `getLinkButton` / `getLinkButtonMap` in `src/lib/queries/content-blocks.ts`
- Migration: `drizzle/0028_link_buttons.sql` (+ `ensureContentBlocks()` upgrades on admin load)
