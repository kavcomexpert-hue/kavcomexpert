"use server";

import { beginAdminMutation, RateLimitedError } from "@/lib/admin/mutation-guard";
import {
  applyPublishSeoRules,
  seoDbValues,
  seoInputSchema,
} from "@/lib/admin/seo-schema";
import { requireSession } from "@/lib/admin/session";
import { canEditEntity, requireContentManager } from "@/lib/authz";
import { getDb } from "@/lib/db";
import { saveRevision } from "@/lib/db/revisions";
import { pages, revisions, user } from "@/lib/db/schema";
import { notifyIndexNow } from "@/lib/indexnow/notify";
import { isReservedPageSlug } from "@/lib/pages/constants";
import {
  assertUniquePagePath,
  computePagePath,
  recomputeChildPaths,
} from "@/lib/pages/path";
import { pagePath } from "@/lib/paths";
import { ensureSlugRedirect } from "@/lib/redirects/slug-change";
import { absoluteUrl } from "@/lib/seo/constants";
import { serviceHeroVisualSchema } from "@/lib/services/page-sections";
import { and, desc, eq, inArray, lt, ne } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

const pageStatusSchema = z.enum(["draft", "published", "scheduled", "trashed"]);

const pageInputSchema = seoInputSchema
  .extend({
    id: z.string().uuid().optional(),
    title: z.string().trim().min(1, "Title is required"),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-friendly"),
    content: z.unknown(),
    pageSections: z.unknown().optional(),
    heroVisual: serviceHeroVisualSchema.optional().nullable(),
    heroEyebrow: z.string().optional(),
    heroSubtext: z.string().optional(),
    showCta: z.boolean().default(true),
    template: z.enum(["marketing", "article"]).default("marketing"),
    parentId: z.string().uuid().nullable().optional(),
    parentServiceId: z.string().uuid().nullable().optional(),
    status: pageStatusSchema,
    scheduledFor: z.string().datetime().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (isReservedPageSlug(data.slug)) {
      ctx.addIssue({
        code: "custom",
        message: "This slug is reserved for an existing or system route",
        path: ["slug"],
      });
    }

    if (data.parentId && data.parentServiceId) {
      ctx.addIssue({
        code: "custom",
        message: "Choose either a parent page or a parent service, not both",
        path: ["parentId"],
      });
    }

    if (data.id && data.parentId && data.parentId === data.id) {
      ctx.addIssue({
        code: "custom",
        message: "A page cannot be its own parent",
        path: ["parentId"],
      });
    }

    applyPublishSeoRules(data, ctx);

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
  status: z.enum(["draft", "published", "scheduled"]),
});

const bulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  action: z.enum(["publish", "trash", "restore", "delete"]),
});

type ActionResult =
  | { success: true; id: string; slug: string; path?: string }
  | { success: false; error: string };

type BulkResult =
  | { success: true; count: number }
  | { success: false; error: string };

