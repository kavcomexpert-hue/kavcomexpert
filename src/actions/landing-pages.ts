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
import { landingPages, pages, revisions, user } from "@/lib/db/schema";
import { notifyIndexNow } from "@/lib/indexnow/notify";
import { isReservedPageSlug } from "@/lib/pages/constants";
import { ensureSlugRedirect } from "@/lib/redirects/slug-change";
import { absoluteUrl } from "@/lib/seo/constants";
import { serviceHeroVisualSchema } from "@/lib/services/page-sections";
import { and, desc, eq, inArray, lt, ne } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

const landingStatusSchema = z.enum(["draft", "published", "scheduled", "trashed"]);

const landingInputSchema = seoInputSchema
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
    layoutKind: z.enum(["marketing", "custom"]).default("marketing"),
    status: landingStatusSchema,
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

function pathForSlug(slug: string) {
  return `/${slug}`;
}

function revalidateLandingPaths(
  path: string,
  slug: string,
  previousPath?: string | null,
  previousSlug?: string,
) {
  revalidateTag("landing-pages", "max");
  revalidateTag("sitemap", "max");
  revalidatePath("/admin/landing-pages");
  revalidatePath("/admin");
  revalidatePath(path);
  revalidatePath(`/${slug}`);
  revalidatePath("/sitemap.xml");

  if (previousPath && previousPath !== path) {
    revalidatePath(previousPath);
  }
  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/${previousSlug}`);
  }
}

async function emptyOldTrash() {
  const cutoff = new Date(Date.now() - TRASH_RETENTION_MS);
  await getDb()
    .delete(landingPages)
    .where(
      and(eq(landingPages.status, "trashed"), lt(landingPages.updatedAt, cutoff)),
    );
}

async function assertSlugAvailable(slug: string, excludeId?: string) {
  if (isReservedPageSlug(slug)) {
    throw new Error("This slug is reserved for an existing or system route");
  }

  const [landingHit] = await getDb()
    .select({ id: landingPages.id })
    .from(landingPages)
    .where(
      excludeId
        ? and(eq(landingPages.slug, slug), ne(landingPages.id, excludeId))
        : eq(landingPages.slug, slug),
    )
    .limit(1);

  if (landingHit) {
    throw new Error("Slug already in use");
  }

  const [pageHit] = await getDb()
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.slug, slug))
    .limit(1);

  if (pageHit) {
    throw new Error("Slug already in use by a page");
  }
}

async function ensureUniqueSlug(base: string, excludeId?: string) {
  let candidate = base;
  let n = 2;
  for (;;) {
    try {
      await assertSlugAvailable(candidate, excludeId);
      return candidate;
    } catch {
      candidate = `${base}-${n}`;
      n += 1;
    }
  }
}

function buildValues(
  parsed: z.infer<typeof landingInputSchema>,
  now: Date,
  authorId: string,
) {
  const scheduledFor =
    parsed.status === "scheduled" && parsed.scheduledFor
      ? new Date(parsed.scheduledFor)
      : null;

  const path = pathForSlug(parsed.slug);

  return {
    title: parsed.title,
    slug: parsed.slug,
    path,
    content: parsed.content,
    pageSections: parsed.pageSections ?? null,
    heroVisual: parsed.heroVisual ?? null,
    layoutKind: parsed.layoutKind,
    status: parsed.status,
    scheduledFor,
    authorId,
    updatedAt: now,
    ...seoDbValues(parsed, {
      title: parsed.title,
    }),
  };
}

export async function checkLandingPageSlugAvailable(
  slug: string,
  excludeId?: string,
): Promise<{ available: boolean }> {
  try {
    await beginAdminMutation();
    const cleaned = slug.trim();
    if (!cleaned || isReservedPageSlug(cleaned)) {
      return { available: false };
    }
    await assertSlugAvailable(cleaned, excludeId);
    return { available: true };
  } catch {
    return { available: false };
  }
}

export async function saveLandingPage(
  input: z.input<typeof landingInputSchema>,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);
    await emptyOldTrash();

    const parsed = landingInputSchema.parse(input);
    const now = new Date();

    await assertSlugAvailable(parsed.slug, parsed.id);

    if (parsed.id) {
      const [existing] = await getDb()
        .select()
        .from(landingPages)
        .where(eq(landingPages.id, parsed.id))
        .limit(1);

      if (!existing) {
        return { success: false, error: "Landing page not found" };
      }

      if (!canEditEntity(session, { authorId: existing.authorId })) {
        return { success: false, error: "Forbidden" };
      }

      const values = buildValues(parsed, now, session.user.id);

      const publishedAt =
        parsed.status === "published"
          ? (existing.publishedAt ?? now)
          : parsed.status === "scheduled"
            ? existing.publishedAt
            : parsed.status === "trashed"
              ? existing.publishedAt
              : null;

      await getDb()
        .update(landingPages)
        .set({ ...values, publishedAt })
        .where(eq(landingPages.id, parsed.id));

      await saveRevision({
        entityType: "landing_page",
        entityId: parsed.id,
        snapshot: { ...existing, ...values, publishedAt },
        authorId: session.user.id,
      });

      const oldPath = existing.path || pathForSlug(existing.slug);
      const newPath = values.path;
      const wasOrIsPublished =
        existing.status === "published" || parsed.status === "published";
      if (wasOrIsPublished && oldPath !== newPath) {
        await ensureSlugRedirect(oldPath, newPath);
      }

      revalidateLandingPaths(
        values.path,
        parsed.slug,
        existing.path,
        existing.slug,
      );

      let indexNow = undefined as Awaited<
        ReturnType<typeof notifyIndexNow>
      > | undefined;
      if (parsed.status === "published") {
        indexNow = await notifyIndexNow(absoluteUrl(values.path));
      }

      await audit({
        action: "update",
        entityType: "landing_page",
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

    const values = buildValues(parsed, now, session.user.id);

    const [created] = await getDb()
      .insert(landingPages)
      .values({
        ...values,
        publishedAt: parsed.status === "published" ? now : null,
      })
      .returning({
        id: landingPages.id,
        slug: landingPages.slug,
        path: landingPages.path,
      });

    await saveRevision({
      entityType: "landing_page",
      entityId: created.id,
      snapshot: {
        ...values,
        id: created.id,
        publishedAt: parsed.status === "published" ? now : null,
      },
      authorId: session.user.id,
    });

    revalidateLandingPaths(created.path ?? pathForSlug(created.slug), created.slug);

    let indexNow = undefined as Awaited<
      ReturnType<typeof notifyIndexNow>
    > | undefined;
    if (parsed.status === "published") {
      indexNow = await notifyIndexNow(
        absoluteUrl(created.path ?? pathForSlug(created.slug)),
      );
    }

    await audit({
      action: "create",
      entityType: "landing_page",
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
        error.message.includes("reserved"))
    ) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to save landing page" };
  }
}

/**
 * Autosave: always writes a revision. Updates the row only when not published
 * (so live published content is never overwritten until Update is clicked).
 */
export async function autosaveLandingPage(
  input: z.input<typeof landingInputSchema> & { id: string },
): Promise<ActionResult> {
  try {
    const { session } = await beginAdminMutation();
    requireContentManager(session);
    const parsed = landingInputSchema.parse({
      ...input,
      status: input.status ?? "draft",
    });
    if (!parsed.id) {
      return { success: false, error: "Landing page id required for autosave" };
    }

    const [existing] = await getDb()
      .select()
      .from(landingPages)
      .where(eq(landingPages.id, parsed.id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Landing page not found" };
    }

    if (!canEditEntity(session, { authorId: existing.authorId })) {
      return { success: false, error: "Forbidden" };
    }

    await assertSlugAvailable(parsed.slug, existing.id);

    const now = new Date();
    const values = buildValues(
      {
        ...parsed,
        status: existing.status as z.infer<typeof landingStatusSchema>,
      },
      now,
      session.user.id,
    );

    const snapshot = {
      ...values,
      id: existing.id,
      status: existing.status,
      publishedAt: existing.publishedAt,
      scheduledFor: existing.scheduledFor,
    };

    await saveRevision({
      entityType: "landing_page",
      entityId: existing.id,
      snapshot,
      authorId: session.user.id,
    });

    if (existing.status !== "published") {
      await getDb()
        .update(landingPages)
        .set({
          ...values,
          status: existing.status,
          publishedAt: existing.publishedAt,
          scheduledFor: existing.scheduledFor,
        })
        .where(eq(landingPages.id, existing.id));
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
    if (
      error instanceof Error &&
      (error.message.includes("already in use") ||
        error.message.includes("reserved"))
    ) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Autosave failed" };
  }
}

export async function quickEditLandingPage(
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
      .from(landingPages)
      .where(eq(landingPages.id, parsed.id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Landing page not found" };
    }

    if (!canEditEntity(session, { authorId: existing.authorId })) {
      return { success: false, error: "Forbidden" };
    }

    await assertSlugAvailable(parsed.slug, existing.id);

    const now = new Date();
    const publishedAt =
      parsed.status === "published"
        ? (existing.publishedAt ?? now)
        : existing.publishedAt;

    const path = pathForSlug(parsed.slug);

    await getDb()
      .update(landingPages)
      .set({
        title: parsed.title,
        slug: parsed.slug,
        path,
        status: parsed.status,
        publishedAt,
        updatedAt: now,
      })
      .where(eq(landingPages.id, parsed.id));

    revalidateLandingPaths(path, parsed.slug, existing.path, existing.slug);

    await audit({
      action: "update",
      entityType: "landing_page",
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
    if (
      error instanceof Error &&
      (error.message.includes("already in use") ||
        error.message.includes("reserved"))
    ) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Quick edit failed" };
  }
}

export async function duplicateLandingPage(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);
    const [existing] = await getDb()
      .select()
      .from(landingPages)
      .where(eq(landingPages.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Landing page not found" };
    }

    const slug = await ensureUniqueSlug(`${existing.slug}-copy`);
    const now = new Date();
    const path = pathForSlug(slug);

    const [created] = await getDb()
      .insert(landingPages)
      .values({
        title: `${existing.title} (Copy)`,
        slug,
        path,
        content: existing.content,
        pageSections: existing.pageSections,
        heroVisual: existing.heroVisual,
        layoutKind: existing.layoutKind ?? "marketing",
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
      .returning({
        id: landingPages.id,
        slug: landingPages.slug,
        path: landingPages.path,
      });

    revalidateLandingPaths(created.path ?? pathForSlug(created.slug), created.slug);

    await audit({
      action: "create",
      entityType: "landing_page",
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
    return { success: false, error: "Failed to duplicate landing page" };
  }
}

export async function trashLandingPage(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);
    await emptyOldTrash();

    const [existing] = await getDb()
      .select()
      .from(landingPages)
      .where(eq(landingPages.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Landing page not found" };
    }

    if (!canEditEntity(session, { authorId: existing.authorId })) {
      return { success: false, error: "Forbidden" };
    }

    await getDb()
      .update(landingPages)
      .set({ status: "trashed", updatedAt: new Date() })
      .where(eq(landingPages.id, id));

    revalidateLandingPaths(
      existing.path ?? pathForSlug(existing.slug),
      existing.slug,
    );

    await audit({
      action: "delete",
      entityType: "landing_page",
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

export async function restoreLandingPage(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    const [existing] = await getDb()
      .select()
      .from(landingPages)
      .where(eq(landingPages.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Landing page not found" };
    }

    if (!canEditEntity(session, { authorId: existing.authorId })) {
      return { success: false, error: "Forbidden" };
    }

    await getDb()
      .update(landingPages)
      .set({ status: "draft", updatedAt: new Date() })
      .where(eq(landingPages.id, id));

    revalidateLandingPaths(
      existing.path ?? pathForSlug(existing.slug),
      existing.slug,
    );

    await audit({
      action: "update",
      entityType: "landing_page",
      entityId: id,
      meta: { restored: true, slug: existing.slug },
    });

    return { success: true, id: existing.id, slug: existing.slug };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to restore landing page" };
  }
}

export async function deleteLandingPagePermanently(
  id: string,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    const [existing] = await getDb()
      .select()
      .from(landingPages)
      .where(eq(landingPages.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Landing page not found" };
    }

    if (existing.status !== "trashed") {
      return {
        success: false,
        error: "Only trashed landing pages can be deleted permanently",
      };
    }

    if (!canEditEntity(session, { authorId: existing.authorId })) {
      return { success: false, error: "Forbidden" };
    }

    await getDb().delete(landingPages).where(eq(landingPages.id, id));
    await getDb()
      .delete(revisions)
      .where(
        and(
          eq(revisions.entityType, "landing_page"),
          eq(revisions.entityId, id),
        ),
      );

    revalidateLandingPaths(
      existing.path ?? pathForSlug(existing.slug),
      existing.slug,
    );

    await audit({
      action: "delete",
      entityType: "landing_page",
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

export async function bulkUpdateLandingPages(
  input: z.input<typeof bulkSchema>,
): Promise<BulkResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);
    const parsed = bulkSchema.parse(input);
    await emptyOldTrash();

    const rows = await getDb()
      .select()
      .from(landingPages)
      .where(inArray(landingPages.id, parsed.ids));

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
          .update(landingPages)
          .set({
            status: "published",
            publishedAt: row.publishedAt ?? now,
            scheduledFor: null,
            updatedAt: now,
          })
          .where(eq(landingPages.id, row.id));
        await notifyIndexNow(
          absoluteUrl(row.path ?? pathForSlug(row.slug)),
        );
        countDone += 1;
      } else if (parsed.action === "trash") {
        await getDb()
          .update(landingPages)
          .set({ status: "trashed", updatedAt: now })
          .where(eq(landingPages.id, row.id));
        countDone += 1;
      } else if (parsed.action === "restore") {
        if (row.status !== "trashed") continue;
        await getDb()
          .update(landingPages)
          .set({ status: "draft", updatedAt: now })
          .where(eq(landingPages.id, row.id));
        countDone += 1;
      } else if (parsed.action === "delete") {
        if (row.status !== "trashed") continue;
        await getDb().delete(landingPages).where(eq(landingPages.id, row.id));
        countDone += 1;
      }
    }

    revalidateTag("landing-pages", "max");
    revalidatePath("/admin/landing-pages");

    await audit({
      action: "update",
      entityType: "landing_page",
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

export async function getLandingPageRevisions(landingPageId: string) {
  try {
    const session = await requireSession();
    requireContentManager(session);

    const [existing] = await getDb()
      .select({ id: landingPages.id })
      .from(landingPages)
      .where(eq(landingPages.id, landingPageId))
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
        and(
          eq(revisions.entityType, "landing_page"),
          eq(revisions.entityId, landingPageId),
        ),
      )
      .orderBy(desc(revisions.createdAt))
      .limit(15);
  } catch {
    return [];
  }
}

export async function restoreLandingPageRevision(
  landingPageId: string,
  revisionId: string,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    const [existing] = await getDb()
      .select()
      .from(landingPages)
      .where(eq(landingPages.id, landingPageId))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Landing page not found" };
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
          eq(revisions.entityType, "landing_page"),
          eq(revisions.entityId, landingPageId),
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
    await assertSlugAvailable(nextSlug, landingPageId);
    const path = pathForSlug(nextSlug);

    await getDb()
      .update(landingPages)
      .set({
        title: typeof snap.title === "string" ? snap.title : existing.title,
        slug: nextSlug,
        path,
        content: snap.content ?? existing.content,
        pageSections: snap.pageSections ?? existing.pageSections,
        heroVisual: snap.heroVisual ?? existing.heroVisual,
        layoutKind:
          typeof snap.layoutKind === "string"
            ? snap.layoutKind
            : existing.layoutKind,
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
      .where(eq(landingPages.id, landingPageId));

    await saveRevision({
      entityType: "landing_page",
      entityId: landingPageId,
      snapshot: { ...existing, restoredFrom: revisionId },
      authorId: session.user.id,
    });

    revalidateLandingPaths(path, nextSlug, existing.path, existing.slug);

    await audit({
      action: "update",
      entityType: "landing_page",
      entityId: landingPageId,
      meta: { restoredRevision: revisionId },
    });

    return { success: true, id: landingPageId, slug: nextSlug, path };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    if (
      error instanceof Error &&
      (error.message.includes("already in use") ||
        error.message.includes("reserved"))
    ) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to restore revision" };
  }
}
