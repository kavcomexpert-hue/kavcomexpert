"use server";

import { beginAdminMutation, RateLimitedError } from "@/lib/admin/mutation-guard";
import { actionErrorMessage } from "@/lib/admin/action-error";
import { requireContentManager } from "@/lib/authz";
import { getDb } from "@/lib/db";
import {
  categories,
  postCategories,
  posts,
  postTags,
  tags,
} from "@/lib/db/schema";
import { slugifyTaxonomy } from "@/lib/posts/taxonomy";
import { eq, inArray, or } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

type ActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

const UNCATEGORIZED_SLUG = "uncategorized";
const UNCATEGORIZED_NAME = "Uncategorized";

const categoryInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-friendly")
    .optional(),
  description: z.string().trim().max(500).optional(),
  metaTitle: z.string().trim().max(70).optional(),
  metaDescription: z.string().trim().max(170).optional(),
  focusKeyword: z.string().trim().max(120).optional(),
  secondaryKeywords: z.string().trim().max(300).optional(),
  noIndex: z.boolean().optional(),
});

const tagInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required").max(80),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-friendly")
    .optional(),
  metaTitle: z.string().trim().max(70).optional(),
  metaDescription: z.string().trim().max(170).optional(),
  focusKeyword: z.string().trim().max(120).optional(),
  secondaryKeywords: z.string().trim().max(300).optional(),
  noIndex: z.boolean().optional(),
});

function revalidateTaxonomy() {
  revalidateTag("posts", "max");
  revalidateTag("categories", "max");
  revalidateTag("tags", "max");
  revalidateTag("sitemap", "max");
  revalidatePath("/admin/taxonomy");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/tags");
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
}

async function ensureUncategorizedCategory(): Promise<{
  id: string;
  name: string;
  slug: string;
}> {
  const [existing] = await getDb()
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    })
    .from(categories)
    .where(eq(categories.slug, UNCATEGORIZED_SLUG))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await getDb()
    .insert(categories)
    .values({
      name: UNCATEGORIZED_NAME,
      slug: UNCATEGORIZED_SLUG,
      description: "Default category for posts without a specific category",
    })
    .returning({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    });

  return created;
}

export async function saveCategory(
  input: z.input<typeof categoryInputSchema>,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);
    const parsed = categoryInputSchema.parse(input);
    const slug = parsed.slug?.trim() || slugifyTaxonomy(parsed.name);
    const now = new Date();

    if (parsed.id) {
      const [existing] = await getDb()
        .select({ slug: categories.slug })
        .from(categories)
        .where(eq(categories.id, parsed.id))
        .limit(1);

      if (existing?.slug === UNCATEGORIZED_SLUG && slug !== UNCATEGORIZED_SLUG) {
        return {
          success: false,
          error: "Cannot change the Uncategorized slug",
        };
      }

      await getDb()
        .update(categories)
        .set({
          name: parsed.name,
          slug,
          description: parsed.description || null,
          metaTitle: parsed.metaTitle?.trim() || null,
          metaDescription: parsed.metaDescription?.trim() || null,
          focusKeyword: parsed.focusKeyword?.trim() || null,
          secondaryKeywords: parsed.secondaryKeywords?.trim() || null,
          noIndex: parsed.noIndex ?? false,
          updatedAt: now,
        })
        .where(eq(categories.id, parsed.id));
      revalidateTaxonomy();

      await audit({
        action: "update",
        entityType: "category",
        entityId: parsed.id,
        meta: { slug },
      });

      return { success: true, id: parsed.id };
    }

    const [created] = await getDb()
      .insert(categories)
      .values({
        name: parsed.name,
        slug,
        description: parsed.description || null,
        metaTitle: parsed.metaTitle?.trim() || null,
        metaDescription: parsed.metaDescription?.trim() || null,
        focusKeyword: parsed.focusKeyword?.trim() || null,
        secondaryKeywords: parsed.secondaryKeywords?.trim() || null,
        noIndex: parsed.noIndex ?? false,
      })
      .returning({ id: categories.id });

    revalidateTaxonomy();

    await audit({
      action: "create",
      entityType: "category",
      entityId: created.id,
      meta: { slug },
    });

    return { success: true, id: created.id };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid input" };
    }
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Could not save category (slug may already exist)" };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);
    const parsedId = z.string().uuid().parse(id);

    const [category] = await getDb()
      .select()
      .from(categories)
      .where(eq(categories.id, parsedId))
      .limit(1);

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    if (category.slug === UNCATEGORIZED_SLUG) {
      return { success: false, error: "Cannot delete the Uncategorized category" };
    }

    const uncategorized = await ensureUncategorizedCategory();

    const joinedPosts = await getDb()
      .select({ postId: postCategories.postId })
      .from(postCategories)
      .where(eq(postCategories.categoryId, parsedId));

    const denormPosts = await getDb()
      .select({ id: posts.id })
      .from(posts)
      .where(
        or(eq(posts.category, category.name), eq(posts.category, category.slug)),
      );

    const postIds = [
      ...new Set([
        ...joinedPosts.map((row) => row.postId),
        ...denormPosts.map((row) => row.id),
      ]),
    ];

    if (postIds.length > 0) {
      await getDb()
        .update(posts)
        .set({ category: uncategorized.name, updatedAt: new Date() })
        .where(inArray(posts.id, postIds));

      await getDb()
        .delete(postCategories)
        .where(eq(postCategories.categoryId, parsedId));

      for (const postId of postIds) {
        await getDb()
          .insert(postCategories)
          .values({ postId, categoryId: uncategorized.id })
          .onConflictDoNothing();
      }
    }

    await getDb().delete(categories).where(eq(categories.id, parsedId));
    revalidateTaxonomy();

    await audit({
      action: "delete",
      entityType: "category",
      entityId: parsedId,
      meta: { reassignedTo: uncategorized.slug, postCount: postIds.length },
    });

    return { success: true, id: parsedId };
  } catch (error) {
    return { success: false, error: actionErrorMessage(error, "Could not delete category") };
  }
}

