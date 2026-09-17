"use server";

import { beginAdminMutation, RateLimitedError } from "@/lib/admin/mutation-guard";
import { canEditEntity, assertCanDeleteContent, assertCanSetStatus, canAccessOwnedContent, canPublish, requireContentManager } from "@/lib/authz";
import { requireSession } from "@/lib/admin/session";
import { getDb } from "@/lib/db";
import { saveRevision } from "@/lib/db/revisions";
import { posts, revisions, tags, user } from "@/lib/db/schema";
import { notifyIndexNow } from "@/lib/indexnow/notify";
import { postFaqSchema } from "@/lib/posts/aeo";
import { computeReadingMinutes } from "@/lib/posts/constants";
import {
  getPostCategorySlugs,
  syncPostTaxonomy,
} from "@/lib/posts/sync-taxonomy";
import { slugifyTaxonomy } from "@/lib/posts/taxonomy";
import { postPath } from "@/lib/paths";
import { ensureSlugRedirect } from "@/lib/redirects/slug-change";
import { absoluteUrl } from "@/lib/seo/constants";
import { parseSchemaJson } from "@/lib/admin/seo-schema";
import { and, desc, eq, inArray, lt, ne } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

const categorySchema = z.string().trim().min(1).max(120);

const schemaTypeSchema = z.enum(["Article", "BlogPosting", "WebPage", "Service"]);

const postFaqInputSchema = z.object({
  q: z.string(),
  a: z.string(),
});

const postStatusSchema = z.enum(["draft", "published", "scheduled", "trashed"]);

const postInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().trim().min(1, "Title is required"),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-friendly"),
    excerpt: z.string().optional(),
    category: categorySchema.optional(),
    categories: z.array(categorySchema).max(20).optional(),
    tags: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
    coverImage: z.string().optional(),
    content: z.unknown(),
    tldr: z.string().optional(),
    keyTakeaways: z.array(z.string()).default([]),
    postFaqs: z.array(postFaqInputSchema).default([]),
    metaTitle: z.string(),
    metaDescription: z.string(),
    focusKeyword: z.string().optional(),
    secondaryKeywords: z.string().optional(),
    schemaType: schemaTypeSchema.default("BlogPosting"),
    schemaJson: z.string().optional(),
    ogImage: z.string().optional(),
    canonicalUrl: z.string().optional(),
    noIndex: z.boolean().default(false),
    socialTitle: z.string().optional(),
    socialDescription: z.string().optional(),
    noFollow: z.boolean().default(false),
    noArchive: z.boolean().default(false),
    sitemapInclude: z.boolean().default(true),
    sitemapPriority: z.string().optional(),
    status: postStatusSchema,
    scheduledFor: z.string().datetime().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.status !== "published" && data.status !== "scheduled") {
      return;
    }

    if (!data.metaTitle.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Meta title is required to publish",
        path: ["metaTitle"],
      });
    }

    if (!data.metaDescription.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Meta description is required to publish",
        path: ["metaDescription"],
      });
    }

    if (data.metaTitle.length > 70) {
      ctx.addIssue({
        code: "custom",
        message: "Meta title must be 70 characters or fewer to publish",
        path: ["metaTitle"],
      });
    }

    if (data.metaDescription.length > 170) {
      ctx.addIssue({
        code: "custom",
        message: "Meta description must be 170 characters or fewer to publish",
        path: ["metaDescription"],
      });
    }

    if (!data.tldr?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "TL;DR is required to publish",
        path: ["tldr"],
      });
    }

    const takeaways = data.keyTakeaways.map((item) => item.trim()).filter(Boolean);

    if (takeaways.length < 3) {
      ctx.addIssue({
        code: "custom",
        message: "At least 3 key takeaways are required to publish",
        path: ["keyTakeaways"],
      });
    }

    if (data.status === "scheduled" && !data.scheduledFor) {
      ctx.addIssue({
        code: "custom",
        message: "Choose a schedule date and time",
        path: ["scheduledFor"],
      });
    }
  });

const quickEditSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.string().trim().optional(),
  status: z.enum(["draft", "published", "scheduled"]),
});

const bulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  action: z.enum([
    "publish",
    "trash",
    "restore",
    "delete",
    "assign-category",
  ]),
  category: z.string().trim().optional(),
});

type ActionResult =
  | { success: true; id: string; slug: string }
  | { success: false; error: string };

type BulkResult =
  | { success: true; count: number }
  | { success: false; error: string };

function resolveCategoryList(
  parsed: Pick<z.infer<typeof postInputSchema>, "category" | "categories">,
): string[] {
  return (
    parsed.categories?.length
      ? parsed.categories
      : parsed.category
        ? [parsed.category]
        : []
  )
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Set primary category without wiping other join-table categories. */
async function categoriesWithPrimary(
  postId: string,
  primary: string,
  legacyCategory?: string | null,
): Promise<string[]> {
  const existing = await getPostCategorySlugs(postId, legacyCategory);
  const primarySlug = slugifyTaxonomy(primary);
  const rest = existing.filter((slug) => slug !== primarySlug);
  return [primary, ...rest];
}

function revalidatePostPaths(slug: string, previousSlug?: string) {
  revalidateTag("posts", "max");
  revalidateTag("sitemap", "max");
  revalidatePath("/admin/posts");
  revalidatePath("/admin");
  revalidatePath(postPath(slug));
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");

  if (previousSlug && previousSlug !== slug) {
    revalidatePath(postPath(previousSlug));
  }
}

async function emptyOldTrash() {
  const cutoff = new Date(Date.now() - TRASH_RETENTION_MS);
  await getDb()
    .delete(posts)
    .where(and(eq(posts.status, "trashed"), lt(posts.updatedAt, cutoff)));
}

async function ensureUniqueSlug(base: string, excludeId?: string) {
  let candidate = base;
  let n = 2;
  for (;;) {
    const [existing] = await getDb()
      .select({ id: posts.id })
      .from(posts)
      .where(
        excludeId
          ? and(eq(posts.slug, candidate), ne(posts.id, excludeId))
          : eq(posts.slug, candidate),
      )
      .limit(1);
    if (!existing) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
  }
}

function buildValues(
  parsed: z.infer<typeof postInputSchema>,
  now: Date,
  authorId: string,
) {
  const takeaways = parsed.keyTakeaways.map((item) => item.trim()).filter(Boolean);
  const faqs = parsed.postFaqs
    .map((faq) => ({
      q: faq.q.trim(),
      a: faq.a.trim(),
    }))
    .filter((faq) => faq.q && faq.a)
    .flatMap((faq) => {
      const validated = postFaqSchema.safeParse(faq);
      return validated.success ? [validated.data] : [];
    });

  const scheduledFor =
    parsed.status === "scheduled" && parsed.scheduledFor
      ? new Date(parsed.scheduledFor)
      : null;

  const categoryList = (
    parsed.categories?.length
      ? parsed.categories
      : parsed.category
        ? [parsed.category]
        : []
  )
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    title: parsed.title,
    slug: parsed.slug,
    excerpt: parsed.excerpt || null,
    category: categoryList[0] || null,
    tags: parsed.tags,
    coverImage: parsed.coverImage || null,
    content: parsed.content,
    tldr: parsed.tldr?.trim() || null,
    keyTakeaways: takeaways,
    postFaqs: faqs,
    status: parsed.status,
    scheduledFor,
    readingMinutes: computeReadingMinutes(parsed.content),
    focusKeyword: parsed.focusKeyword || null,
    secondaryKeywords: parsed.secondaryKeywords?.trim() || null,
    metaTitle: parsed.metaTitle.trim() || parsed.title,
    metaDescription:
      parsed.metaDescription.trim() || parsed.excerpt?.trim() || parsed.title,
    canonicalUrl: parsed.canonicalUrl || null,
    ogImage: parsed.ogImage || null,
    schemaType: parsed.schemaType,
    schemaJson: parsed.schemaJson?.trim()
      ? parseSchemaJson(parsed.schemaJson)
      : null,
    noIndex: parsed.noIndex,
    socialTitle: parsed.socialTitle?.trim() || null,
    socialDescription: parsed.socialDescription?.trim() || null,
    noFollow: parsed.noFollow,
    noArchive: parsed.noArchive,
    sitemapInclude: parsed.sitemapInclude ?? true,
    sitemapPriority: parsed.sitemapPriority?.trim() || "0.7",
    authorId,
    updatedAt: now,
  };
}

