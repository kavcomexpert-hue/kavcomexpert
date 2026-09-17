import { getDb } from "@/lib/db";
import {
  caseStudies,
  jobs,
  landingPages,
  pages,
  posts,
  services,
} from "@/lib/db/schema";
import {
  caseStudyPath,
  jobPath,
  pagePath,
  postPath,
  servicePath,
} from "@/lib/paths";
import { getSiteSettings } from "@/lib/queries/site-settings";
import { getStaticSitemapRoutes } from "@/lib/static-meta";
import {
  isVideoUrl,
  parseGallery,
} from "@/lib/site/content-parsers";
import { resolveImageUrl } from "@/lib/seo/constants";
import { and, eq } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";

export type SitemapEntry = {
  path: string;
  lastModified?: Date;
  priority: number;
  images?: string[];
  videos?: MetadataRoute.Sitemap[number]["videos"];
};

export type SitemapContentSource =
  | "static"
  | "post"
  | "page"
  | "landing-page"
  | "service"
  | "case-study"
  | "job"
  | "category"
  | "tag";
export type SitemapAdminRow = {
  path: string;
  source: SitemapContentSource;
  entityId: string | null;
  priority: number;
  included: boolean;
  lastModified: Date | null;
  noIndex: boolean;
};

const DEPRECATED_STATIC_PATHS = new Set(["/results", "/roi-calculator"]);

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "/";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const queryIndex = withSlash.indexOf("?");
  const pathname =
    queryIndex >= 0 ? withSlash.slice(0, queryIndex) : withSlash;
  const query = queryIndex >= 0 ? withSlash.slice(queryIndex) : "";
  let normalizedPathname = pathname;
  if (normalizedPathname.length > 1 && normalizedPathname.endsWith("/")) {
    normalizedPathname = normalizedPathname.slice(0, -1);
  }
  return `${normalizedPathname}${query}`;
}

function pathKey(path: string): string {
  return normalizePath(path);
}

function isExcluded(path: string, excluded: string[]): boolean {
  const normalized = pathKey(path);
  return excluded.some((entry) => pathKey(entry) === normalized);
}

function isDeprecatedPath(path: string): boolean {
  return DEPRECATED_STATIC_PATHS.has(pathKey(path).split("?")[0] ?? path);
}

function priorityFromDb(value: string | number | null | undefined, fallback: number) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(1, Math.max(0, parsed));
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const resolved = resolveImageUrl(value);
    if (!resolved || seen.has(resolved)) continue;
    seen.add(resolved);
    result.push(resolved);
  }

  return result;
}

function galleryImages(gallery: unknown): string[] {
  return parseGallery(gallery)
    .filter((item) => item.kind === "image")
    .map((item) => resolveImageUrl(item.url))
    .filter((url): url is string => Boolean(url));
}

function galleryVideos(
  gallery: unknown,
  title: string,
  description?: string | null,
  thumbnail?: string | null,
): MetadataRoute.Sitemap[number]["videos"] {
  const items = parseGallery(gallery).filter((item) => item.kind === "video");
  const fallbackThumb = resolveImageUrl(thumbnail);
  if (items.length === 0 || !fallbackThumb) return undefined;

  const videos = items.flatMap((item) => {
    if (!isVideoUrl(item.url)) return [];

    const contentLoc = item.url.startsWith("http")
      ? item.url
      : resolveImageUrl(item.url);

    if (!contentLoc) return [];

    return [
      {
        title: item.alt.trim() || title,
        description: description?.trim() || item.alt.trim() || title,
        content_loc: contentLoc,
        thumbnail_loc: fallbackThumb,
      },
    ];
  });

  return videos.length > 0 ? videos : undefined;
}

function clientQuoteVideo(
  clientQuote: unknown,
  title: string,
  thumbnail?: string | null,
): MetadataRoute.Sitemap[number]["videos"] {
  const fallbackThumb = resolveImageUrl(thumbnail);
  if (
    !clientQuote ||
    typeof clientQuote !== "object" ||
    !("videoUrl" in clientQuote) ||
    typeof clientQuote.videoUrl !== "string" ||
    !clientQuote.videoUrl.trim() ||
    !fallbackThumb
  ) {
    return undefined;
  }

  const videoUrl = clientQuote.videoUrl.trim();
  if (!isVideoUrl(videoUrl)) return undefined;

  const contentLoc = videoUrl.startsWith("http")
    ? videoUrl
    : resolveImageUrl(videoUrl);

  if (!contentLoc) return undefined;

  return [
    {
      title,
      description: title,
      content_loc: contentLoc,
      thumbnail_loc: fallbackThumb,
    },
  ];
}

