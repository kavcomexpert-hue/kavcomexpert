import { getDb } from "@/lib/db";
import {
  categories,
  postCategories,
  postTags,
  tags,
} from "@/lib/db/schema";
import { slugifyTaxonomy } from "@/lib/posts/taxonomy";
import { eq, inArray } from "drizzle-orm";

async function resolveCategoryId(nameOrSlug: string): Promise<string> {
  const name = nameOrSlug.trim();
  const slug = slugifyTaxonomy(name);
  const [existing] = await getDb()
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  if (existing?.id) return existing.id;

  const [created] = await getDb()
    .insert(categories)
    .values({ name, slug })
    .returning({ id: categories.id });

  return created.id;
}

/**
 * Keep join tables in sync with denormalized category/tags fields.
 * Accepts one or many category names/slugs (many-to-many).
 */
export async function syncPostTaxonomy(
  postId: string,
  categoryNames: string | string[] | null | undefined,
  tagNames: string[],
) {
  await getDb().delete(postCategories).where(eq(postCategories.postId, postId));
  await getDb().delete(postTags).where(eq(postTags.postId, postId));

  const list = (
    Array.isArray(categoryNames)
      ? categoryNames
      : categoryNames
        ? [categoryNames]
        : []
  )
    .map((item) => item.trim())
    .filter(Boolean);

  const unique = [...new Set(list.map((item) => slugifyTaxonomy(item)))];
  // Preserve display names for any that look like names vs slugs
  const bySlug = new Map(
    list.map((item) => [slugifyTaxonomy(item), item.trim()] as const),
  );

  if (unique.length > 0) {
    const ids = await Promise.all(
      unique.map((slug) => resolveCategoryId(bySlug.get(slug) || slug)),
    );
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length > 0) {
      await getDb()
        .insert(postCategories)
        .values(uniqueIds.map((categoryId) => ({ postId, categoryId })))
        .onConflictDoNothing();
    }
  }

  for (const tagName of tagNames) {
    const name = tagName.trim();
    if (!name) continue;
    const slug = slugifyTaxonomy(name);
    const [existing] = await getDb()
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1);

    const tagId =
      existing?.id ??
      (
        await getDb()
          .insert(tags)
          .values({ name, slug })
          .returning({ id: tags.id })
      )[0].id;

    await getDb()
      .insert(postTags)
      .values({ postId, tagId })
      .onConflictDoNothing();
  }
}

/** Load category slugs for a post (join table + legacy fallback). */
export async function getPostCategorySlugs(
  postId: string,
  legacyCategory?: string | null,
): Promise<string[]> {
  const rows = await getDb()
    .select({ slug: categories.slug })
    .from(postCategories)
    .innerJoin(categories, eq(postCategories.categoryId, categories.id))
    .where(eq(postCategories.postId, postId));

  const slugs = rows.map((row) => row.slug).filter(Boolean);
  if (slugs.length > 0) return slugs;

  if (legacyCategory?.trim()) {
    return [slugifyTaxonomy(legacyCategory.trim())];
  }
  return [];
}

export async function getPostCategorySlugsForIds(
  postIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (postIds.length === 0) return map;

  const rows = await getDb()
    .select({
      postId: postCategories.postId,
      slug: categories.slug,
    })
    .from(postCategories)
    .innerJoin(categories, eq(postCategories.categoryId, categories.id))
    .where(inArray(postCategories.postId, postIds));

  for (const row of rows) {
    const current = map.get(row.postId) ?? [];
    current.push(row.slug);
    map.set(row.postId, current);
  }

  return map;
}