export async function checkSlugAvailable(
  slug: string,
  excludeId?: string,
): Promise<{ available: boolean }> {
  try {
    await beginAdminMutation();
    const cleaned = slug.trim();
    if (!cleaned) return { available: false };
    const [existing] = await getDb()
      .select({ id: posts.id })
      .from(posts)
      .where(
        excludeId
          ? and(eq(posts.slug, cleaned), ne(posts.id, excludeId))
          : eq(posts.slug, cleaned),
      )
      .limit(1);
    return { available: !existing };
  } catch {
    return { available: false };
  }
}

export async function savePost(
  input: z.input<typeof postInputSchema>,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }
    await emptyOldTrash();

    const parsed = postInputSchema.parse(input);
    try {
      assertCanSetStatus(session, parsed.status);
    } catch {
      return { success: false, error: "Forbidden" };
    }
    const now = new Date();

    for (const tagName of parsed.tags) {
      const tagSlug = slugifyTaxonomy(tagName);
      const [existingTag] = await getDb()
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.slug, tagSlug))
        .limit(1);
      if (!existingTag) {
        await getDb().insert(tags).values({ name: tagName, slug: tagSlug });
      }
    }

    if (parsed.id) {
      const [existing] = await getDb()
        .select()
        .from(posts)
        .where(eq(posts.id, parsed.id))
        .limit(1);

      if (!existing) {
        return { success: false, error: "Post not found" };
      }

      if (!canEditEntity(session, { authorId: existing.authorId })) {
        return { success: false, error: "Forbidden" };
      }

      const values = buildValues(
        parsed,
        now,
        existing.authorId ?? session.user.id,
      );

      const publishedAt =
        parsed.status === "published"
          ? (existing.publishedAt ?? now)
          : parsed.status === "scheduled"
            ? existing.publishedAt
            : parsed.status === "trashed"
              ? existing.publishedAt
              : null;

      await getDb()
        .update(posts)
        .set({ ...values, publishedAt })
        .where(eq(posts.id, parsed.id));

      await syncPostTaxonomy(parsed.id, resolveCategoryList(parsed), parsed.tags);
      await saveRevision({
        entityType: "post",
        entityId: parsed.id,
        snapshot: { ...existing, ...values, publishedAt },
        authorId: session.user.id,
      });

      const wasOrIsPublished =
        existing.status === "published" || parsed.status === "published";
      if (wasOrIsPublished && existing.slug !== parsed.slug) {
        await ensureSlugRedirect(
          postPath(existing.slug),
          postPath(parsed.slug),
        );
      }

      revalidatePostPaths(parsed.slug, existing.slug);

      let indexNow = undefined as Awaited<
        ReturnType<typeof notifyIndexNow>
      > | undefined;
      if (parsed.status === "published") {
        indexNow = await notifyIndexNow(absoluteUrl(postPath(parsed.slug)));
      }

      await audit({
        action: "update",
        entityType: "post",
        entityId: parsed.id,
        meta: { slug: parsed.slug, status: parsed.status, indexNow },
      });

      return { success: true, id: parsed.id, slug: parsed.slug };
    }

    const values = buildValues(parsed, now, session.user.id);

    const [created] = await getDb()
      .insert(posts)
      .values({
        ...values,
        publishedAt: parsed.status === "published" ? now : null,
      })
      .returning({ id: posts.id, slug: posts.slug });

    await syncPostTaxonomy(created.id, resolveCategoryList(parsed), parsed.tags);
    await saveRevision({
      entityType: "post",
      entityId: created.id,
      snapshot: {
        ...values,
        id: created.id,
        publishedAt: parsed.status === "published" ? now : null,
      },
      authorId: session.user.id,
    });

    revalidatePostPaths(created.slug);

    let indexNow = undefined as Awaited<
      ReturnType<typeof notifyIndexNow>
    > | undefined;
    if (parsed.status === "published") {
      indexNow = await notifyIndexNow(absoluteUrl(`/blog/${created.slug}`));
    }

    await audit({
      action: "create",
      entityType: "post",
      entityId: created.id,
      meta: { slug: created.slug, status: parsed.status, indexNow },
    });

    return { success: true, id: created.id, slug: created.slug };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }

    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return { success: false, error: error.message };
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return { success: false, error: "Forbidden" };
    }

    if (
      error instanceof Error &&
      error.message.includes("unique constraint")
    ) {
      return { success: false, error: "That slug is already in use" };
    }

    return { success: false, error: "Failed to save post" };
  }
}

