import { getDb } from "@/lib/db";
import { posts } from "@/lib/db/schema";
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
 * Flip due scheduled posts to published.
 * Cron-only: public/ISR paths must pass `{ revalidate: false }` and never write.
 */
export async function publishDueScheduledPosts(
  options: PublishOptions = {},
): Promise<number> {
  const shouldRevalidate = options.revalidate !== false;
  // Public page renders must not SELECT/UPDATE scheduled rows — cron owns sweeps.
  if (!shouldRevalidate) {
    return 0;
  }
  const now = new Date();

  const due = await getDb()
    .select({
      id: posts.id,
      slug: posts.slug,
    })
    .from(posts)
    .where(
      and(
        eq(posts.status, "scheduled"),
        lte(posts.scheduledFor, now),
      ),
    );

  if (due.length === 0) {
    return 0;
  }

  for (const row of due) {
    await getDb()
      .update(posts)
      .set({
        status: "published",
        publishedAt: now,
        scheduledFor: null,
        updatedAt: now,
      })
      .where(eq(posts.id, row.id));

    if (shouldRevalidate) {
      notifyIndexNowBackground(absoluteUrl(`/blog/${row.slug}`));
      revalidatePath(`/blog/${row.slug}`);
    }
  }

  if (shouldRevalidate) {
    revalidateTag("posts", "max");
    revalidatePath("/blog");
    revalidatePath("/admin/posts");
  }

  return due.length;
}
