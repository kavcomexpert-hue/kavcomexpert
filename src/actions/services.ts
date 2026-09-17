"use server";

import { beginAdminMutation, RateLimitedError } from "@/lib/admin/mutation-guard";
import {
  applyPublishSeoRules,
  seoDbValues,
  seoInputSchema,
} from "@/lib/admin/seo-schema";
import { requireSession } from "@/lib/admin/session";
import { requireContentManager } from "@/lib/authz";
import { getDb } from "@/lib/db";
import { saveRevision } from "@/lib/db/revisions";
import { revisions, services, user } from "@/lib/db/schema";
import { notifyIndexNow } from "@/lib/indexnow/notify";
import {
  ensureSlugRedirect,
  servicePublicPath,
} from "@/lib/redirects/slug-change";
import {
  servicePageSectionsSchema,
  serviceHeroVisualSchema,
} from "@/lib/services/page-sections";
import { absoluteUrl } from "@/lib/seo/constants";
import { and, desc, eq, inArray, lt, ne } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

const bulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  action: z.enum(["publish", "trash", "restore", "delete"]),
});

const serviceStatusSchema = z.enum([
  "draft",
  "published",
  "scheduled",
  "trashed",
]);

const serviceInputSchema = seoInputSchema
  .extend({
    id: z.string().uuid().optional(),
    slug: z
      .string()
      .trim()
      .min(1)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().trim().min(1),
    shortPitch: z.string().optional(),
    heroVisual: serviceHeroVisualSchema.optional().nullable(),
    pageSections: servicePageSectionsSchema,
    parentId: z.string().uuid().nullable().optional(),
    status: serviceStatusSchema,
    scheduledFor: z.string().datetime().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    applyPublishSeoRules(data, ctx);
    if (data.id && data.parentId && data.parentId === data.id) {
      ctx.addIssue({
        code: "custom",
        message: "A service cannot be its own parent",
        path: ["parentId"],
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

type ActionResult =
  | { success: true; id: string; slug: string }
  | { success: false; error: string };

type BulkResult =
  | { success: true; count: number }
  | { success: false; error: string };

function revalidateService(
  slug: string,
  previousSlug?: string,
  parentSlug?: string | null,
  previousParentSlug?: string | null,
) {
  revalidateTag("services", "max");
  revalidateTag("sitemap", "max");
  revalidatePath("/admin/services");
  revalidatePath(`/services/${slug}`);
  revalidatePath("/sitemap.xml");
  if (parentSlug) {
    revalidatePath(`/services/${parentSlug}/${slug}`);
  }

  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/services/${previousSlug}`);
  }
  if (previousParentSlug && previousSlug) {
    revalidatePath(`/services/${previousParentSlug}/${previousSlug}`);
  }
}

async function emptyOldTrash() {
  const cutoff = new Date(Date.now() - TRASH_RETENTION_MS);
  await getDb()
    .delete(services)
    .where(and(eq(services.status, "trashed"), lt(services.updatedAt, cutoff)));
}

async function resolveParentSlug(
  parentId: string | null | undefined,
): Promise<string | null> {
  if (!parentId) return null;
  const [parent] = await getDb()
    .select({ slug: services.slug })
    .from(services)
    .where(eq(services.id, parentId))
    .limit(1);
  return parent?.slug ?? null;
}

async function ensureUniqueSlug(base: string, excludeId?: string) {
  let candidate = base;
  let n = 2;
  for (;;) {
    const [existing] = await getDb()
      .select({ id: services.id })
      .from(services)
      .where(
        excludeId
          ? and(eq(services.slug, candidate), ne(services.id, excludeId))
          : eq(services.slug, candidate),
      )
      .limit(1);
    if (!existing) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
  }
}

function buildValues(
  parsed: z.infer<typeof serviceInputSchema>,
  now: Date,
) {
  const faqs = parsed.pageSections.faqs.filter(
    (item) => item.question.trim() && item.answer.trim(),
  );
  const deliverables = parsed.pageSections.offerings
    .map((item) => item.title.trim())
    .filter(Boolean);

  const scheduledFor =
    parsed.status === "scheduled" && parsed.scheduledFor
      ? new Date(parsed.scheduledFor)
      : null;

  return {
    slug: parsed.slug,
    name: parsed.name,
    shortPitch: parsed.shortPitch?.trim() || null,
    heroVisual: parsed.heroVisual ?? null,
    pageSections: parsed.pageSections,
    body: null,
    deliverables,
    faqs,
    icon: null,
    parentId: parsed.parentId ?? null,
    status: parsed.status,
    scheduledFor,
    socialTitle: parsed.socialTitle?.trim() || null,
    socialDescription: parsed.socialDescription?.trim() || null,
    noFollow: parsed.noFollow ?? false,
    noArchive: parsed.noArchive ?? false,
    ...seoDbValues(parsed, {
      title: parsed.name,
      description: parsed.shortPitch,
    }),
    updatedAt: now,
  };
}

export async function checkServiceSlugAvailable(
  slug: string,
  excludeId?: string,
): Promise<{ available: boolean }> {
  try {
    await beginAdminMutation();
    const cleaned = slug.trim();
    if (!cleaned) return { available: false };
    const [existing] = await getDb()
      .select({ id: services.id })
      .from(services)
      .where(
        excludeId
          ? and(eq(services.slug, cleaned), ne(services.id, excludeId))
          : eq(services.slug, cleaned),
      )
      .limit(1);
    return { available: !existing };
  } catch {
    return { available: false };
  }
}

export async function saveService(
  input: z.input<typeof serviceInputSchema>,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);
    await emptyOldTrash();

    const parsed = serviceInputSchema.parse(input);
    const now = new Date();
    const values = buildValues(parsed, now);

    if (parsed.id) {
      const [existing] = await getDb()
        .select()
        .from(services)
        .where(eq(services.id, parsed.id))
        .limit(1);

      if (!existing) {
        return { success: false, error: "Service not found" };
      }

      const parentSlug = await resolveParentSlug(values.parentId);
      const previousParentSlug = await resolveParentSlug(existing.parentId);

      const publishedAt =
        parsed.status === "published"
          ? (existing.publishedAt ?? now)
          : parsed.status === "scheduled"
            ? existing.publishedAt
            : parsed.status === "trashed"
              ? existing.publishedAt
              : null;

      await getDb()
        .update(services)
        .set({ ...values, publishedAt })
        .where(eq(services.id, parsed.id));

      await saveRevision({
        entityType: "service",
        entityId: parsed.id,
        snapshot: { ...existing, ...values, publishedAt },
        authorId: session.user.id,
      });

      const oldPath = servicePublicPath(existing.slug, previousParentSlug);
      const newPath = servicePublicPath(parsed.slug, parentSlug);
      const pathChanged = oldPath !== newPath;
      const wasOrIsPublished =
        existing.status === "published" || parsed.status === "published";

      if (wasOrIsPublished && pathChanged) {
        await ensureSlugRedirect(oldPath, newPath);
      }

      revalidateService(
        parsed.slug,
        existing.slug,
        parentSlug,
        previousParentSlug,
      );

      let indexNow = undefined as Awaited<
        ReturnType<typeof notifyIndexNow>
      > | undefined;
      if (parsed.status === "published") {
        indexNow = await notifyIndexNow(absoluteUrl(newPath));
      }

      await audit({
        action: "update",
        entityType: "service",
        entityId: parsed.id,
        meta: {
          slug: parsed.slug,
          status: parsed.status,
          parentId: values.parentId,
          indexNow,
        },
      });

      return { success: true, id: parsed.id, slug: parsed.slug };
    }

    const [maxOrder] = await getDb()
      .select({ sortOrder: services.sortOrder })
      .from(services)
      .orderBy(desc(services.sortOrder))
      .limit(1);

    const [created] = await getDb()
      .insert(services)
      .values({
        ...values,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
        publishedAt: parsed.status === "published" ? now : null,
      })
      .returning({ id: services.id, slug: services.slug });

    await saveRevision({
      entityType: "service",
      entityId: created.id,
      snapshot: {
        ...values,
        id: created.id,
        publishedAt: parsed.status === "published" ? now : null,
      },
      authorId: session.user.id,
    });

    const parentSlug = await resolveParentSlug(values.parentId);
    revalidateService(created.slug, undefined, parentSlug);

    let indexNow = undefined as Awaited<
      ReturnType<typeof notifyIndexNow>
    > | undefined;
    if (parsed.status === "published") {
      indexNow = await notifyIndexNow(
        absoluteUrl(servicePublicPath(created.slug, parentSlug)),
      );
    }

    await audit({
      action: "create",
      entityType: "service",
      entityId: created.id,
      meta: {
        slug: created.slug,
        status: parsed.status,
        parentId: values.parentId,
        indexNow,
      },
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

    if (error instanceof Error && error.message.includes("schema JSON")) {
      return { success: false, error: error.message };
    }

    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return { success: false, error: error.message };
    }

    if (
      error instanceof Error &&
      error.message.includes("unique constraint")
    ) {
      return { success: false, error: "That slug is already in use" };
    }

    return { success: false, error: "Failed to save service" };
  }
}

/**
 * Autosave: always writes a revision. Updates the service row only when not
 * published (so live published content is never overwritten until Update).
 */
export async function autosaveService(
  input: z.input<typeof serviceInputSchema> & { id: string },
): Promise<ActionResult> {
  try {
    const { session } = await beginAdminMutation();
    requireContentManager(session);
    const parsed = serviceInputSchema.parse({
      ...input,
      status: input.status ?? "draft",
    });
    if (!parsed.id) {
      return { success: false, error: "Service id required for autosave" };
    }

    const [existing] = await getDb()
      .select()
      .from(services)
      .where(eq(services.id, parsed.id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Service not found" };
    }

    const now = new Date();
    const values = buildValues(
      {
        ...parsed,
        status: existing.status as z.infer<typeof serviceStatusSchema>,
      },
      now,
    );

    const snapshot = {
      ...values,
      id: existing.id,
      status: existing.status,
      publishedAt: existing.publishedAt,
      scheduledFor: existing.scheduledFor,
    };

    await saveRevision({
      entityType: "service",
      entityId: existing.id,
      snapshot,
      authorId: session.user.id,
    });

    if (existing.status !== "published") {
      await getDb()
        .update(services)
        .set({
          ...values,
          status: existing.status,
          publishedAt: existing.publishedAt,
          scheduledFor: existing.scheduledFor,
        })
        .where(eq(services.id, existing.id));
    }

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
    if (
      error instanceof Error &&
      error.message.includes("unique constraint")
    ) {
      return { success: false, error: "That slug is already in use" };
    }
    return { success: false, error: "Autosave failed" };
  }
}

export async function duplicateService(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    const [existing] = await getDb()
      .select()
      .from(services)
      .where(eq(services.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Service not found" };
    }

    const slug = await ensureUniqueSlug(`${existing.slug}-copy`);
    const now = new Date();

    const [maxOrder] = await getDb()
      .select({ sortOrder: services.sortOrder })
      .from(services)
      .orderBy(desc(services.sortOrder))
      .limit(1);

    const [created] = await getDb()
      .insert(services)
      .values({
        name: `${existing.name} (Copy)`,
        slug,
        shortPitch: existing.shortPitch,
        body: existing.body,
        pageSections: existing.pageSections,
        heroVisual: existing.heroVisual,
        deliverables: existing.deliverables,
        faqs: existing.faqs,
        icon: existing.icon,
        parentId: existing.parentId,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
        status: "draft",
        publishedAt: null,
        scheduledFor: null,
        focusKeyword: existing.focusKeyword,
        secondaryKeywords: existing.secondaryKeywords,
        metaTitle: existing.metaTitle,
        metaDescription: existing.metaDescription,
        canonicalUrl: null,
        ogImage: existing.ogImage,
        schemaType: existing.schemaType,
        schemaJson: existing.schemaJson,
        noIndex: true,
        socialTitle: existing.socialTitle,
        socialDescription: existing.socialDescription,
        noFollow: existing.noFollow,
        noArchive: existing.noArchive,
        sitemapInclude: existing.sitemapInclude,
        sitemapPriority: existing.sitemapPriority,
        updatedAt: now,
      })
      .returning({ id: services.id, slug: services.slug });

    const parentSlug = await resolveParentSlug(existing.parentId);
    revalidateService(created.slug, undefined, parentSlug);

    await audit({
      action: "create",
      entityType: "service",
      entityId: created.id,
      meta: { duplicatedFrom: id, slug: created.slug },
    });

    return { success: true, id: created.id, slug: created.slug };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to duplicate service" };
  }
}

export async function trashService(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);
    await emptyOldTrash();

    const [existing] = await getDb()
      .select()
      .from(services)
      .where(eq(services.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Service not found" };
    }

    await getDb()
      .update(services)
      .set({ status: "trashed", updatedAt: new Date() })
      .where(eq(services.id, id));

    const parentSlug = await resolveParentSlug(existing.parentId);
    revalidateService(existing.slug, undefined, parentSlug);

    await audit({
      action: "delete",
      entityType: "service",
      entityId: id,
      meta: { soft: true, slug: existing.slug },
    });

    return { success: true, id: existing.id, slug: existing.slug };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to move to trash" };
  }
}

export async function restoreService(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    const [existing] = await getDb()
      .select()
      .from(services)
      .where(eq(services.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Service not found" };
    }

    await getDb()
      .update(services)
      .set({ status: "draft", updatedAt: new Date() })
      .where(eq(services.id, id));

    const parentSlug = await resolveParentSlug(existing.parentId);
    revalidateService(existing.slug, undefined, parentSlug);
    revalidatePath("/admin/services");

    await audit({
      action: "update",
      entityType: "service",
      entityId: id,
      meta: { restored: true, slug: existing.slug },
    });

    return { success: true, id: existing.id, slug: existing.slug };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to restore service" };
  }
}

export async function deleteServicePermanently(
  id: string,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    const [existing] = await getDb()
      .select()
      .from(services)
      .where(eq(services.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Service not found" };
    }

    if (existing.status !== "trashed") {
      return {
        success: false,
        error: "Only trashed services can be deleted permanently",
      };
    }

    await getDb().delete(services).where(eq(services.id, id));
    await getDb()
      .delete(revisions)
      .where(
        and(
          eq(revisions.entityType, "service"),
          eq(revisions.entityId, id),
        ),
      );

    const parentSlug = await resolveParentSlug(existing.parentId);
    revalidateService(existing.slug, undefined, parentSlug);

    await audit({
      action: "delete",
      entityType: "service",
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

export async function bulkUpdateServices(
  input: z.input<typeof bulkSchema>,
): Promise<BulkResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);
    const parsed = bulkSchema.parse(input);
    await emptyOldTrash();

    const rows = await getDb()
      .select()
      .from(services)
      .where(inArray(services.id, parsed.ids));

    let countDone = 0;
    const now = new Date();

    for (const row of rows) {
      if (parsed.action === "publish") {
        if (!row.metaTitle?.trim() || !row.metaDescription?.trim()) {
          continue;
        }

        await getDb()
          .update(services)
          .set({
            status: "published",
            publishedAt: row.publishedAt ?? now,
            scheduledFor: null,
            updatedAt: now,
          })
          .where(eq(services.id, row.id));

        const parentSlug = await resolveParentSlug(row.parentId);
        await notifyIndexNow(
          absoluteUrl(servicePublicPath(row.slug, parentSlug)),
        );
        countDone += 1;
      } else if (parsed.action === "trash") {
        await getDb()
          .update(services)
          .set({ status: "trashed", updatedAt: now })
          .where(eq(services.id, row.id));
        countDone += 1;
      } else if (parsed.action === "restore") {
        if (row.status !== "trashed") continue;
        await getDb()
          .update(services)
          .set({ status: "draft", updatedAt: now })
          .where(eq(services.id, row.id));
        countDone += 1;
      } else if (parsed.action === "delete") {
        if (row.status !== "trashed") continue;
        await getDb().delete(services).where(eq(services.id, row.id));
        countDone += 1;
      }
    }

    revalidateTag("services", "max");
    revalidateTag("sitemap", "max");
    revalidatePath("/admin/services");
    revalidatePath("/services");

    await audit({
      action: "update",
      entityType: "service",
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

export async function reorderServices(
  orderedIds: string[],
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    await Promise.all(
      orderedIds.map((id, index) =>
        getDb()
          .update(services)
          .set({ sortOrder: index, updatedAt: new Date() })
          .where(eq(services.id, id)),
      ),
    );

    revalidateTag("services", "max");
    revalidatePath("/admin/services");
    revalidatePath("/services");

    await audit({
      action: "reorder",
      entityType: "service",
      meta: { count: orderedIds.length },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to reorder services" };
  }
}

export async function getServiceRevisions(serviceId: string) {
  try {
    const session = await requireSession();
    requireContentManager(session);

    const [existing] = await getDb()
      .select({ id: services.id })
      .from(services)
      .where(eq(services.id, serviceId))
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
          eq(revisions.entityType, "service"),
          eq(revisions.entityId, serviceId),
        ),
      )
      .orderBy(desc(revisions.createdAt))
      .limit(15);
  } catch {
    return [];
  }
}

export async function restoreServiceRevision(
  serviceId: string,
  revisionId: string,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    const [existing] = await getDb()
      .select()
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Service not found" };
    }

    const [rev] = await getDb()
      .select()
      .from(revisions)
      .where(
        and(
          eq(revisions.id, revisionId),
          eq(revisions.entityType, "service"),
          eq(revisions.entityId, serviceId),
        ),
      )
      .limit(1);

    if (!rev) {
      return { success: false, error: "Revision not found" };
    }

    const snap = rev.snapshot as Record<string, unknown>;
    const now = new Date();

    await getDb()
      .update(services)
      .set({
        name: typeof snap.name === "string" ? snap.name : existing.name,
        slug: typeof snap.slug === "string" ? snap.slug : existing.slug,
        shortPitch: (snap.shortPitch as string | null) ?? existing.shortPitch,
        heroVisual: snap.heroVisual ?? existing.heroVisual,
        pageSections: snap.pageSections ?? existing.pageSections,
        deliverables: snap.deliverables ?? existing.deliverables,
        faqs: snap.faqs ?? existing.faqs,
        parentId: (snap.parentId as string | null) ?? existing.parentId,
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
        secondaryKeywords:
          (snap.secondaryKeywords as string | null) ??
          existing.secondaryKeywords,
        ogImage: (snap.ogImage as string | null) ?? existing.ogImage,
        canonicalUrl:
          (snap.canonicalUrl as string | null) ?? existing.canonicalUrl,
        schemaType:
          typeof snap.schemaType === "string"
            ? snap.schemaType
            : existing.schemaType,
        schemaJson: snap.schemaJson ?? existing.schemaJson,
        socialTitle: (snap.socialTitle as string | null) ?? existing.socialTitle,
        socialDescription:
          (snap.socialDescription as string | null) ?? existing.socialDescription,
        noIndex:
          typeof snap.noIndex === "boolean" ? snap.noIndex : existing.noIndex,
        noFollow:
          typeof snap.noFollow === "boolean" ? snap.noFollow : existing.noFollow,
        noArchive:
          typeof snap.noArchive === "boolean"
            ? snap.noArchive
            : existing.noArchive,
        sitemapInclude:
          typeof snap.sitemapInclude === "boolean"
            ? snap.sitemapInclude
            : existing.sitemapInclude,
        sitemapPriority:
          typeof snap.sitemapPriority === "string"
            ? snap.sitemapPriority
            : existing.sitemapPriority,
        updatedAt: now,
        status: existing.status,
        publishedAt: existing.publishedAt,
        scheduledFor: existing.scheduledFor,
      })
      .where(eq(services.id, serviceId));

    await saveRevision({
      entityType: "service",
      entityId: serviceId,
      snapshot: { ...existing, restoredFrom: revisionId },
      authorId: session.user.id,
    });

    const parentSlug = await resolveParentSlug(existing.parentId);
    revalidateService(existing.slug, undefined, parentSlug);

    await audit({
      action: "update",
      entityType: "service",
      entityId: serviceId,
      meta: { restoredRevision: revisionId },
    });

    return { success: true, id: serviceId, slug: existing.slug };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to restore revision" };
  }
}