/**
 * Autosave: always writes a revision. Updates the post row only when not published
 * (so live published content is never overwritten until Update is clicked).
 */
export async function autosavePost(
  input: z.input<typeof postInputSchema> & { id: string },
): Promise<ActionResult> {
  try {
    const { session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }
    const parsed = postInputSchema.parse({ ...input, status: input.status ?? "draft" });
    if (!parsed.id) {
      return { success: false, error: "Post id required for autosave" };
    }

    const [existing] = await getDb()
      .select()
      .from(posts)
      .where(eq(posts.id, parsed.id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Post not found" };
    }

    if (!canEditEntity(session, { authorId: existing.authorId })) {
      return { success: false, error: "Forbidden" };
    }

    const now = new Date();
    const snapshot = {
      ...buildValues(
        { ...parsed, status: existing.status as z.infer<typeof postStatusSchema> },
        now,
        session.user.id,
      ),
      id: existing.id,
      status: existing.status,
      publishedAt: existing.publishedAt,
      scheduledFor: existing.scheduledFor,
    };

    await saveRevision({
      entityType: "post",
      entityId: existing.id,
      snapshot,
      authorId: session.user.id,
    });

    if (existing.status !== "published") {
      const values = buildValues(
        {
          ...parsed,
          status: (existing.status as z.infer<typeof postStatusSchema>) || "draft",
        },
        now,
        session.user.id,
      );
      await getDb()
        .update(posts)
        .set({
          ...values,
          status: existing.status,
          publishedAt: existing.publishedAt,
          scheduledFor: existing.scheduledFor,
        })
        .where(eq(posts.id, existing.id));
    }

    // Taxonomy must sync on every autosave — including published posts —
    // so multi-category edits aren't lost before Update.
    await syncPostTaxonomy(
      existing.id,
      resolveCategoryList(parsed),
      parsed.tags,
    );

    return { success: true, id: existing.id, slug: existing.slug };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Autosave failed" };
  }
}

export async function quickDraftPost(input: {
  title: string;
  body?: string;
}): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }
    const title = input.title.trim();
    if (!title) {
      return { success: false, error: "Title is required" };
    }

    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "draft";
    const slug = await ensureUniqueSlug(baseSlug);
    const now = new Date();
    const body = input.body?.trim();

    const content = body
      ? {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: body }],
            },
          ],
        }
      : { type: "doc", content: [] };

    const [created] = await getDb()
      .insert(posts)
      .values({
        title,
        slug,
        content,
        status: "draft",
        authorId: session.user.id,
        metaTitle: title,
        metaDescription: body?.slice(0, 160) || title,
        schemaType: "BlogPosting",
        sitemapInclude: true,
        sitemapPriority: "0.7",
        updatedAt: now,
      })
      .returning({ id: posts.id, slug: posts.slug });

    await saveRevision({
      entityType: "post",
      entityId: created.id,
      snapshot: { id: created.id, title, slug, status: "draft", content },
      authorId: session.user.id,
    });

    revalidatePostPaths(created.slug);

    await audit({
      action: "create",
      entityType: "post",
      entityId: created.id,
      meta: { slug: created.slug, quickDraft: true },
    });

    return { success: true, id: created.id, slug: created.slug };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create draft" };
  }
}