export async function saveTag(
  input: z.input<typeof tagInputSchema>,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);
    const parsed = tagInputSchema.parse(input);
    const slug = parsed.slug?.trim() || slugifyTaxonomy(parsed.name);
    const now = new Date();

    if (parsed.id) {
      await getDb()
        .update(tags)
        .set({
          name: parsed.name,
          slug,
          metaTitle: parsed.metaTitle?.trim() || null,
          metaDescription: parsed.metaDescription?.trim() || null,
          focusKeyword: parsed.focusKeyword?.trim() || null,
          secondaryKeywords: parsed.secondaryKeywords?.trim() || null,
          noIndex: parsed.noIndex ?? false,
          updatedAt: now,
        })
        .where(eq(tags.id, parsed.id));
      revalidateTaxonomy();

      await audit({
        action: "update",
        entityType: "tag",
        entityId: parsed.id,
        meta: { slug },
      });

      return { success: true, id: parsed.id };
    }

    const [created] = await getDb()
      .insert(tags)
      .values({
        name: parsed.name,
        slug,
        metaTitle: parsed.metaTitle?.trim() || null,
        metaDescription: parsed.metaDescription?.trim() || null,
        focusKeyword: parsed.focusKeyword?.trim() || null,
        secondaryKeywords: parsed.secondaryKeywords?.trim() || null,
        noIndex: parsed.noIndex ?? false,
      })
      .returning({ id: tags.id });

    revalidateTaxonomy();

    await audit({
      action: "create",
      entityType: "tag",
      entityId: created.id,
      meta: { slug },
    });

    return { success: true, id: created.id };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Invalid input" };
    }
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Could not save tag (slug may already exist)" };
  }
}

export async function deleteTag(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);
    const parsedId = z.string().uuid().parse(id);

    const [tag] = await getDb()
      .select()
      .from(tags)
      .where(eq(tags.id, parsedId))
      .limit(1);

    if (!tag) {
      return { success: false, error: "Tag not found" };
    }

    const allPosts = await getDb()
      .select({ id: posts.id, tags: posts.tags })
      .from(posts);

    for (const post of allPosts) {
      const list = post.tags ?? [];
      if (!list.includes(tag.name) && !list.includes(tag.slug)) continue;
      const nextTags = list.filter(
        (value) => value !== tag.name && value !== tag.slug,
      );
      await getDb()
        .update(posts)
        .set({ tags: nextTags, updatedAt: new Date() })
        .where(eq(posts.id, post.id));
    }

    await getDb().delete(postTags).where(eq(postTags.tagId, parsedId));
    await getDb().delete(tags).where(eq(tags.id, parsedId));
    revalidateTaxonomy();

    await audit({
      action: "delete",
      entityType: "tag",
      entityId: parsedId,
    });

    return { success: true, id: parsedId };
  } catch (error) {
    return { success: false, error: actionErrorMessage(error, "Could not delete tag") };
  }
}
