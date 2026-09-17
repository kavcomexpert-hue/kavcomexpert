import { getDb } from "@/lib/db";
import {
  categories,
  postCategories,
  posts,
  postTags,
  tags,
} from "@/lib/db/schema";
import { asc, eq, ne } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export type TaxonomyItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

async function fetchAllCategories() {
  return getDb()
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      metaTitle: categories.metaTitle,
      metaDescription: categories.metaDescription,
      focusKeyword: categories.focusKeyword,
      secondaryKeywords: categories.secondaryKeywords,
      noIndex: categories.noIndex,
    })
    .from(categories)
    .orderBy(asc(categories.name));
}

export function getAllCategories() {
  return unstable_cache(
    async () => {
      try {
        return await fetchAllCategories();
      } catch (error) {
        console.warn("[taxonomy] categories fetch failed; returning empty.", error);
        return [];
      }
    },
    ["all-categories"],
    {
      tags: ["categories", "posts"],
    },
  )();
}

export async function getAdminCategories() {
  return fetchAllCategories();
}

async function fetchAllTags() {
  return getDb()
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      metaTitle: tags.metaTitle,
      metaDescription: tags.metaDescription,
      focusKeyword: tags.focusKeyword,
      secondaryKeywords: tags.secondaryKeywords,
      noIndex: tags.noIndex,
    })
    .from(tags)
    .orderBy(asc(tags.name));
}

export function getAllTags() {
  return unstable_cache(
    async () => {
      try {
        return await fetchAllTags();
      } catch (error) {
        console.warn("[taxonomy] tags fetch failed; returning empty.", error);
        return [];
      }
    },
    ["all-tags"],
    {
      tags: ["tags", "posts"],
    },
  )();
}

export async function getAdminTags() {
  return fetchAllTags();
}

export async function getCategoryBySlug(slug: string) {
  const [row] = await getDb()
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return row ?? null;
}

/** Distinct post usage via join tables and/or denormalized fields. */
export async function getCategoryUsageCounts(): Promise<Record<string, number>> {
  const allCategories = await fetchAllCategories();

  const joins = await getDb()
    .select({
      categoryId: postCategories.categoryId,
      postId: postCategories.postId,
    })
    .from(postCategories);

  const denorm = await getDb()
    .select({ id: posts.id, category: posts.category })
    .from(posts)
    .where(ne(posts.category, ""));

  const counts: Record<string, number> = {};

  for (const category of allCategories) {
    const postIds = new Set<string>();
    for (const row of joins) {
      if (row.categoryId === category.id) postIds.add(row.postId);
    }
    for (const row of denorm) {
      if (row.category === category.name || row.category === category.slug) {
        postIds.add(row.id);
      }
    }
    counts[category.id] = postIds.size;
  }

  return counts;
}

export async function getTagUsageCounts(): Promise<Record<string, number>> {
  const allTags = await fetchAllTags();

  const joins = await getDb()
    .select({
      tagId: postTags.tagId,
      postId: postTags.postId,
    })
    .from(postTags);

  const denorm = await getDb()
    .select({ id: posts.id, tags: posts.tags })
    .from(posts);

  const counts: Record<string, number> = {};

  for (const tag of allTags) {
    const postIds = new Set<string>();
    for (const row of joins) {
      if (row.tagId === tag.id) postIds.add(row.postId);
    }
    for (const row of denorm) {
      const list = row.tags ?? [];
      if (list.includes(tag.name) || list.includes(tag.slug)) {
        postIds.add(row.id);
      }
    }
    counts[tag.id] = postIds.size;
  }

  return counts;
}
