import { getDb } from "@/lib/db";
import { landingPages } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

async function fetchPublishedLandingPageBySlug(slug: string) {
  const [page] = await getDb()
    .select()
    .from(landingPages)
    .where(and(eq(landingPages.slug, slug), eq(landingPages.status, "published")))
    .limit(1);

  return page ?? null;
}

export function getPublishedLandingPageBySlug(slug: string) {
  return unstable_cache(
    () => fetchPublishedLandingPageBySlug(slug),
    ["published-landing-page", slug],
    { tags: ["landing-pages"] },
  )();
}

async function fetchPublishedLandingPageByPath(path: string) {
  const normalized =
    path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;

  const [page] = await getDb()
    .select()
    .from(landingPages)
    .where(
      and(eq(landingPages.path, normalized), eq(landingPages.status, "published")),
    )
    .limit(1);

  return page ?? null;
}

export function getPublishedLandingPageByPath(path: string) {
  return unstable_cache(
    () => fetchPublishedLandingPageByPath(path),
    ["published-landing-page-path", path],
    { tags: ["landing-pages"] },
  )();
}

async function fetchPublishedLandingPageSlugs() {
  return getDb()
    .select({
      slug: landingPages.slug,
      path: landingPages.path,
      layoutKind: landingPages.layoutKind,
      updatedAt: landingPages.updatedAt,
      sitemapInclude: landingPages.sitemapInclude,
      sitemapPriority: landingPages.sitemapPriority,
      noIndex: landingPages.noIndex,
      ogImage: landingPages.ogImage,
    })
    .from(landingPages)
    .where(eq(landingPages.status, "published"));
}

export function getPublishedLandingPageSlugs() {
  return unstable_cache(
    async () => {
      try {
        return await fetchPublishedLandingPageSlugs();
      } catch (error) {
        console.warn(
          "[landing-pages] slug list fetch failed; returning empty.",
          error,
        );
        return [];
      }
    },
    ["published-landing-page-slugs"],
    {
      tags: ["landing-pages"],
    },
  )();
}
