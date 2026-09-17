"use server";

import {
  applyPublishSeoRules,
  seoDbValues,
  seoInputSchema,
} from "@/lib/admin/seo-schema";
import { beginAdminMutation, RateLimitedError } from "@/lib/admin/mutation-guard";
import { requireSession } from "@/lib/admin/session";
import { canEditEntity, assertCanDeleteContent, assertCanSetStatus, canAccessOwnedContent, canPublish } from "@/lib/authz";
import { getDb } from "@/lib/db";
import { saveRevision } from "@/lib/db/revisions";
import { caseStudies, revisions, user } from "@/lib/db/schema";
import { notifyIndexNow } from "@/lib/indexnow/notify";
import {
  caseStudyPublicPath,
  ensureSlugRedirect,
} from "@/lib/redirects/slug-change";
import { absoluteUrl } from "@/lib/seo/constants";
import { and, desc, eq, inArray, lt, ne } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

const galleryItemSchema = z.object({
  url: z.string().trim().min(1),
  alt: z.string().optional(),
});

const sectionLabelsSchema = z
  .object({
    backLink: z.string().optional(),
    visitSite: z.string().optional(),
    clientCardClientLabel: z.string().optional(),
    clientCardIndustryLabel: z.string().optional(),
    clientCardServicesLabel: z.string().optional(),
    clientCardLocationLabel: z.string().optional(),
    clientCardPlatformLabel: z.string().optional(),
    clientCardEngagementLabel: z.string().optional(),
    challengeEyebrow: z.string().optional(),
    challengeHeadline: z.string().optional(),
    approachEyebrow: z.string().optional(),
    approachHeadline: z.string().optional(),
    solutionEyebrow: z.string().optional(),
    solutionHeadline: z.string().optional(),
    clientNoticedEyebrow: z.string().optional(),
    clientNoticedHeadline: z.string().optional(),
    galleryEyebrow: z.string().optional(),
    galleryHeadline: z.string().optional(),
    feedbackEyebrow: z.string().optional(),
  })
  .optional()
  .nullable();

const clientQuoteSchema = z
  .object({
    quote: z.string().trim().min(1),
    name: z.string().trim().min(1),
    role: z.string().trim().optional(),
    videoUrl: z.string().trim().optional().nullable(),
  })
  .optional()
  .nullable();

const caseStudyStatusSchema = z.enum([
  "draft",
  "published",
  "scheduled",
  "trashed",
]);