export async function quickEditPost(
  input: z.input<typeof quickEditSchema>,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }
    const parsed = quickEditSchema.parse(input);

    const [existing] = await getDb()
      .select()
      .from(posts)
      .where(eq(posts.id, parsed.id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Post not found" };
    }

    if (!canEditEntity(session, { authorId: existing.authorId })) {
      return { success: false, error: "Forbidden" };
    }

    try {
      assertCanSetStatus(session, parsed.status);
    } catch {
      return { success: false, error: "Forbidden" };
    }

    const now = new Date();
    const publishedAt =
      parsed.status === "published"
        ? (existing.publishedAt ?? now)
        : existing.publishedAt;

    await getDb()
      .update(posts)
      .set({
        title: parsed.title,
        slug: parsed.slug,
        category: parsed.category || null,
        status: parsed.status,
        publishedAt,
        updatedAt: now,
      })
      .where(eq(posts.id, parsed.id));

    if (parsed.category) {
      await syncPostTaxonomy(
        parsed.id,
        await categoriesWithPrimary(
          parsed.id,
          parsed.category,
          existing.category,
        ),
        Array.isArray(existing.tags) ? (existing.tags as string[]) : [],
      );
    }

    revalidatePostPaths(parsed.slug, existing.slug);

    await audit({
      action: "update",
      entityType: "post",
      entityId: parsed.id,
      meta: { quickEdit: true, slug: parsed.slug },
    });

    return { success: true, id: parsed.id, slug: parsed.slug };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Quick edit failed" };
  }
}

export async function duplicatePost(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }
    const [existing] = await getDb()
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Post not found" };
    }

    const slug = await ensureUniqueSlug(`${existing.slug}-copy`);
    const now = new Date();

    const [created] = await getDb()
      .insert(posts)
      .values({
        title: `${existing.title} (Copy)`,
        slug,
        excerpt: existing.excerpt,
        content: existing.content,
        coverImage: existing.coverImage,
        category: existing.category,
        tags: existing.tags,
        tldr: existing.tldr,
        keyTakeaways: existing.keyTakeaways,
        postFaqs: existing.postFaqs,
        status: "draft",
        publishedAt: null,
        scheduledFor: null,
        authorId: session.user.id,
        readingMinutes: existing.readingMinutes,
        focusKeyword: existing.focusKeyword,
        metaTitle: existing.metaTitle,
        metaDescription: existing.metaDescription,
        canonicalUrl: null,
        ogImage: existing.ogImage,
        schemaType: existing.schemaType,
        noIndex: true,
        socialTitle: existing.socialTitle,
        socialDescription: existing.socialDescription,
        noFollow: existing.noFollow,
        noArchive: existing.noArchive,
        sitemapInclude: existing.sitemapInclude,
        sitemapPriority: existing.sitemapPriority,
        updatedAt: now,
      })
      .returning({ id: posts.id, slug: posts.slug });

    await syncPostTaxonomy(
      created.id,
      existing.category ? [existing.category] : [],
      Array.isArray(existing.tags) ? (existing.tags as string[]) : [],
    );

    revalidatePostPaths(created.slug);

    await audit({
      action: "create",
      entityType: "post",
      entityId: created.id,
      meta: { duplicatedFrom: id, slug: created.slug },
    });

    return { success: true, id: created.id, slug: created.slug };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to duplicate post" };
  }
}

export async function trashPost(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }
    await emptyOldTrash();

    const [existing] = await getDb()
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Post not found" };
    }

    if (!canEditEntity(session, { authorId: existing.authorId })) {
      return { success: false, error: "Forbidden" };
    }

    try {
      assertCanDeleteContent(session, existing.status);
    } catch {
      return { success: false, error: "Forbidden" };
    }

    await getDb()
      .update(posts)
      .set({ status: "trashed", updatedAt: new Date() })
      .where(eq(posts.id, id));

    revalidatePostPaths(existing.slug);

    await audit({
      action: "delete",
      entityType: "post",
      entityId: id,
      meta: { soft: true, slug: existing.slug },
    });

    return { success: true, id: existing.id, slug: existing.slug };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to move to trash" };
  }
}

