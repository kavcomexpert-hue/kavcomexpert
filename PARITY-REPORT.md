# Admin ↔ Frontend Parity Report

Generated during the admin restructure. Every row maps a **live frontend section** to its **admin editor field**. Orphan admin blocks (service-style marketing sections on system pages) were removed.

## System pages (Admin → Pages)

| Page | Frontend section | Component / route | Admin location | Field key(s) |
|------|------------------|-------------------|----------------|--------------|
| **Home** | Hero eyebrow, headline (2 lines), subtext, CTAs | `hero-section.tsx` | Pages → Home → Homepage sections | `home.hero.*` content blocks |
| **Home** | About band (eyebrow, headline, body, CTA, 3 rows) | `about-section.tsx` | Pages → Home → Homepage sections | `home.about.*` content blocks |
| **Home** | Logo marquee | `logo-marquee-section.tsx` | — | Static (logos from assets) |
| **Home** | Dev services cards | `dev-services-section.tsx` | Services admin | Published services DB |
| **Home** | Service ticker | `service-ticker.tsx` | — | Static animation |
| **Home** | Growth services cards | `growth-services-section.tsx` | Services admin | Published services DB |
| **Home** | Why us | `why-section.tsx` | — | Static copy |
| **Home** | Benefits | `benefits-section.tsx` | — | Static copy |
| **Home** | Process | `process-section.tsx` | — | Static copy |
| **Home** | Video testimonials | `video-testimonials-section.tsx` | Testimonials admin | DB testimonials |
| **Home** | FAQ | `faq-section.tsx` | — | Static FAQ |
| **Home** | Bottom CTA | `home-cta-section.tsx` | Pages → Home → Homepage sections | `home.cta.*` content blocks |
| **Home** | SEO | `<head>` | Pages → Home → SEO panel | `metaTitle`, `metaDescription`, `focusKeyword`, `ogImage` |
| **About** | Hero | `about-sections.tsx` → AboutHero | Pages → About us → About hero | `about.hero.*` content blocks |
| **About** | Mission / vision / values | `about-sections.tsx` | — | Static |
| **About** | Who we are | `about-sections.tsx` | — | Static |
| **About** | Social proof + videos | `about-social-proof.tsx` | Testimonials admin | DB |
| **About** | Why Kavcom | `about-sections.tsx` | — | Static |
| **About** | FAQ | `faq-section.tsx` | — | Static |
| **About** | Bottom CTA | `home-cta-section.tsx` | — | Uses `home.cta.*` on homepage |
| **About** | SEO | `<head>` | Pages → About us → SEO panel | page SEO fields |
| **Contact** | Hero | `contact-us/page.tsx` | Pages → Contact us → Contact page | `pageSections.hero.*` |
| **Contact** | Form | `contact-form.tsx` | — | Static form (submissions → Leads) |
| **Contact** | Sidebar (title, body, email) | `contact-us/page.tsx` | Pages → Contact us | `sidebarTitle`, `sidebarBody`, `sidebarEmail` |
| **Contact** | Social links | `contact-social-links.tsx` | Settings → General | `socialLinks` |
| **Contact** | FAQ band | `faq-section.tsx` | Pages → Contact us → FAQ section | `faqEyebrow`, `faqHeadline`, `faqDescription`, `faqs[]` |
| **Contact** | SEO | `<head>` | Pages → Contact us → SEO panel | page SEO fields |
| **Work** | Hero | `work-portfolio.tsx` | Pages → Work → Work page hero | `pageSections.hero.*` |
| **Work** | Industry filter + project grid | `work-portfolio.tsx` | Case studies admin | Published case studies |
| **Work** | Bottom CTA | `home-cta-section.tsx` | — | Uses `home.cta.*` |
| **Work** | SEO | `<head>` | Pages → Work → SEO panel | page SEO fields |
| **Careers** | Hero | `careers/page.tsx` | Pages → Careers | `pageSections.hero.*` |
| **Careers** | Open positions heading | `careers/page.tsx` | Pages → Careers | `openingsTitle` |
| **Careers** | Job cards | `career-jobs-grid.tsx` | Careers admin | Published jobs |
| **Careers** | Fallback block | `careers/page.tsx` | Pages → Careers | `fallbackTitle`, `fallbackBody`, `fallbackEmail` |
| **Careers** | SEO | `<head>` | Pages → Careers → SEO panel | page SEO fields |
| **Blog index** | Hero + filters | `blog-hero.tsx` | — | Static layout; posts from Posts admin |
| **Blog index** | Post grid | `blog-cards.tsx` | Posts admin | Published posts |
| **Blog index** | Newsletter | `blog-newsletter-section.tsx` | Pages → Blog → Blog newsletter | `pageSections.newsletter*` |
| **Blog index** | Bottom CTA | `home-cta-section.tsx` | — | Uses `home.cta.*` |
| **Blog index** | SEO | `<head>` | Pages → Blog → SEO panel | page SEO fields |

## Global / Settings (formerly Site content tab)

| Frontend | Admin location | Field key(s) |
|----------|----------------|--------------|
| Footer tagline fallback | Settings → Global content | `global.footer.tagline` |
| 404 headline / body / CTA | Settings → Global content | `global.404.*` |

## Removed (no frontend counterpart)

| Removed item | Notes |
|--------------|-------|
| `/roi-calculator`, `/results` routes | 301 → `/` via redirects seed |
| `RoiCalculatorSection`, loader | Deleted |
| Admin **Content** sidebar tab | Blocks moved to page editors + Settings |
| `blog.newsletter.*` content blocks | Moved to Blog page `pageSections` |
| Service marketing blocks on Work/Contact/etc. page editors | `ServiceSectionsEditor` only for custom marketing pages |
| `startingPrice` on services | Removed from schema, admin, frontend |
| Hardcoded Services / Digital Marketing header dropdowns | Header uses menus table only |

## Services (posts-like)

| Feature | Admin | Frontend |
|---------|-------|----------|
| Slug + uniqueness | Service editor | `/services/{slug}` or `/services/{parent}/{child}` |
| Slug change redirect | Auto 301 when published | Middleware redirects table |
| Parent service | Parent select | Nested URL + breadcrumbs |
| Revisions | Revisions panel | — |
| Schedule / trash | Publish panel | Cron publish sweep |
| SEO | SEO panel | `<head>` + JSON-LD |

## Case studies

| Field | Admin tab | Frontend |
|-------|-----------|----------|
| Client, slug, challenge, solution | Content | `/work/[slug]` |
| Results, timeline, gallery, quote | Results & Media | Case study page + work index cards |
| Featured image | Results & Media (`ogImage`) | Cards, OG fallback |
| SEO | SEO | `<head>` |

## Verification checklist

- [ ] Edit one block on each system page → visible on live site
- [ ] Create child service with custom slug → nested URL works
- [ ] Open work gallery lightbox → arrow keys + Escape
- [ ] `npm run build` passes