const caseStudyInputSchema = seoInputSchema
  .extend({
    id: z.string().uuid().optional(),
    slug: z
      .string()
      .trim()
      .min(1)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    client: z.string().trim().min(1),
    pageHeading: z.string().optional(),
    industry: z.string().optional(),
    website: z.string().optional(),
    engagementType: z.string().optional(),
    servicesProvided: z.string().optional(),
    location: z.string().optional(),
    platformStack: z.string().optional(),
    infoHeadlineLabel: z.string().optional(),
    infoHeadlineValue: z.string().optional(),
    challenge: z.string().optional(),
    challengeMedia: z.string().optional(),
    approach: z.unknown().optional(),
    approachMedia: z.string().optional(),
    solution: z.unknown(),
    solutionMedia: z.string().optional(),
    clientNoticed: z.unknown().optional(),
    clientNoticedMedia: z.string().optional(),
    sectionLabels: sectionLabelsSchema,
    gallery: z.array(galleryItemSchema).default([]),
    clientQuote: clientQuoteSchema,
    serviceSlugs: z.array(z.string().trim().min(1)).default([]),
    status: caseStudyStatusSchema,
    scheduledFor: z.string().datetime().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "published" || data.status === "scheduled") {
      applyPublishSeoRules({ ...data, status: "published" }, ctx);
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
  client: z.string().trim().min(1),
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
  | { success: true; id: string; slug: string }
  | { success: false; error: string };

type BulkResult =
  | { success: true; count: number }
  | { success: false; error: string };

function revalidateCaseStudy(slug: string, previousSlug?: string) {
  revalidateTag("case-studies", "max");
  revalidateTag("sitemap", "max");
  revalidatePath("/admin/case-studies");
  revalidatePath("/work");
  revalidatePath(`/work/${slug}`);
  revalidatePath(`/case-studies/${slug}`);
  revalidatePath("/sitemap.xml");

  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/work/${previousSlug}`);
    revalidatePath(`/case-studies/${previousSlug}`);
  }
}

async function emptyOldTrash() {
  const cutoff = new Date(Date.now() - TRASH_RETENTION_MS);
  await getDb()
    .delete(caseStudies)
    .where(
      and(eq(caseStudies.status, "trashed"), lt(caseStudies.updatedAt, cutoff)),
    );
}

async function ensureUniqueSlug(base: string, excludeId?: string) {
  let candidate = base;
  let n = 2;
  for (;;) {
    const [existing] = await getDb()
      .select({ id: caseStudies.id })
      .from(caseStudies)
      .where(
        excludeId
          ? and(eq(caseStudies.slug, candidate), ne(caseStudies.id, excludeId))
          : eq(caseStudies.slug, candidate),
      )
      .limit(1);
    if (!existing) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
  }
}

function buildValues(
  parsed: z.infer<typeof caseStudyInputSchema>,
  now: Date,
  authorId: string,
) {
  const scheduledFor =
    parsed.status === "scheduled" && parsed.scheduledFor
      ? new Date(parsed.scheduledFor)
      : null;

  const quote = parsed.clientQuote
    ? {
        quote: parsed.clientQuote.quote,
        name: parsed.clientQuote.name,
        role: parsed.clientQuote.role?.trim() || undefined,
        videoUrl: parsed.clientQuote.videoUrl?.trim() || null,
      }
    : null;

  const sectionLabels = parsed.sectionLabels
    ? Object.fromEntries(
        Object.entries(parsed.sectionLabels).flatMap(([key, value]) => {
          if (typeof value !== "string") return [];
          const trimmed = value.trim();
          return trimmed ? [[key, trimmed]] : [];
        }),
      )
    : null;

  return {
    slug: parsed.slug,
    client: parsed.client,
    pageHeading: parsed.pageHeading?.trim() || null,
    industry: parsed.industry?.trim() || null,
    website: parsed.website?.trim() || null,
    engagementType: parsed.engagementType?.trim() || null,
    servicesProvided: parsed.servicesProvided?.trim() || null,
    location: parsed.location?.trim() || null,
    platformStack: parsed.platformStack?.trim() || null,
    infoHeadlineLabel: parsed.infoHeadlineLabel?.trim() || null,
    infoHeadlineValue: parsed.infoHeadlineValue?.trim() || null,
    infoDetails: null,
    challenge: parsed.challenge?.trim() || null,
    challengeMedia: parsed.challengeMedia?.trim() || null,
    approach: parsed.approach ?? null,
    approachMedia: parsed.approachMedia?.trim() || null,
    solution: parsed.solution,
    solutionMedia: parsed.solutionMedia?.trim() || null,
    clientNoticed: parsed.clientNoticed ?? null,
    clientNoticedMedia: parsed.clientNoticedMedia?.trim() || null,
    sectionLabels:
      sectionLabels && Object.keys(sectionLabels).length > 0
        ? sectionLabels
        : null,
    gallery: parsed.gallery,
    clientQuote: quote,
    serviceSlugs: parsed.serviceSlugs,
    status: parsed.status,
    scheduledFor,
    authorId,
    updatedAt: now,
    ...seoDbValues(parsed, {
      title: parsed.client,
      description: parsed.challenge,
    }),
  };
}

export async function checkCaseStudySlugAvailable(
  slug: string,
  excludeId?: string,
): Promise<{ available: boolean }> {
  try {
    await beginAdminMutation();
    const cleaned = slug.trim();
    if (!cleaned) return { available: false };
    const [existing] = await getDb()
      .select({ id: caseStudies.id })
      .from(caseStudies)
      .where(
        excludeId
          ? and(eq(caseStudies.slug, cleaned), ne(caseStudies.id, excludeId))
          : eq(caseStudies.slug, cleaned),
      )
      .limit(1);
    return { available: !existing };
  } catch {
    return { available: false };
  }
}

export async function saveCaseStudy(
  input: z.input<typeof caseStudyInputSchema>,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }
    await emptyOldTrash();

    const parsed = caseStudyInputSchema.parse(input);
    try {
      assertCanSetStatus(session, parsed.status);
    } catch {
      return { success: false, error: "Forbidden" };
    }
    const now = new Date();

    if (parsed.id) {
      const [existing] = await getDb()
        .select()
        .from(caseStudies)
        .where(eq(caseStudies.id, parsed.id))
        .limit(1);

      if (!existing) {
        return { success: false, error: "Case study not found" };
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
        .update(caseStudies)
        .set({ ...values, publishedAt })
        .where(eq(caseStudies.id, parsed.id));

      await saveRevision({
        entityType: "case_study",
        entityId: parsed.id,
        snapshot: { ...existing, ...values, publishedAt },
        authorId: session.user.id,
      });

      revalidateCaseStudy(parsed.slug, existing.slug);

      if (
        parsed.status === "published" &&
        existing.slug !== parsed.slug
      ) {
        await ensureSlugRedirect(
          caseStudyPublicPath(existing.slug),
          caseStudyPublicPath(parsed.slug),
        );
      }

      let indexNow = undefined as Awaited<
        ReturnType<typeof notifyIndexNow>
      > | undefined;
      if (parsed.status === "published") {
        indexNow = await notifyIndexNow(absoluteUrl(`/work/${parsed.slug}`));
      }

      await audit({
        action: "update",
        entityType: "case_study",
        entityId: parsed.id,
        meta: { slug: parsed.slug, status: parsed.status, indexNow },
      });

      return { success: true, id: parsed.id, slug: parsed.slug };
    }

    const values = buildValues(parsed, now, session.user.id);

    const [created] = await getDb()
      .insert(caseStudies)
      .values({
        ...values,
        publishedAt: parsed.status === "published" ? now : null,
      })
      .returning({ id: caseStudies.id, slug: caseStudies.slug });

    await saveRevision({
      entityType: "case_study",
      entityId: created.id,
      snapshot: {
        ...values,
        id: created.id,
        publishedAt: parsed.status === "published" ? now : null,
      },
      authorId: session.user.id,
    });

    revalidateCaseStudy(created.slug);

    let indexNow = undefined as Awaited<
      ReturnType<typeof notifyIndexNow>
    > | undefined;
    if (parsed.status === "published") {
      indexNow = await notifyIndexNow(absoluteUrl(`/work/${created.slug}`));
    }

    await audit({
      action: "create",
      entityType: "case_study",
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

    return { success: false, error: "Failed to save case study" };
  }
}

/**
 * Autosave: always writes a revision. Updates the row only when not published
 * (so live published content is never overwritten until Update is clicked).
 */
export async function autosaveCaseStudy(
  input: z.input<typeof caseStudyInputSchema> & { id: string },
): Promise<ActionResult> {
  try {
    const { session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }
    const parsed = caseStudyInputSchema.parse({
      ...input,
      status: input.status ?? "draft",
    });
    if (!parsed.id) {
      return { success: false, error: "Case study id required for autosave" };
    }

    const [existing] = await getDb()
      .select()
      .from(caseStudies)
      .where(eq(caseStudies.id, parsed.id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Case study not found" };
    }

    if (!canEditEntity(session, { authorId: existing.authorId })) {
      return { success: false, error: "Forbidden" };
    }

    const now = new Date();
    const snapshot = {
      ...buildValues(
        {
          ...parsed,
          status: existing.status as z.infer<typeof caseStudyStatusSchema>,
        },
        now,
        session.user.id,
      ),
      id: existing.id,
      status: existing.status,
      publishedAt: existing.publishedAt,
      scheduledFor: existing.scheduledFor,
    };

    await saveRevision({
      entityType: "case_study",
      entityId: existing.id,
      snapshot,
      authorId: session.user.id,
    });

    if (existing.status !== "published") {
      const values = buildValues(
        {
          ...parsed,
          status:
            (existing.status as z.infer<typeof caseStudyStatusSchema>) ||
            "draft",
        },
        now,
        session.user.id,
      );
      await getDb()
        .update(caseStudies)
        .set({
          ...values,
          status: existing.status,
          publishedAt: existing.publishedAt,
          scheduledFor: existing.scheduledFor,
        })
        .where(eq(caseStudies.id, existing.id));
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
    return { success: false, error: "Autosave failed" };
  }
}

export async function quickEditCaseStudy(
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
      .from(caseStudies)
      .where(eq(caseStudies.id, parsed.id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Case study not found" };
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
      .update(caseStudies)
      .set({
        client: parsed.client,
        slug: parsed.slug,
        status: parsed.status,
        publishedAt,
        updatedAt: now,
      })
      .where(eq(caseStudies.id, parsed.id));

    revalidateCaseStudy(parsed.slug, existing.slug);

    await audit({
      action: "update",
      entityType: "case_study",
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

export async function duplicateCaseStudy(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }
    const [existing] = await getDb()
      .select()
      .from(caseStudies)
      .where(eq(caseStudies.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Case study not found" };
    }

    const slug = await ensureUniqueSlug(`${existing.slug}-copy`);
    const now = new Date();

    const [created] = await getDb()
      .insert(caseStudies)
      .values({
        client: `${existing.client} (Copy)`,
        slug,
        pageHeading: existing.pageHeading,
        industry: existing.industry,
        website: existing.website,
        engagementType: existing.engagementType,
        servicesProvided: existing.servicesProvided,
        location: existing.location,
        platformStack: existing.platformStack,
        infoHeadlineLabel: existing.infoHeadlineLabel,
        infoHeadlineValue: existing.infoHeadlineValue,
        infoDetails: null,
        challenge: existing.challenge,
        challengeMedia: existing.challengeMedia,
        approach: existing.approach,
        approachMedia: existing.approachMedia,
        solution: existing.solution,
        solutionMedia: existing.solutionMedia,
        clientNoticed: existing.clientNoticed,
        clientNoticedMedia: existing.clientNoticedMedia,
        sectionLabels: existing.sectionLabels,
        gallery: existing.gallery,
        clientQuote: existing.clientQuote,
        serviceSlugs: existing.serviceSlugs,
        status: "draft",
        publishedAt: null,
        scheduledFor: null,
        authorId: session.user.id,
        focusKeyword: existing.focusKeyword,
        metaTitle: existing.metaTitle,
        metaDescription: existing.metaDescription,
        canonicalUrl: null,
        ogImage: existing.ogImage,
        schemaType: existing.schemaType,
        noIndex: true,
        sitemapInclude: existing.sitemapInclude,
        sitemapPriority: existing.sitemapPriority,
        updatedAt: now,
      })
      .returning({ id: caseStudies.id, slug: caseStudies.slug });

    revalidateCaseStudy(created.slug);

    await audit({
      action: "create",
      entityType: "case_study",
      entityId: created.id,
      meta: { duplicatedFrom: id, slug: created.slug },
    });

    return { success: true, id: created.id, slug: created.slug };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to duplicate case study" };
  }
}

export async function trashCaseStudy(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }
    await emptyOldTrash();

    const [existing] = await getDb()
      .select()
      .from(caseStudies)
      .where(eq(caseStudies.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Case study not found" };
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
      .update(caseStudies)
      .set({ status: "trashed", updatedAt: new Date() })
      .where(eq(caseStudies.id, id));

    revalidateCaseStudy(existing.slug);

    await audit({
      action: "delete",
      entityType: "case_study",
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

export async function restoreCaseStudy(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }

    const [existing] = await getDb()
      .select()
      .from(caseStudies)
      .where(eq(caseStudies.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Case study not found" };
    }

    if (!canEditEntity(session, { authorId: existing.authorId })) {
      return { success: false, error: "Forbidden" };
    }

    await getDb()
      .update(caseStudies)
      .set({ status: "draft", updatedAt: new Date() })
      .where(eq(caseStudies.id, id));

    revalidateCaseStudy(existing.slug);

    await audit({
      action: "update",
      entityType: "case_study",
      entityId: id,
      meta: { restored: true, slug: existing.slug },
    });

    return { success: true, id: existing.id, slug: existing.slug };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to restore case study" };
  }
}

export async function deleteCaseStudyPermanently(
  id: string,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }

    const [existing] = await getDb()
      .select()
      .from(caseStudies)
      .where(eq(caseStudies.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Case study not found" };
    }

    if (existing.status !== "trashed") {
      return {
        success: false,
        error: "Only trashed case studies can be deleted permanently",
      };
    }

    if (!canEditEntity(session, { authorId: existing.authorId })) {
      return { success: false, error: "Forbidden" };
    }

    await getDb().delete(caseStudies).where(eq(caseStudies.id, id));
    await getDb()
      .delete(revisions)
      .where(
        and(
          eq(revisions.entityType, "case_study"),
          eq(revisions.entityId, id),
        ),
      );

    revalidateCaseStudy(existing.slug);

    await audit({
      action: "delete",
      entityType: "case_study",
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

export async function bulkUpdateCaseStudies(
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
      .from(caseStudies)
      .where(inArray(caseStudies.id, parsed.ids));

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
        if (!row.metaTitle?.trim() || !row.metaDescription?.trim()) {
          continue;
        }

        await getDb()
          .update(caseStudies)
          .set({
            status: "published",
            publishedAt: row.publishedAt ?? now,
            scheduledFor: null,
            updatedAt: now,
          })
          .where(eq(caseStudies.id, row.id));
        await notifyIndexNow(absoluteUrl(`/work/${row.slug}`));
        countDone += 1;
      } else if (parsed.action === "trash") {
        try {
          assertCanDeleteContent(session, row.status);
        } catch {
          continue;
        }
        await getDb()
          .update(caseStudies)
          .set({ status: "trashed", updatedAt: now })
          .where(eq(caseStudies.id, row.id));
        countDone += 1;
      } else if (parsed.action === "restore") {
        if (row.status !== "trashed") continue;
        await getDb()
          .update(caseStudies)
          .set({ status: "draft", updatedAt: now })
          .where(eq(caseStudies.id, row.id));
        countDone += 1;
      } else if (parsed.action === "delete") {
        if (row.status !== "trashed") continue;
        await getDb().delete(caseStudies).where(eq(caseStudies.id, row.id));
        countDone += 1;
      }
    }

    revalidateTag("case-studies", "max");
    revalidatePath("/admin/case-studies");
    revalidatePath("/work");

    await audit({
      action: "update",
      entityType: "case_study",
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

export async function getCaseStudyRevisions(caseStudyId: string) {
  try {
    const session = await requireSession();
    if (!canAccessOwnedContent(session)) {
      return [];
    }

    const [existing] = await getDb()
      .select({ authorId: caseStudies.authorId })
      .from(caseStudies)
      .where(eq(caseStudies.id, caseStudyId))
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
        and(
          eq(revisions.entityType, "case_study"),
          eq(revisions.entityId, caseStudyId),
        ),
      )
      .orderBy(desc(revisions.createdAt))
      .limit(15);
  } catch {
    return [];
  }
}

export async function restoreCaseStudyRevision(
  caseStudyId: string,
  revisionId: string,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }

    const [existing] = await getDb()
      .select()
      .from(caseStudies)
      .where(eq(caseStudies.id, caseStudyId))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Case study not found" };
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
          eq(revisions.entityType, "case_study"),
          eq(revisions.entityId, caseStudyId),
        ),
      )
      .limit(1);

    if (!rev) {
      return { success: false, error: "Revision not found" };
    }

    const snap = rev.snapshot as Record<string, unknown>;
    const now = new Date();

    await getDb()
      .update(caseStudies)
      .set({
        client:
          typeof snap.client === "string" ? snap.client : existing.client,
        slug: typeof snap.slug === "string" ? snap.slug : existing.slug,
        pageHeading:
          (snap.pageHeading as string | null) ?? existing.pageHeading,
        industry: (snap.industry as string | null) ?? existing.industry,
        website: (snap.website as string | null) ?? existing.website,
        engagementType:
          (snap.engagementType as string | null) ?? existing.engagementType,
        servicesProvided:
          (snap.servicesProvided as string | null) ?? existing.servicesProvided,
        location: (snap.location as string | null) ?? existing.location,
        platformStack:
          (snap.platformStack as string | null) ?? existing.platformStack,
        infoHeadlineLabel:
          (snap.infoHeadlineLabel as string | null) ??
          existing.infoHeadlineLabel,
        infoHeadlineValue:
          (snap.infoHeadlineValue as string | null) ??
          existing.infoHeadlineValue,
        infoDetails: null,
        challenge: (snap.challenge as string | null) ?? existing.challenge,
        challengeMedia:
          (snap.challengeMedia as string | null) ?? existing.challengeMedia,
        approach: snap.approach ?? existing.approach,
        approachMedia:
          (snap.approachMedia as string | null) ?? existing.approachMedia,
        solution: snap.solution ?? existing.solution,
        solutionMedia:
          (snap.solutionMedia as string | null) ?? existing.solutionMedia,
        clientNoticed: snap.clientNoticed ?? existing.clientNoticed,
        clientNoticedMedia:
          (snap.clientNoticedMedia as string | null) ??
          existing.clientNoticedMedia,
        sectionLabels: snap.sectionLabels ?? existing.sectionLabels,
        gallery: snap.gallery ?? existing.gallery,
        clientQuote: snap.clientQuote ?? existing.clientQuote,
        serviceSlugs:
          (snap.serviceSlugs as string[] | null) ?? existing.serviceSlugs,
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
      .where(eq(caseStudies.id, caseStudyId));

    await saveRevision({
      entityType: "case_study",
      entityId: caseStudyId,
      snapshot: { ...existing, restoredFrom: revisionId },
      authorId: session.user.id,
    });

    revalidateCaseStudy(existing.slug);

    await audit({
      action: "update",
      entityType: "case_study",
      entityId: caseStudyId,
      meta: { restoredRevision: revisionId },
    });

    return { success: true, id: caseStudyId, slug: existing.slug };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to restore revision" };
  }
}
