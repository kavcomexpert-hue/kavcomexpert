"use server";

import { beginAdminMutation, RateLimitedError } from "@/lib/admin/mutation-guard";
import { requireContentManager } from "@/lib/authz";
import { getDb } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

const jobInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  title: z.string().trim().min(1, "Title is required"),
  department: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.enum(["full-time", "part-time", "contract", "remote"]),
  description: z.unknown().optional(),
  requirements: z.string().optional(),
  salaryRange: z.string().optional(),
  status: z.enum(["draft", "published"]),
  sortOrder: z.number().int().default(0),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  noIndex: z.boolean().default(false),
});

type ActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

function revalidateJobs(slugs: Array<string | null | undefined> = []) {
  revalidateTag("jobs", "max");
  revalidatePath("/admin/jobs");
  revalidatePath("/careers");
  // Career detail routes use time-based ISR, so each affected slug must be
  // revalidated explicitly or it can stay stale for up to an hour.
  for (const slug of new Set(slugs)) {
    if (slug) revalidatePath(`/careers/${slug}`);
  }
}

export async function saveJob(
  input: z.input<typeof jobInputSchema>,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);
    const parsed = jobInputSchema.parse(input);

    const values = {
      slug: parsed.slug,
      title: parsed.title,
      department: parsed.department?.trim() || null,
      location: parsed.location?.trim() || null,
      employmentType: parsed.employmentType,
      description: parsed.description ?? null,
      requirements: parsed.requirements?.trim() || null,
      salaryRange: parsed.salaryRange?.trim() || null,
      status: parsed.status,
      sortOrder: parsed.sortOrder,
      metaTitle: parsed.metaTitle?.trim() || null,
      metaDescription: parsed.metaDescription?.trim() || null,
      ogImage: parsed.ogImage?.trim() || null,
      canonicalUrl: parsed.canonicalUrl?.trim() || null,
      noIndex: parsed.noIndex,
      publishedAt:
        parsed.status === "published" ? new Date() : null,
    };

    if (parsed.id) {
      const [existing] = await getDb()
        .select({
          id: jobs.id,
          slug: jobs.slug,
          publishedAt: jobs.publishedAt,
          status: jobs.status,
        })
        .from(jobs)
        .where(eq(jobs.id, parsed.id))
        .limit(1);

      if (!existing) {
        return { success: false, error: "Job not found" };
      }

      const wasPublished = existing.status === "published";
      const isNowPublished = parsed.status === "published";

      await getDb()
        .update(jobs)
        .set({
          ...values,
          publishedAt: isNowPublished
            ? (existing.publishedAt ?? new Date())
            : wasPublished
              ? existing.publishedAt
              : null,
        })
        .where(eq(jobs.id, parsed.id));

      revalidateJobs([existing.slug, parsed.slug]);

      await audit({
        action: "update",
        entityType: "job",
        entityId: parsed.id,
        meta: { slug: parsed.slug, status: parsed.status },
      });

      return { success: true, id: parsed.id };
    }

    const [maxOrder] = await getDb()
      .select({ sortOrder: jobs.sortOrder })
      .from(jobs)
      .orderBy(desc(jobs.sortOrder))
      .limit(1);

    const [created] = await getDb()
      .insert(jobs)
      .values({
        ...values,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
        publishedAt: parsed.status === "published" ? new Date() : null,
      })
      .returning({ id: jobs.id });

    revalidateJobs([parsed.slug]);

    await audit({
      action: "create",
      entityType: "job",
      entityId: created.id,
      meta: { slug: parsed.slug, status: parsed.status },
    });

    return { success: true, id: created.id };
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

    return { success: false, error: "Failed to save job" };
  }
}

export async function deleteJob(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    const [existing] = await getDb()
      .select({ id: jobs.id, slug: jobs.slug })
      .from(jobs)
      .where(eq(jobs.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Job not found" };
    }

    await getDb().delete(jobs).where(eq(jobs.id, id));
    revalidateJobs([existing.slug]);

    await audit({
      action: "delete",
      entityType: "job",
      entityId: id,
    });

    return { success: true, id };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to delete job" };
  }
}

export async function reorderJobs(
  orderedIds: string[],
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    await Promise.all(
      orderedIds.map((id, index) =>
        getDb()
          .update(jobs)
          .set({ sortOrder: index })
          .where(eq(jobs.id, id)),
      ),
    );

    revalidateJobs();

    await audit({
      action: "reorder",
      entityType: "job",
      meta: { count: orderedIds.length },
    });

    return { success: true, id: orderedIds[0] ?? "" };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to reorder jobs" };
  }
}
