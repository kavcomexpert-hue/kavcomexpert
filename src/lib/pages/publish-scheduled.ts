import { getDb } from "@/lib/db";
import { pages } from "@/lib/db/schema";
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
 * Flip due scheduled pages to published.
 * Cron-only: public/ISR paths must pass `{ revalidate: false }` and never write.
 */
export async function publishDueScheduledPages(
  options: PublishOptions = {},
): Promise<number> {
  const shouldRevalidate = options.revalidate !== false;
  if (!shouldRevalidate) {
    return 0;
  }
  const now = new Date();

  const due = await getDb()
    .select({
      id: pages.id,
      slug: pages.slug,
    })
    .from(pages)
    .where(
      and(eq(pages.status, "scheduled"), lte(pages.scheduledFor, now)),
    );

  if (due.length === 0) {
    return 0;
  }

  for (const row of due) {
    await getDb()
      .update(pages)
      .set({
        status: "published",
        publishedAt: now,
        scheduledFor: null,
        updatedAt: now,
      })
      .where(eq(pages.id, row.id));

    if (shouldRevalidate) {
      notifyIndexNowBackground(absoluteUrl(`/${row.slug}`));
      revalidatePath(`/${row.slug}`);
    }
  }

  if (shouldRevalidate) {
    revalidateTag("pages", "max");
    revalidatePath("/admin/pages");
  }

  return due.length;
}
