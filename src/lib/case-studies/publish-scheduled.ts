import { getDb } from "@/lib/db";
import { caseStudies } from "@/lib/db/schema";
import { notifyIndexNowBackground } from "@/lib/indexnow/notify";
import { absoluteUrl } from "@/lib/seo/constants";
import { and, eq, lte } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

type PublishOptions = {
  /**
   * When false, no-op (public/ISR must never write).
   * Cron should leave this true so paths and tags refresh.
   */
  revalidate?: boolean;
};

/**
 * Flip due scheduled case studies to published.
 * Cron-only: public/ISR paths must pass `{ revalidate: false }` and never write.
 */
export async function publishDueScheduledCaseStudies(
  options: PublishOptions = {},
): Promise<number> {
  const shouldRevalidate = options.revalidate !== false;
  if (!shouldRevalidate) {
    return 0;
  }
  const now = new Date();

  const due = await getDb()
    .select({
      id: caseStudies.id,
      slug: caseStudies.slug,
    })
    .from(caseStudies)
    .where(
      and(
        eq(caseStudies.status, "scheduled"),
        lte(caseStudies.scheduledFor, now),
      ),
    );

  if (due.length === 0) {
    return 0;
  }

  for (const row of due) {
    await getDb()
      .update(caseStudies)
      .set({
        status: "published",
        publishedAt: now,
        scheduledFor: null,
        updatedAt: now,
      })
      .where(eq(caseStudies.id, row.id));

    if (shouldRevalidate) {
      notifyIndexNowBackground(absoluteUrl(`/work/${row.slug}`));
      revalidatePath(`/work/${row.slug}`);
      revalidatePath(`/case-studies/${row.slug}`);
    }
  }

  if (shouldRevalidate) {
    revalidateTag("case-studies", "max");
    revalidatePath("/work");
    revalidatePath("/case-studies");
    revalidatePath("/admin/case-studies");
  }

  return due.length;
}