export async function restorePost(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }

    const [existing] = await getDb()
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Post not found" };
    }

    if (!canEditEntity(session, { authorId: existing.authorId })) {
      return { success: false, error: "Forbidden" };
    }

    await getDb()
      .update(posts)
      .set({ status: "draft", updatedAt: new Date() })
      .where(eq(posts.id, id));

    revalidatePostPaths(existing.slug);

    await audit({
      action: "update",
      entityType: "post",
      entityId: id,
      meta: { restored: true, slug: existing.slug },
    });

    return { success: true, id: existing.id, slug: existing.slug };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to restore post" };
  }
}

export async function deletePostPermanently(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }

    const [existing] = await getDb()
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Post not found" };
    }

    if (existing.status !== "trashed") {
      return { success: false, error: "Only trashed posts can be deleted permanently" };
    }

    if (!canEditEntity(session, { authorId: existing.authorId })) {
      return { success: false, error: "Forbidden" };
    }

    await getDb().delete(posts).where(eq(posts.id, id));
    await getDb()
      .delete(revisions)
      .where(
        and(eq(revisions.entityType, "post"), eq(revisions.entityId, id)),
      );

    revalidatePostPaths(existing.slug);

    await audit({
      action: "delete",
      entityType: "post",
      entityId: id,
      meta: { permanent: true, slug: existing.slug },
    });

    return { success: true, id: existing.id, slug: existing.slug };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete permanently" };
  }
}

export async function bulkUpdatePosts(
  input: z.input<typeof bulkSchema>,
): Promise<BulkResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }
    const parsed = bulkSchema.parse(input);
    await emptyOldTrash();

    const rows = await getDb()
      .select()
      .from(posts)
      .where(inArray(posts.id, parsed.ids));

    let countDone = 0;
    const now = new Date();

    for (const row of rows) {
      if (!canEditEntity(session, { authorId: row.authorId })) {
        continue;
      }

      if (parsed.action === "publish") {
        if (!canPublish(session)) {
          continue;
        }
        if (!row.metaTitle?.trim() || !row.metaDescription?.trim() || !row.tldr?.trim()) {
          continue;
        }
        const takeaways = Array.isArray(row.keyTakeaways)
          ? (row.keyTakeaways as string[]).filter((t) => t.trim())
          : [];
        if (takeaways.length < 3) continue;

        await getDb()
          .update(posts)
          .set({
            status: "published",
            publishedAt: row.publishedAt ?? now,
            scheduledFor: null,
            updatedAt: now,
          })
          .where(eq(posts.id, row.id));
        await notifyIndexNow(absoluteUrl(`/blog/${row.slug}`));
        countDone += 1;
      } else if (parsed.action === "trash") {
        try {
          assertCanDeleteContent(session, row.status);
        } catch {
          continue;
        }
        await getDb()
          .update(posts)
          .set({ status: "trashed", updatedAt: now })
          .where(eq(posts.id, row.id));
        countDone += 1;
      } else if (parsed.action === "restore") {
        if (row.status !== "trashed") continue;
        await getDb()
          .update(posts)
          .set({ status: "draft", updatedAt: now })
          .where(eq(posts.id, row.id));
        countDone += 1;
      } else if (parsed.action === "delete") {
        if (row.status !== "trashed") continue;
        await getDb().delete(posts).where(eq(posts.id, row.id));
        countDone += 1;
      } else if (parsed.action === "assign-category") {
        if (!parsed.category) continue;
        await getDb()
          .update(posts)
          .set({ category: parsed.category, updatedAt: now })
          .where(eq(posts.id, row.id));
        await syncPostTaxonomy(
          row.id,
          await categoriesWithPrimary(row.id, parsed.category, row.category),
          Array.isArray(row.tags) ? (row.tags as string[]) : [],
        );
        countDone += 1;
      }
    }

    revalidateTag("posts", "max");
    revalidatePath("/admin/posts");
    revalidatePath("/blog");

    await audit({
      action: "update",
      entityType: "post",
      meta: { bulk: parsed.action, count: countDone },
    });

    return { success: true, count: countDone };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }
    return { success: false, error: "Bulk action failed" };
  }
}