function mergeVideos(
  ...groups: Array<MetadataRoute.Sitemap[number]["videos"] | undefined>
): MetadataRoute.Sitemap[number]["videos"] {
  const merged = groups.flatMap((group) => group ?? []);
  return merged.length > 0 ? merged : undefined;
}

function upsertEntry(
  map: Map<string, SitemapEntry>,
  entry: SitemapEntry,
) {
  const key = pathKey(entry.path);
  const existing = map.get(key);

  if (!existing) {
    map.set(key, entry);
    return;
  }

  map.set(key, {
    path: existing.path,
    lastModified:
      existing.lastModified && entry.lastModified
        ? existing.lastModified > entry.lastModified
          ? existing.lastModified
          : entry.lastModified
        : (existing.lastModified ?? entry.lastModified),
    priority: Math.max(existing.priority, entry.priority),
    images: uniqueStrings([...(existing.images ?? []), ...(entry.images ?? [])]),
    videos: mergeVideos(existing.videos, entry.videos),
  });
}

async function fetchSitemapEntries(): Promise<SitemapEntry[]> {
  const settings = await getSiteSettings();
  const excluded = settings.sitemapExcludedPaths.map(normalizePath);

  const [postRows, serviceRows, caseStudyRows, pageRows, jobRows, landingRows] =
    await Promise.all([
    getDb()
      .select({
        slug: posts.slug,
        updatedAt: posts.updatedAt,
        sitemapInclude: posts.sitemapInclude,
        sitemapPriority: posts.sitemapPriority,
        coverImage: posts.coverImage,
        ogImage: posts.ogImage,
      })
      .from(posts)
      .where(and(eq(posts.status, "published"), eq(posts.noIndex, false))),
    getDb()
      .select({
        id: services.id,
        slug: services.slug,
        name: services.name,
        parentId: services.parentId,
        updatedAt: services.updatedAt,
        sitemapInclude: services.sitemapInclude,
        sitemapPriority: services.sitemapPriority,
        ogImage: services.ogImage,
        metaDescription: services.metaDescription,
      })
      .from(services)
      .where(
        and(eq(services.status, "published"), eq(services.noIndex, false)),
      ),
    getDb()
      .select({
        slug: caseStudies.slug,
        client: caseStudies.client,
        updatedAt: caseStudies.updatedAt,
        sitemapInclude: caseStudies.sitemapInclude,
        sitemapPriority: caseStudies.sitemapPriority,
        ogImage: caseStudies.ogImage,
        gallery: caseStudies.gallery,
        clientQuote: caseStudies.clientQuote,
        metaDescription: caseStudies.metaDescription,
      })
      .from(caseStudies)
      .where(
        and(
          eq(caseStudies.status, "published"),
          eq(caseStudies.noIndex, false),
        ),
      ),
    getDb()
      .select({
        slug: pages.slug,
        path: pages.path,
        title: pages.title,
        updatedAt: pages.updatedAt,
        sitemapInclude: pages.sitemapInclude,
        sitemapPriority: pages.sitemapPriority,
        ogImage: pages.ogImage,
      })
      .from(pages)
      .where(and(eq(pages.status, "published"), eq(pages.noIndex, false))),
    getDb()
      .select({
        slug: jobs.slug,
        updatedAt: jobs.updatedAt,
      })
      .from(jobs)
      .where(eq(jobs.status, "published")),
    getDb()
      .select({
        slug: landingPages.slug,
        path: landingPages.path,
        updatedAt: landingPages.updatedAt,
        sitemapInclude: landingPages.sitemapInclude,
        sitemapPriority: landingPages.sitemapPriority,
        ogImage: landingPages.ogImage,
      })
      .from(landingPages)
      .where(
        and(eq(landingPages.status, "published"), eq(landingPages.noIndex, false)),
      ),
  ]);
  const parentSlugById = new Map<string, string>();
  for (const row of serviceRows) {
    if (!row.parentId) {
      parentSlugById.set(row.id, row.slug);
    }
  }

  const entryMap = new Map<string, SitemapEntry>();

  for (const row of getStaticSitemapRoutes()) {
    if (isExcluded(row.path, excluded) || isDeprecatedPath(row.path)) continue;
    upsertEntry(entryMap, {
      path: row.path,
      priority: row.priority,
    });
  }

  for (const row of serviceRows) {
    if (row.sitemapInclude === false) continue;

    const path = servicePath({
      slug: row.slug,
      parentSlug: row.parentId ? parentSlugById.get(row.parentId) ?? null : null,
    });

    if (isExcluded(path, excluded) || isDeprecatedPath(path)) continue;

    upsertEntry(entryMap, {
      path,
      lastModified: row.updatedAt ?? undefined,
      priority: priorityFromDb(row.sitemapPriority, 0.7),
      images: uniqueStrings([row.ogImage]),
    });
  }

  for (const row of caseStudyRows) {
    if (row.sitemapInclude === false) continue;

    const path = caseStudyPath(row.slug);
    if (isExcluded(path, excluded) || isDeprecatedPath(path)) continue;

    upsertEntry(entryMap, {
      path,
      lastModified: row.updatedAt ?? undefined,
      priority: priorityFromDb(row.sitemapPriority, 0.7),
      images: uniqueStrings([row.ogImage, ...galleryImages(row.gallery)]),
      videos: mergeVideos(
        galleryVideos(
          row.gallery,
          row.client,
          row.metaDescription,
          row.ogImage,
        ),
        clientQuoteVideo(row.clientQuote, row.client, row.ogImage),
      ),
    });
  }

  for (const row of postRows) {
    if (row.sitemapInclude === false) continue;

    const path = postPath(row.slug);
    if (isExcluded(path, excluded) || isDeprecatedPath(path)) continue;

    upsertEntry(entryMap, {
      path,
      lastModified: row.updatedAt ?? undefined,
      priority: priorityFromDb(row.sitemapPriority, 0.7),
      images: uniqueStrings([row.coverImage, row.ogImage]),
    });
  }

  for (const row of jobRows) {
    const path = jobPath(row.slug);
    if (isExcluded(path, excluded) || isDeprecatedPath(path)) continue;

    upsertEntry(entryMap, {
      path,
      lastModified: row.updatedAt ?? undefined,
      priority: 0.6,
    });
  }

  for (const row of pageRows) {
    if (row.sitemapInclude === false) continue;

    const path = row.path ? pagePath(row.path) : pagePath(row.slug);
    if (isExcluded(path, excluded) || isDeprecatedPath(path)) continue;

    upsertEntry(entryMap, {
      path,
      lastModified: row.updatedAt ?? undefined,
      priority: priorityFromDb(row.sitemapPriority, 0.5),
      images: uniqueStrings([row.ogImage]),
    });
  }

  for (const row of landingRows) {
    if (row.sitemapInclude === false) continue;

    const path = row.path ? pagePath(row.path) : pagePath(row.slug);
    if (isExcluded(path, excluded) || isDeprecatedPath(path)) continue;

    upsertEntry(entryMap, {
      path,
      lastModified: row.updatedAt ?? undefined,
      priority: priorityFromDb(row.sitemapPriority, 0.7),
      images: uniqueStrings([row.ogImage]),
    });
  }

  // Blog category/tag filter URLs (/blog?category=…, /blog?tag=…) are
  // intentionally NOT emitted: those views canonicalize to /blog, so listing
  // them in the sitemap would conflict with their canonical URL.

  return Array.from(entryMap.values()).sort((a, b) =>
    pathKey(a.path).localeCompare(pathKey(b.path)),
  );
}

