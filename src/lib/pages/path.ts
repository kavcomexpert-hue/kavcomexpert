import { getDb } from "@/lib/db";
import { pages, services } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";

export function normalizePagePath(path: string): string {
  if (!path || path === "/") return "/";
  const cleaned = path
    .split("/")
    .filter(Boolean)
    .join("/");
  return `/${cleaned}`;
}

export function pathFromSegments(segments: string[]): string {
  if (segments.length === 0) return "/";
  return normalizePagePath(`/${segments.join("/")}`);
}

/**
 * Resolve the public path for a page given its slug and optional parents.
 * - home → /
 * - no parent → /{slug}
 * - parent page → {parent.path}/{slug}
 * - parent service → /services/{service.slug}/{slug}
 */
export async function computePagePath(input: {
  slug: string;
  parentId?: string | null;
  parentServiceId?: string | null;
  excludeId?: string;
}): Promise<string> {
  const slug = input.slug.trim();

  if (slug === "home") {
    return "/";
  }

  if (input.parentId && input.parentServiceId) {
    throw new Error("A page can only have one parent (page or service)");
  }

  if (input.parentServiceId) {
    const [service] = await getDb()
      .select({ slug: services.slug })
      .from(services)
      .where(eq(services.id, input.parentServiceId))
      .limit(1);

    if (!service) {
      throw new Error("Parent service not found");
    }

    return normalizePagePath(`/services/${service.slug}/${slug}`);
  }

  if (input.parentId) {
    if (input.excludeId && input.parentId === input.excludeId) {
      throw new Error("A page cannot be its own parent");
    }

    const [parent] = await getDb()
      .select({
        id: pages.id,
        path: pages.path,
        slug: pages.slug,
        parentId: pages.parentId,
      })
      .from(pages)
      .where(eq(pages.id, input.parentId))
      .limit(1);

    if (!parent) {
      throw new Error("Parent page not found");
    }

    if (parent.parentId) {
      // One level of nesting under a page is enough for URL clarity;
      // grandchildren still resolve via the parent's stored path.
    }

    const parentPath =
      parent.path?.trim() ||
      (parent.slug === "home" ? "/" : `/${parent.slug}`);

    if (parentPath === "/") {
      return normalizePagePath(`/${slug}`);
    }

    return normalizePagePath(`${parentPath}/${slug}`);
  }

  return normalizePagePath(`/${slug}`);
}

/**
 * First URL segments owned by dedicated App Router trees. A CMS page nested
 * under these (e.g. /blog/foo) would be claimed by the dynamic route
 * (blog/[slug], work/[slug], careers/[slug]) and never render as a CMS page,
 * while still leaking into the sitemap.
 */
const ROUTE_OWNED_FIRST_SEGMENTS = new Set([
  "blog",
  "work",
  "careers",
  "case-studies",
]);

/** Exact paths that hardcoded redirects (next.config / middleware) own. */
const REDIRECTED_EXACT_PATHS = new Set([
  "/about",
  "/contact",
  "/maintenance",
]);

export async function assertUniquePagePath(
  path: string,
  excludeId?: string,
): Promise<void> {
  const segments = path.split("/").filter(Boolean);
  if (segments.length > 1 && ROUTE_OWNED_FIRST_SEGMENTS.has(segments[0])) {
    throw new Error(
      `Pages cannot be nested under /${segments[0]} — that URL space is owned by the ${segments[0]} section`,
    );
  }

  if (REDIRECTED_EXACT_PATHS.has(path)) {
    throw new Error("That URL path is reserved by a site redirect");
  }

  const [existing] = await getDb()
    .select({ id: pages.id })
    .from(pages)
    .where(
      excludeId
        ? and(eq(pages.path, path), ne(pages.id, excludeId))
        : eq(pages.path, path),
    )
    .limit(1);

  if (existing) {
    throw new Error("That URL path is already in use");
  }
}

/** After a parent slug/path change, refresh descendant paths. */
export async function recomputeChildPaths(parentId: string): Promise<void> {
  const children = await getDb()
    .select({
      id: pages.id,
      slug: pages.slug,
      parentId: pages.parentId,
      parentServiceId: pages.parentServiceId,
    })
    .from(pages)
    .where(eq(pages.parentId, parentId));

  for (const child of children) {
    const path = await computePagePath({
      slug: child.slug,
      parentId: child.parentId,
      parentServiceId: child.parentServiceId,
      excludeId: child.id,
    });
    await getDb()
      .update(pages)
      .set({ path, updatedAt: new Date() })
      .where(eq(pages.id, child.id));
    await recomputeChildPaths(child.id);
  }
}
