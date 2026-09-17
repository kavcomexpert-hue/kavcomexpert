import { getDb } from "@/lib/db";
import { withDbRetry } from "@/lib/db/retry";
import { categories, postCategories, posts } from "@/lib/db/schema";
import { BLOG_PAGE_SIZE } from "@/lib/posts/constants";
import { publishDueScheduledPosts } from "@/lib/posts/publish-scheduled";
import { getPostCategorySlugs } from "@/lib/posts/sync-taxonomy";
import { and, count, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export type PublishedPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string | null;
  categories?: string[];
  publishedAt: Date | null;
  updatedAt: Date | null;
  readingMinutes: number | null;
};

export type PublishedPost = typeof posts.$inferSelect & {
  categories?: string[];
};

export type PaginatedPosts = {
  posts: PublishedPostSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const postListColumns = {
  id: posts.id,
  slug: posts.slug,
  title: posts.title,
  excerpt: posts.excerpt,
  coverImage: posts.coverImage,
  category: posts.category,
  publishedAt: posts.publishedAt,
  updatedAt: posts.updatedAt,
  readingMinutes: posts.readingMinutes,
};

function matchesCategoryCondition(category: string) {
  return or(
    eq(posts.category, category),
    sql`exists (
      select 1 from ${postCategories} pc
      inner join ${categories} c on c.id = pc.category_id
      where pc.post_id = ${posts.id}
        and (c.slug = ${category} or c.name = ${category})
    )`,
  )!;
}

async function fetchPublishedPosts(limit?: number, category?: string) {
  await publishDueScheduledPosts({ revalidate: false });

  const conditions = [eq(posts.status, "published")];

  if (category) {
    conditions.push(matchesCategoryCondition(category));
  }

  const query = getDb()
    .select(postListColumns)
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.publishedAt));

  if (limit) {
    return query.limit(limit);
  }

  return query;
}

export function getPublishedPosts(limit?: number, category?: string) {
  return unstable_cache(
    async () => {
      try {
        return await fetchPublishedPosts(limit, category);
      } catch (error) {
        console.warn("[posts] published list fetch failed; returning empty.", error);
        return [];
      }
    },
    ["published-posts", String(limit ?? "all"), category ?? "all"],
    { tags: ["posts"] },
  )();
}

export function getRecentPosts(limit = 5, excludeSlug?: string) {
  return unstable_cache(
    async () => {
      try {
        const rows = await fetchPublishedPosts(limit + (excludeSlug ? 1 : 0));
        return excludeSlug
          ? rows.filter((row) => row.slug !== excludeSlug).slice(0, limit)
          : rows.slice(0, limit);
      } catch (error) {
        console.warn("[posts] recent list fetch failed; returning empty.", error);
        return [];
      }
    },
    ["recent-posts", String(limit), excludeSlug ?? "none"],
    { tags: ["posts"] },
  )();
}

async function fetchPublishedPostsPage(
  page: number,
  pageSize: number,
  category?: string,
  query?: string,
): Promise<PaginatedPosts> {
  // Same due-scheduled sweep as the other published fetches, so posts whose
  // scheduled time has passed appear on the blog index without waiting on cron.
  await publishDueScheduledPosts({ revalidate: false });

  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, pageSize);
  const search = query?.trim();

  const conditions = [eq(posts.status, "published")];
  if (category) {
    conditions.push(matchesCategoryCondition(category));
  }
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(ilike(posts.title, pattern), ilike(posts.excerpt, pattern))!,
    );
  }

  const where = and(...conditions);

  const totalRow = await getDb().select({ value: count() }).from(posts).where(where);
  const total = Number(totalRow[0]?.value ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / safeSize));
  const currentPage = Math.min(safePage, totalPages);
  const offset = (currentPage - 1) * safeSize;

  const rows = await getDb()
    .select(postListColumns)
    .from(posts)
    .where(where)
    .orderBy(desc(posts.publishedAt))
    .limit(safeSize)
    .offset(offset);

  return {
    posts: rows,
    total,
    page: currentPage,
    pageSize: safeSize,
    totalPages,
  };
}

export function getPublishedPostsPage(
  page = 1,
  pageSize = BLOG_PAGE_SIZE,
  category?: string,
  query?: string,
) {
  return unstable_cache(
    async () => {
      try {
        return await fetchPublishedPostsPage(page, pageSize, category, query);
      } catch (error) {
        console.warn("[posts] paginated list fetch failed; returning empty.", error);
        return {
          posts: [],
          total: 0,
          page: 1,
          pageSize,
          totalPages: 1,
        };
      }
    },
    [
      "published-posts-page",
      String(page),
      String(pageSize),
      category ?? "all",
      query?.trim().toLowerCase() ?? "",
    ],
    { tags: ["posts"] },
  )();
}