export function getSitemapEntries() {
  return unstable_cache(fetchSitemapEntries, ["sitemap-entries-v4"], {
    tags: [
      "posts",
      "services",
      "case-studies",
      "pages",
      "landing-pages",
      "jobs",
      "site-settings",
      "sitemap",
    ],
  })();
}
/**
 * Admin view: every published (or static) URL with include state.
 * CMS rows honor sitemapInclude; static/jobs honor global excluded paths.
 */
export async function getSitemapAdminRows(): Promise<SitemapAdminRow[]> {
  const settings = await getSiteSettings();
  const excluded = settings.sitemapExcludedPaths.map(normalizePath);

  const [postRows, serviceRows, caseStudyRows, pageRows, jobRows, landingRows] =
    await Promise.all([
    getDb()
      .select({
        id: posts.id,
        slug: posts.slug,
        updatedAt: posts.updatedAt,
        sitemapInclude: posts.sitemapInclude,
        sitemapPriority: posts.sitemapPriority,
        noIndex: posts.noIndex,
        status: posts.status,
      })
      .from(posts)
      .where(eq(posts.status, "published")),
    getDb()
      .select({
        id: services.id,
        slug: services.slug,
        parentId: services.parentId,
        updatedAt: services.updatedAt,
        sitemapInclude: services.sitemapInclude,
        sitemapPriority: services.sitemapPriority,
        noIndex: services.noIndex,
      })
      .from(services)
      .where(eq(services.status, "published")),
    getDb()
      .select({
        id: caseStudies.id,
        slug: caseStudies.slug,
        updatedAt: caseStudies.updatedAt,
        sitemapInclude: caseStudies.sitemapInclude,
        sitemapPriority: caseStudies.sitemapPriority,
        noIndex: caseStudies.noIndex,
      })
      .from(caseStudies)
      .where(eq(caseStudies.status, "published")),
    getDb()
      .select({
        id: pages.id,
        slug: pages.slug,
        path: pages.path,
        updatedAt: pages.updatedAt,
        sitemapInclude: pages.sitemapInclude,
        sitemapPriority: pages.sitemapPriority,
        noIndex: pages.noIndex,
      })
      .from(pages)
      .where(eq(pages.status, "published")),
    getDb()
      .select({
        id: jobs.id,
        slug: jobs.slug,
        updatedAt: jobs.updatedAt,
      })
      .from(jobs)
      .where(eq(jobs.status, "published")),
    getDb()
      .select({
        id: landingPages.id,
        slug: landingPages.slug,
        path: landingPages.path,
        updatedAt: landingPages.updatedAt,
        sitemapInclude: landingPages.sitemapInclude,
        sitemapPriority: landingPages.sitemapPriority,
        noIndex: landingPages.noIndex,
      })
      .from(landingPages)
      .where(eq(landingPages.status, "published")),
  ]);
  const parentSlugById = new Map<string, string>();
  for (const row of serviceRows) {
    if (!row.parentId) {
      parentSlugById.set(row.id, row.slug);
    }
  }

  const rows: SitemapAdminRow[] = [
    ...getStaticSitemapRoutes()
      .filter((row) => !isDeprecatedPath(row.path))
      .map((row) => ({
        path: row.path,
        source: "static" as const,
        entityId: null,
        priority: row.priority,
        included: !isExcluded(row.path, excluded),
        lastModified: null,
        noIndex: false,
      })),
    ...postRows.map((row) => {
      const path = postPath(row.slug);
      return {
        path,
        source: "post" as const,
        entityId: row.id,
        priority: priorityFromDb(row.sitemapPriority, 0.7),
        included:
          row.sitemapInclude !== false &&
          row.noIndex !== true &&
          !isExcluded(path, excluded),
        lastModified: row.updatedAt ?? null,
        noIndex: row.noIndex === true,
      };
    }),
    ...pageRows.map((row) => {
      const path = row.path ? pagePath(row.path) : pagePath(row.slug);
      return {
        path,
        source: "page" as const,
        entityId: row.id,
        priority: priorityFromDb(row.sitemapPriority, 0.5),
        included:
          row.sitemapInclude !== false &&
          row.noIndex !== true &&
          !isExcluded(path, excluded) &&
          !isDeprecatedPath(path),
        lastModified: row.updatedAt ?? null,
        noIndex: row.noIndex === true,
      };
    }),
    ...landingRows.map((row) => {
      const path = row.path ? pagePath(row.path) : pagePath(row.slug);
      return {
        path,
        source: "landing-page" as const,
        entityId: row.id,
        priority: priorityFromDb(row.sitemapPriority, 0.7),
        included:
          row.sitemapInclude !== false &&
          row.noIndex !== true &&
          !isExcluded(path, excluded) &&
          !isDeprecatedPath(path),
        lastModified: row.updatedAt ?? null,
        noIndex: row.noIndex === true,
      };
    }),
    ...serviceRows.map((row) => {
      const path = servicePath({
        slug: row.slug,
        parentSlug: row.parentId
          ? parentSlugById.get(row.parentId) ?? null
          : null,
      });
      return {
        path,
        source: "service" as const,
        entityId: row.id,
        priority: priorityFromDb(row.sitemapPriority, 0.7),
        included:
          row.sitemapInclude !== false &&
          row.noIndex !== true &&
          !isExcluded(path, excluded),
        lastModified: row.updatedAt ?? null,
        noIndex: row.noIndex === true,
      };
    }),
    ...caseStudyRows.map((row) => {
      const path = caseStudyPath(row.slug);
      return {
        path,
        source: "case-study" as const,
        entityId: row.id,
        priority: priorityFromDb(row.sitemapPriority, 0.7),
        included:
          row.sitemapInclude !== false &&
          row.noIndex !== true &&
          !isExcluded(path, excluded),
        lastModified: row.updatedAt ?? null,
        noIndex: row.noIndex === true,
      };
    }),
    ...jobRows.map((row) => {
      const path = jobPath(row.slug);
      return {
        path,
        source: "job" as const,
        entityId: row.id,
        priority: 0.6,
        included: !isExcluded(path, excluded),
        lastModified: row.updatedAt ?? null,
        noIndex: false,
      };
    }),
  ];

  const deduped = new Map<string, SitemapAdminRow>();
  for (const row of rows) {
    deduped.set(pathKey(row.path), row);
  }

  return Array.from(deduped.values()).sort((a, b) =>
    pathKey(a.path).localeCompare(pathKey(b.path)),
  );
}