export async function getPostRevisions(postId: string) {
  try {
    const session = await requireSession();
    if (!canAccessOwnedContent(session)) {
      return [];
    }

    const [existing] = await getDb()
      .select({ authorId: posts.authorId })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!existing || !canEditEntity(session, { authorId: existing.authorId })) {
      return [];
    }

    return getDb()
      .select({
        id: revisions.id,
        createdAt: revisions.createdAt,
        authorId: revisions.authorId,
        snapshot: revisions.snapshot,
        authorName: user.name,
        authorEmail: user.email,
      })
      .from(revisions)
      .leftJoin(user, eq(revisions.authorId, user.id))
      .where(
        and(eq(revisions.entityType, "post"), eq(revisions.entityId, postId)),
      )
      .orderBy(desc(revisions.createdAt))
      .limit(15);
  } catch {
    return [];
  }
}

export async function restorePostRevision(
  postId: string,
  revisionId: string,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }

    const [existing] = await getDb()
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Post not found" };
    }

    if (!canEditEntity(session, { authorId: existing.authorId })) {
      return { success: false, error: "Forbidden" };
    }

    const [rev] = await getDb()
      .select()
      .from(revisions)
      .where(
        and(
          eq(revisions.id, revisionId),
          eq(revisions.entityType, "post"),
          eq(revisions.entityId, postId),
        ),
      )
      .limit(1);

    if (!rev) {
      return { success: false, error: "Revision not found" };
    }

    const snap = rev.snapshot as Record<string, unknown>;
    const now = new Date();

    await getDb()
      .update(posts)
      .set({
        title: typeof snap.title === "string" ? snap.title : existing.title,
        slug: typeof snap.slug === "string" ? snap.slug : existing.slug,
        excerpt: (snap.excerpt as string | null) ?? existing.excerpt,
        content: snap.content ?? existing.content,
        coverImage: (snap.coverImage as string | null) ?? existing.coverImage,
        category: (snap.category as string | null) ?? existing.category,
        tags: (snap.tags as string[] | null) ?? existing.tags,
        tldr: (snap.tldr as string | null) ?? existing.tldr,
        keyTakeaways: snap.keyTakeaways ?? existing.keyTakeaways,
        postFaqs: snap.postFaqs ?? existing.postFaqs,
        metaTitle:
          typeof snap.metaTitle === "string" ? snap.metaTitle : existing.metaTitle,
        metaDescription:
          typeof snap.metaDescription === "string"
            ? snap.metaDescription
            : existing.metaDescription,
        focusKeyword:
          (snap.focusKeyword as string | null) ?? existing.focusKeyword,
        updatedAt: now,
        // Keep current publish status — restore content only
        status: existing.status,
        publishedAt: existing.publishedAt,
        scheduledFor: existing.scheduledFor,
      })
      .where(eq(posts.id, postId));

    await saveRevision({
      entityType: "post",
      entityId: postId,
      snapshot: { ...existing, restoredFrom: revisionId },
      authorId: session.user.id,
    });

    revalidatePostPaths(existing.slug);

    await audit({
      action: "update",
      entityType: "post",
      entityId: postId,
      meta: { restoredRevision: revisionId },
    });

    return { success: true, id: postId, slug: existing.slug };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to restore revision" };
  }
}

export async function createCategoryInline(
  name: string,
): Promise<{ success: true; name: string } | { success: false; error: string }> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: "Name required" };
    }
    const { categories } = await import("@/lib/db/schema");
    const slug = slugifyTaxonomy(trimmed);
    await getDb()
      .insert(categories)
      .values({ name: trimmed, slug })
      .onConflictDoNothing();
    // Same tags as src/actions/taxonomy.ts so cached category lists refresh.
    revalidateTag("categories", "max");
    revalidateTag("posts", "max");
    revalidatePath("/admin/posts");
    revalidatePath("/admin/categories");
    await audit({
      action: "create",
      entityType: "category",
      entityId: slug,
      meta: { name: trimmed, inline: true },
    });
    return { success: true, name: trimmed };
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return { success: false, error: "Forbidden" };
    }
    return { success: false, error: "Failed to create category" };
  }
}
