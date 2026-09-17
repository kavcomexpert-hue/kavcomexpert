/** System pages managed in CMS (not blocked as reserved). */
export const SYSTEM_PAGE_SLUGS = [
  "home",
  "about-us",
  "contact-us",
  "careers",
  "work",
  "blog",
  "services",
] as const;

/**
 * Slugs that collide with App Router segment roots and must not be used
 * as a CMS page slug (unless nested via parentServiceId / parentId path).
 */
export const RESERVED_PAGE_SLUGS = [
  "admin",
  "api",
  "case-studies",
  "feed.xml",
  "llms.txt",
  "llms-full",
  "og",
  "robots.txt",
  "sitemap.xml",
] as const;

export const FOOTER_LEGAL_PAGE_SLUGS = [
  "privacy-policy",
  "terms-of-service",
] as const;

export function isSystemPageSlug(slug: string): boolean {
  return (SYSTEM_PAGE_SLUGS as readonly string[]).includes(slug);
}

export function isReservedPageSlug(slug: string): boolean {
  if (isSystemPageSlug(slug)) {
    return false;
  }

  if ((RESERVED_PAGE_SLUGS as readonly string[]).includes(slug)) {
    return true;
  }

  if (slug.startsWith("admin") || slug.startsWith("api")) {
    return true;
  }

  return false;
}