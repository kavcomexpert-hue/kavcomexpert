import { getDb } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { FOOTER_LEGAL_PAGE_SLUGS } from "@/lib/pages/constants";
import { pathFromSegments } from "@/lib/pages/path";
import { publishDueScheduledPages } from "@/lib/pages/publish-scheduled";
import { and, eq, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";

async function fetchPublishedPageBySlug(slug: string) {
  try {
    await publishDueScheduledPages({ revalidate: false });
  } catch (error) {
    console.warn("[pages] scheduled publish sweep failed; continuing.", error);
  }

  const [page] = await getDb()
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.status, "published")))
    .limit(1);

  return page ?? null;
}

export function getPublishedPageBySlug(slug: string) {
  return unstable_cache(
    () => fetchPublishedPageBySlug(slug),
    ["published-page", slug],
    { tags: ["pages"] },
  )();
}

async function fetchPublishedPageByPath(path: string) {
  try {
    await publishDueScheduledPages({ revalidate: false });
  } catch (error) {
    console.warn("[pages] scheduled publish sweep failed; continuing.", error);
  }

  const normalized = path === "/" ? "/" : pathFromSegments(path.split("/").filter(Boolean));

  const [page] = await getDb()
    .select()
    .from(pages)
    .where(and(eq(pages.path, normalized), eq(pages.status, "published")))
    .limit(1);

  return page ?? null;
}

export function getPublishedPageByPath(path: string) {
  return unstable_cache(
    () => fetchPublishedPageByPath(path),
    ["published-page-path", path],
    { tags: ["pages"] },
  )();
}

async function fetchPublishedPageSlugs() {
  return getDb()
    .select({
      slug: pages.slug,
      path: pages.path,
    })
    .from(pages)
    .where(eq(pages.status, "published"));
}

export function getPublishedPageSlugs() {
  return unstable_cache(
    async () => {
      try {
        return await fetchPublishedPageSlugs();
      } catch (error) {
        console.warn("[pages] slug list fetch failed; returning empty.", error);
        return [];
      }
    },
    ["published-page-slugs"],
    {
      tags: ["pages"],
    },
  )();
}

async function fetchSitemapPages() {
  return getDb()
    .select({
      slug: pages.slug,
      path: pages.path,
      updatedAt: pages.updatedAt,
    })
    .from(pages)
    .where(and(eq(pages.status, "published"), eq(pages.noIndex, false)));
}

export function getSitemapPages() {
  return unstable_cache(fetchSitemapPages, ["sitemap-pages"], {
    tags: ["pages"],
  })();
}

async function fetchFooterLegalPages() {
  return getDb()
    .select({
      slug: pages.slug,
      title: pages.title,
      path: pages.path,
    })
    .from(pages)
    .where(
      and(
        eq(pages.status, "published"),
        inArray(pages.slug, [...FOOTER_LEGAL_PAGE_SLUGS]),
      ),
    );
}

export function getFooterLegalPages() {
  return unstable_cache(fetchFooterLegalPages, ["footer-legal-pages"], {
    tags: ["pages"],
  })();
}