async function fetchPublishedCategories() {
  const joinRows = await getDb()
    .select({
      slug: categories.slug,
      name: categories.name,
      total: count(),
    })
    .from(postCategories)
    .innerJoin(categories, eq(postCategories.categoryId, categories.id))
    .innerJoin(posts, eq(postCategories.postId, posts.id))
    .where(eq(posts.status, "published"))
    .groupBy(categories.slug, categories.name)
    .orderBy(desc(count()));

  if (joinRows.length > 0) {
    return joinRows.map((row) => ({
      value: row.slug,
      count: Number(row.total),
      label: row.name,
    }));
  }

  // Legacy fallback for posts that only have denormalized category text.
  const rows = await getDb()
    .select({
      category: posts.category,
      total: count(),
    })
    .from(posts)
    .where(and(eq(posts.status, "published"), sql`${posts.category} is not null`))
    .groupBy(posts.category)
    .orderBy(desc(count()));

  const taxonomy = await getDb()
    .select({
      slug: categories.slug,
      name: categories.name,
    })
    .from(categories);

  const nameBySlug = new Map(taxonomy.map((row) => [row.slug, row.name]));

  return rows
    .filter((row): row is { category: string; total: number } =>
      Boolean(row.category),
    )
    .map((row) => ({
      value: row.category,
      count: Number(row.total),
      label: nameBySlug.get(row.category) ?? undefined,
    }));
}

export function getPublishedCategories() {
  return unstable_cache(
    async () => {
      try {
        return await fetchPublishedCategories();
      } catch (error) {
        console.warn("[posts] categories fetch failed; returning empty.", error);
        return [];
      }
    },
    ["published-categories"],
    {
      tags: ["posts"],
    },
  )();
}

async function fetchPostBySlug(slug: string): Promise<PublishedPost | null> {
  // Best-effort: a failed scheduled-publish sweep must never 404 a live post.
  try {
    await publishDueScheduledPosts({ revalidate: false });
  } catch (error) {
    console.warn("[posts] scheduled publish sweep failed; continuing.", error);
  }

  const [post] = await withDbRetry(() =>
    getDb()
      .select()
      .from(posts)
      .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
      .limit(1),
  );

  if (!post) return null;

  const categorySlugs = await getPostCategorySlugs(post.id, post.category);
  return { ...post, categories: categorySlugs };
}

/**
 * Returns null ONLY when the query succeeded and no published row exists.
 * DB failures throw (after retries) so a transient outage becomes a
 * retryable 500 instead of a cached 404.
 */
export function getPostBySlug(slug: string): Promise<PublishedPost | null> {
  return unstable_cache(
    (): Promise<PublishedPost | null> => fetchPostBySlug(slug),
    ["published-post", slug],
    { tags: ["posts"] },
  )();
}

async function fetchFeedPosts() {
  return getDb()
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      tldr: posts.tldr,
      metaDescription: posts.metaDescription,
      category: posts.category,
      content: posts.content,
      keyTakeaways: posts.keyTakeaways,
      postFaqs: posts.postFaqs,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt))
    .limit(20);
}

export function getFeedPosts() {
  return unstable_cache(
    async () => {
      try {
        return await fetchFeedPosts();
      } catch (error) {
        console.warn("[posts] feed fetch failed; returning empty.", error);
        return [];
      }
    },
    ["feed-posts"],
    {
      tags: ["posts"],
    },
  )();
}

async function fetchPublishedPostsForLlms() {
  return getDb()
    .select({
      slug: posts.slug,
      title: posts.title,
      tldr: posts.tldr,
      excerpt: posts.excerpt,
      metaDescription: posts.metaDescription,
    })
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt));
}

export function getPublishedPostsForLlms() {
  return unstable_cache(
    async () => {
      try {
        return await fetchPublishedPostsForLlms();
      } catch (error) {
        console.warn("[posts] llms index fetch failed; returning empty.", error);
        return [];
      }
    },
    ["llms-posts"],
    {
      tags: ["posts"],
    },
  )();
}

async function fetchPublishedPostSlugs() {
  return getDb()
    .select({ slug: posts.slug })
    .from(posts)
    .where(eq(posts.status, "published"));
}

export function getPublishedPostSlugs() {
  return unstable_cache(
    async () => {
      try {
        return await fetchPublishedPostSlugs();
      } catch (error) {
        console.warn("[posts] slug list fetch failed; returning empty.", error);
        return [];
      }
    },
    ["published-post-slugs"],
    {
      tags: ["posts"],
    },
  )();
}

async function fetchRelatedPosts(
  category: string,
  excludeSlug: string,
  limit: number,
) {
  return getDb()
    .select(postListColumns)
    .from(posts)
    .where(
      and(
        eq(posts.status, "published"),
        matchesCategoryCondition(category),
        ne(posts.slug, excludeSlug),
      ),
    )
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}

export function getRelatedPosts(
  category: string,
  excludeSlug: string,
  limit = 3,
) {
  return unstable_cache(
    () => fetchRelatedPosts(category, excludeSlug, limit),
    ["related-posts", category, excludeSlug, String(limit)],
    { tags: ["posts"] },
  )();
}