function revalidatePagePaths(
  path: string,
  slug: string,
  previousPath?: string | null,
  previousSlug?: string,
) {
  revalidateTag("pages", "max");
  revalidateTag("sitemap", "max");
  revalidatePath("/admin/pages");
  revalidatePath("/admin");
  revalidatePath(path === "/" ? "/" : path);
  revalidatePath(`/${slug}`);
  revalidatePath("/sitemap.xml");

  if (previousPath && previousPath !== path) {
    revalidatePath(previousPath === "/" ? "/" : previousPath);
  }
  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/${previousSlug}`);
  }
}

async function emptyOldTrash() {
  const cutoff = new Date(Date.now() - TRASH_RETENTION_MS);
  await getDb()
    .delete(pages)
    .where(and(eq(pages.status, "trashed"), lt(pages.updatedAt, cutoff)));
}

async function ensureUniqueSlug(base: string, excludeId?: string) {
  let candidate = base;
  let n = 2;
  for (;;) {
    if (isReservedPageSlug(candidate)) {
      candidate = `${base}-${n}`;
      n += 1;
      continue;
    }

    const [existing] = await getDb()
      .select({ id: pages.id })
      .from(pages)
      .where(
        excludeId
          ? and(eq(pages.slug, candidate), ne(pages.id, excludeId))
          : eq(pages.slug, candidate),
      )
      .limit(1);
    if (!existing) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
  }
}

async function buildValues(
  parsed: z.infer<typeof pageInputSchema>,
  now: Date,
  authorId: string,
  excludeId?: string,
) {
  const scheduledFor =
    parsed.status === "scheduled" && parsed.scheduledFor
      ? new Date(parsed.scheduledFor)
      : null;

  const parentId = parsed.parentId ?? null;
  const parentServiceId = parsed.parentServiceId ?? null;

  const path = await computePagePath({
    slug: parsed.slug,
    parentId,
    parentServiceId,
    excludeId,
  });

  await assertUniquePagePath(path, excludeId);

  return {
    title: parsed.title,
    slug: parsed.slug,
    path,
    content: parsed.content,
    pageSections: parsed.pageSections ?? null,
    heroVisual: parsed.heroVisual ?? null,
    heroEyebrow: parsed.heroEyebrow?.trim() || null,
    heroSubtext: parsed.heroSubtext?.trim() || null,
    showCta: parsed.showCta,
    template: parsed.template,
    parentId,
    parentServiceId,
    status: parsed.status,
    scheduledFor,
    authorId,
    updatedAt: now,
    ...seoDbValues(parsed, {
      title: parsed.title,
      description: parsed.heroSubtext,
    }),
  };
}

export async function checkPageSlugAvailable(
  slug: string,
  excludeId?: string,
): Promise<{ available: boolean }> {
  try {
    await beginAdminMutation();
    const cleaned = slug.trim();
    if (!cleaned || isReservedPageSlug(cleaned)) {
      return { available: false };
    }
    const [existing] = await getDb()
      .select({ id: pages.id })
      .from(pages)
      .where(
        excludeId
          ? and(eq(pages.slug, cleaned), ne(pages.id, excludeId))
          : eq(pages.slug, cleaned),
      )
      .limit(1);
    return { available: !existing };
  } catch {
    return { available: false };
  }
}

export async function savePage(
  input: z.input<typeof pageInputSchema>,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);
    await emptyOldTrash();

    const parsed = pageInputSchema.parse(input);
    const now = new Date();

    if (parsed.id) {
      const [existing] = await getDb()
        .select()
        .from(pages)
        .where(eq(pages.id, parsed.id))
        .limit(1);

      if (!existing) {
        return { success: false, error: "Page not found" };
      }

      if (!canEditEntity(session, { authorId: existing.authorId })) {
        return { success: false, error: "Forbidden" };
      }

      const values = await buildValues(
        parsed,
        now,
        session.user.id,
        parsed.id,
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
        .update(pages)
        .set({ ...values, publishedAt })
        .where(eq(pages.id, parsed.id));

      await recomputeChildPaths(parsed.id);

      await saveRevision({
        entityType: "page",
        entityId: parsed.id,
        snapshot: { ...existing, ...values, publishedAt },
        authorId: session.user.id,
      });

      const oldPath = pagePath(existing.path || existing.slug);
      const newPath = pagePath(values.path);
      const wasOrIsPublished =
        existing.status === "published" || parsed.status === "published";
      if (wasOrIsPublished && oldPath !== newPath) {
        await ensureSlugRedirect(oldPath, newPath);
      }

      revalidatePagePaths(
        values.path,
        parsed.slug,
        existing.path,
        existing.slug,
      );

      let indexNow = undefined as Awaited<
        ReturnType<typeof notifyIndexNow>
      > | undefined;
      if (parsed.status === "published") {
        indexNow = await notifyIndexNow(
          absoluteUrl(values.path === "/" ? "/" : values.path),
        );
      }

      await audit({
        action: "update",
        entityType: "page",
        entityId: parsed.id,
        meta: {
          slug: parsed.slug,
          path: values.path,
          status: parsed.status,
          indexNow,
        },
      });

      return {
        success: true,
        id: parsed.id,
        slug: parsed.slug,
        path: values.path,
      };
    }

    const values = await buildValues(parsed, now, session.user.id);

    const [created] = await getDb()
      .insert(pages)
      .values({
        ...values,
        publishedAt: parsed.status === "published" ? now : null,
      })
      .returning({ id: pages.id, slug: pages.slug, path: pages.path });

    await saveRevision({
      entityType: "page",
      entityId: created.id,
      snapshot: {
        ...values,
        id: created.id,
        publishedAt: parsed.status === "published" ? now : null,
      },
      authorId: session.user.id,
    });

    revalidatePagePaths(created.path ?? `/${created.slug}`, created.slug);

    let indexNow = undefined as Awaited<
      ReturnType<typeof notifyIndexNow>
    > | undefined;
    if (parsed.status === "published") {
      indexNow = await notifyIndexNow(
        absoluteUrl(
          created.path === "/" ? "/" : (created.path ?? `/${created.slug}`),
        ),
      );
    }

    await audit({
      action: "create",
      entityType: "page",
      entityId: created.id,
      meta: {
        slug: created.slug,
        path: created.path,
        status: parsed.status,
        indexNow,
      },
    });

    return {
      success: true,
      id: created.id,
      slug: created.slug,
      path: created.path ?? undefined,
    };
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

    if (
      error instanceof Error &&
      (error.message.includes("unique constraint") ||
        error.message.includes("already in use") ||
        error.message.includes("Parent") ||
        error.message.includes("own parent") ||
        error.message.includes("one parent"))
    ) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to save page" };
  }
}

/**
 * Autosave: always writes a revision. Updates the page row only when not published
 * (so live published content is never overwritten until Update is clicked).
 */
export async function autosavePage(
  input: z.input<typeof pageInputSchema> & { id: string },
): Promise<ActionResult> {
  try {
    const { session } = await beginAdminMutation();
    requireContentManager(session);
    const parsed = pageInputSchema.parse({
      ...input,
      status: input.status ?? "draft",
    });
    if (!parsed.id) {
      return { success: false, error: "Page id required for autosave" };
    }

    const [existing] = await getDb()
      .select()
      .from(pages)
      .where(eq(pages.id, parsed.id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Page not found" };
    }

    if (!canEditEntity(session, { authorId: existing.authorId })) {
      return { success: false, error: "Forbidden" };
    }

    const now = new Date();
    const values = await buildValues(
      {
        ...parsed,
        status: existing.status as z.infer<typeof pageStatusSchema>,
      },
      now,
      session.user.id,
      existing.id,
    );

    const snapshot = {
      ...values,
      id: existing.id,
      status: existing.status,
      publishedAt: existing.publishedAt,
      scheduledFor: existing.scheduledFor,
    };

    await saveRevision({
      entityType: "page",
      entityId: existing.id,
      snapshot,
      authorId: session.user.id,
    });

    if (existing.status !== "published") {
      await getDb()
        .update(pages)
        .set({
          ...values,
          status: existing.status,
          publishedAt: existing.publishedAt,
          scheduledFor: existing.scheduledFor,
        })
        .where(eq(pages.id, existing.id));
    }

    return {
      success: true,
      id: existing.id,
      slug: existing.slug,
      path: values.path,
    };
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
    if (error instanceof Error && error.message.includes("already in use")) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Autosave failed" };
  }
}

export async function quickEditPage(
  input: z.input<typeof quickEditSchema>,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);
    const parsed = quickEditSchema.parse(input);

    if (isReservedPageSlug(parsed.slug)) {
      return {
        success: false,
        error: "This slug is reserved for an existing or system route",
      };
    }

    const [existing] = await getDb()
      .select()
      .from(pages)
      .where(eq(pages.id, parsed.id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Page not found" };
    }

    if (!canEditEntity(session, { authorId: existing.authorId })) {
      return { success: false, error: "Forbidden" };
    }

    const now = new Date();
    const publishedAt =
      parsed.status === "published"
        ? (existing.publishedAt ?? now)
        : existing.publishedAt;

    const path = await computePagePath({
      slug: parsed.slug,
      parentId: existing.parentId,
      parentServiceId: existing.parentServiceId,
      excludeId: existing.id,
    });
    await assertUniquePagePath(path, existing.id);

    await getDb()
      .update(pages)
      .set({
        title: parsed.title,
        slug: parsed.slug,
        path,
        status: parsed.status,
        publishedAt,
        updatedAt: now,
      })
      .where(eq(pages.id, parsed.id));

    await recomputeChildPaths(parsed.id);

    revalidatePagePaths(path, parsed.slug, existing.path, existing.slug);

    await audit({
      action: "update",
      entityType: "page",
      entityId: parsed.id,
      meta: { quickEdit: true, slug: parsed.slug, path },
    });

    return { success: true, id: parsed.id, slug: parsed.slug, path };
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
    if (error instanceof Error && error.message.includes("already in use")) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Quick edit failed" };
  }
}

export async function duplicatePage(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);
    const [existing] = await getDb()
      .select()
      .from(pages)
      .where(eq(pages.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Page not found" };
    }

    const slug = await ensureUniqueSlug(`${existing.slug}-copy`);
    const now = new Date();
    const path = await computePagePath({
      slug,
      parentId: existing.parentId,
      parentServiceId: existing.parentServiceId,
    });
    await assertUniquePagePath(path);

    const [created] = await getDb()
      .insert(pages)
      .values({
        title: `${existing.title} (Copy)`,
        slug,
        path,
        content: existing.content,
        pageSections: existing.pageSections,
        heroVisual: existing.heroVisual,
        heroEyebrow: existing.heroEyebrow,
        heroSubtext: existing.heroSubtext,
        showCta: existing.showCta,
        template: existing.template ?? "marketing",
        parentId: existing.parentId,
        parentServiceId: existing.parentServiceId,
        status: "draft",
        publishedAt: null,
        scheduledFor: null,
        authorId: session.user.id,
        focusKeyword: existing.focusKeyword,
        secondaryKeywords: existing.secondaryKeywords,
        metaTitle: existing.metaTitle,
        metaDescription: existing.metaDescription,
        canonicalUrl: null,
        ogImage: existing.ogImage,
        schemaType: existing.schemaType,
        schemaJson: existing.schemaJson,
        noIndex: true,
        sitemapInclude: existing.sitemapInclude,
        sitemapPriority: existing.sitemapPriority,
        updatedAt: now,
      })
      .returning({ id: pages.id, slug: pages.slug, path: pages.path });

    revalidatePagePaths(created.path ?? `/${created.slug}`, created.slug);

    await audit({
      action: "create",
      entityType: "page",
      entityId: created.id,
      meta: { duplicatedFrom: id, slug: created.slug },
    });

    return {
      success: true,
      id: created.id,
      slug: created.slug,
      path: created.path ?? undefined,
    };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to duplicate page" };
  }
}

export async function trashPage(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);
    await emptyOldTrash();

    const [existing] = await getDb()
      .select()
      .from(pages)
      .where(eq(pages.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Page not found" };
    }

    if (!canEditEntity(session, { authorId: existing.authorId })) {
      return { success: false, error: "Forbidden" };
    }

    await getDb()
      .update(pages)
      .set({ status: "trashed", updatedAt: new Date() })
      .where(eq(pages.id, id));

    revalidatePagePaths(
      existing.path ?? `/${existing.slug}`,
      existing.slug,
    );

    await audit({
      action: "delete",
      entityType: "page",
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

export async function restorePage(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    const [existing] = await getDb()
      .select()
      .from(pages)
      .where(eq(pages.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Page not found" };
    }

    if (!canEditEntity(session, { authorId: existing.authorId })) {
      return { success: false, error: "Forbidden" };
    }

    await getDb()
      .update(pages)
      .set({ status: "draft", updatedAt: new Date() })
      .where(eq(pages.id, id));

    revalidatePagePaths(
      existing.path ?? `/${existing.slug}`,
      existing.slug,
    );

    await audit({
      action: "update",
      entityType: "page",
      entityId: id,
      meta: { restored: true, slug: existing.slug },
    });

    return { success: true, id: existing.id, slug: existing.slug };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to restore page" };
  }
}

export async function deletePagePermanently(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    const [existing] = await getDb()
      .select()
      .from(pages)
      .where(eq(pages.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Page not found" };
    }

    if (existing.status !== "trashed") {
      return {
        success: false,
        error: "Only trashed pages can be deleted permanently",
      };
    }

    if (!canEditEntity(session, { authorId: existing.authorId })) {
      return { success: false, error: "Forbidden" };
    }

    await getDb().delete(pages).where(eq(pages.id, id));
    await getDb()
      .delete(revisions)
      .where(
        and(eq(revisions.entityType, "page"), eq(revisions.entityId, id)),
      );

    revalidatePagePaths(
      existing.path ?? `/${existing.slug}`,
      existing.slug,
    );

    await audit({
      action: "delete",
      entityType: "page",
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

export async function bulkUpdatePages(
  input: z.input<typeof bulkSchema>,
): Promise<BulkResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);
    const parsed = bulkSchema.parse(input);
    await emptyOldTrash();

    const rows = await getDb()
      .select()
      .from(pages)
      .where(inArray(pages.id, parsed.ids));

    let countDone = 0;
    const now = new Date();

    for (const row of rows) {
      if (!canEditEntity(session, { authorId: row.authorId })) {
        continue;
      }

      if (parsed.action === "publish") {
        if (!row.metaTitle?.trim() || !row.metaDescription?.trim()) {
          continue;
        }

        await getDb()
          .update(pages)
          .set({
            status: "published",
            publishedAt: row.publishedAt ?? now,
            scheduledFor: null,
            updatedAt: now,
          })
          .where(eq(pages.id, row.id));
        await notifyIndexNow(
          absoluteUrl(row.path === "/" ? "/" : (row.path ?? `/${row.slug}`)),
        );
        countDone += 1;
      } else if (parsed.action === "trash") {
        await getDb()
          .update(pages)
          .set({ status: "trashed", updatedAt: now })
          .where(eq(pages.id, row.id));
        countDone += 1;
      } else if (parsed.action === "restore") {
        if (row.status !== "trashed") continue;
        await getDb()
          .update(pages)
          .set({ status: "draft", updatedAt: now })
          .where(eq(pages.id, row.id));
        countDone += 1;
      } else if (parsed.action === "delete") {
        if (row.status !== "trashed") continue;
        await getDb().delete(pages).where(eq(pages.id, row.id));
        countDone += 1;
      }
    }

    revalidateTag("pages", "max");
    revalidatePath("/admin/pages");

    await audit({
      action: "update",
      entityType: "page",
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

export async function getPageRevisions(pageId: string) {
  try {
    const session = await requireSession();
    requireContentManager(session);

    const [existing] = await getDb()
      .select({ id: pages.id })
      .from(pages)
      .where(eq(pages.id, pageId))
      .limit(1);

    if (!existing) {
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
        and(eq(revisions.entityType, "page"), eq(revisions.entityId, pageId)),
      )
      .orderBy(desc(revisions.createdAt))
      .limit(15);
  } catch {
    return [];
  }
}

export async function restorePageRevision(
  pageId: string,
  revisionId: string,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    const [existing] = await getDb()
      .select()
      .from(pages)
      .where(eq(pages.id, pageId))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Page not found" };
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
          eq(revisions.entityType, "page"),
          eq(revisions.entityId, pageId),
        ),
      )
      .limit(1);

    if (!rev) {
      return { success: false, error: "Revision not found" };
    }

    const snap = rev.snapshot as Record<string, unknown>;
    const now = new Date();
    const nextSlug =
      typeof snap.slug === "string" ? snap.slug : existing.slug;
    const path = await computePagePath({
      slug: nextSlug,
      parentId:
        (snap.parentId as string | null | undefined) ?? existing.parentId,
      parentServiceId:
        (snap.parentServiceId as string | null | undefined) ??
        existing.parentServiceId,
      excludeId: pageId,
    });

    await getDb()
      .update(pages)
      .set({
        title: typeof snap.title === "string" ? snap.title : existing.title,
        slug: nextSlug,
        path,
        content: snap.content ?? existing.content,
        pageSections: snap.pageSections ?? existing.pageSections,
        heroVisual: snap.heroVisual ?? existing.heroVisual,
        heroEyebrow:
          (snap.heroEyebrow as string | null) ?? existing.heroEyebrow,
        heroSubtext:
          (snap.heroSubtext as string | null) ?? existing.heroSubtext,
        showCta:
          typeof snap.showCta === "boolean" ? snap.showCta : existing.showCta,
        template:
          typeof snap.template === "string" ? snap.template : existing.template,
        parentId:
          (snap.parentId as string | null | undefined) ?? existing.parentId,
        parentServiceId:
          (snap.parentServiceId as string | null | undefined) ??
          existing.parentServiceId,
        metaTitle:
          typeof snap.metaTitle === "string"
            ? snap.metaTitle
            : existing.metaTitle,
        metaDescription:
          typeof snap.metaDescription === "string"
            ? snap.metaDescription
            : existing.metaDescription,
        focusKeyword:
          (snap.focusKeyword as string | null) ?? existing.focusKeyword,
        ogImage: (snap.ogImage as string | null) ?? existing.ogImage,
        canonicalUrl:
          (snap.canonicalUrl as string | null) ?? existing.canonicalUrl,
        updatedAt: now,
        status: existing.status,
        publishedAt: existing.publishedAt,
        scheduledFor: existing.scheduledFor,
      })
      .where(eq(pages.id, pageId));

    await saveRevision({
      entityType: "page",
      entityId: pageId,
      snapshot: { ...existing, restoredFrom: revisionId },
      authorId: session.user.id,
    });

    revalidatePagePaths(path, nextSlug, existing.path, existing.slug);

    await audit({
      action: "update",
      entityType: "page",
      entityId: pageId,
      meta: { restoredRevision: revisionId },
    });

    return { success: true, id: pageId, slug: nextSlug, path };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to restore revision" };
  }
}
