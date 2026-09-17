/**
 * Canonical internal path builders — the single source of truth for every
 * public URL on the site. Components, sitemap, schema, RSS, breadcrumbs,
 * menu resolvers, and metadata must build content URLs through these helpers
 * so admin slug/parent changes propagate everywhere automatically.
 */

export type ServicePathInput = {
  slug: string;
  /** Slug of the parent service when the service is nested. */
  parentSlug?: string | null;
};

/** Blog post: /blog/{slug} */
export function postPath(slug: string): string {
  return `/blog/${slug}`;
}

export const blogIndexPath = "/blog";
export const servicesIndexPath = "/services";
export const workIndexPath = "/work";

/**
 * CMS page: accepts either a stored hierarchical path ("/about/team") or a
 * bare slug. "home" (or "/") resolves to the site root.
 */
export function pagePath(slugOrPath: string): string {
  const value = slugOrPath.trim();
  if (!value || value === "home" || value === "/") return "/";
  return value.startsWith("/") ? value : `/${value}`;
}

/**
 * Service: /services/{slug} for top-level, /services/{parent}/{slug} when the
 * service has a parent relation.
 */
export function servicePath(service: ServicePathInput): string {
  return service.parentSlug
    ? `/services/${service.parentSlug}/${service.slug}`
    : `/services/${service.slug}`;
}

/**
 * Resolve nested service paths for a full service list (rows carrying
 * id/slug/parentId). Returns a map of service id → canonical path.
 */
export function servicePathsById<
  T extends { id: string; slug: string; parentId?: string | null },
>(rows: readonly T[]): Map<string, string> {
  const slugById = new Map(rows.map((row) => [row.id, row.slug]));
  const paths = new Map<string, string>();
  for (const row of rows) {
    const parentSlug = row.parentId ? slugById.get(row.parentId) ?? null : null;
    paths.set(row.id, servicePath({ slug: row.slug, parentSlug }));
  }
  return paths;
}

/** Case study: /work/{slug} (legacy /case-studies/* 301s in middleware). */
export function caseStudyPath(slug: string): string {
  return `/work/${slug}`;
}

/** Blog category filter: /blog?category={slug} */
export function categoryPath(slug: string): string {
  return `/blog?category=${encodeURIComponent(slug)}`;
}

/** Blog tag filter: /blog?tag={slug} */
export function tagPath(slug: string): string {
  return `/blog?tag=${encodeURIComponent(slug)}`;
}

/** Careers job posting: /careers/{slug} */
export function jobPath(slug: string): string {
  return `/careers/${slug}`;
}
