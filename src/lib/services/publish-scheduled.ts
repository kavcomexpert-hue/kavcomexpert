import { getDb } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { notifyIndexNowBackground } from "@/lib/indexnow/notify";
import { servicePublicPath } from "@/lib/redirects/slug-change";
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
 * Flip due scheduled services to published.
 * Cron-only: public/ISR paths must pass `{ revalidate: false }` and never write.
 */
export async function publishDueScheduledServices(
  options: PublishOptions = {},
): Promise<number> {
  try {
    const shouldRevalidate = options.revalidate !== false;
    if (!shouldRevalidate) {
      return 0;
    }
    const now = new Date();

    const due = await getDb()
      .select({
        id: services.id,
        slug: services.slug,
        parentId: services.parentId,
      })
      .from(services)
      .where(
        and(eq(services.status, "scheduled"), lte(services.scheduledFor, now)),
      );

    if (due.length === 0) {
      return 0;
    }

    for (const row of due) {
      const parentSlug = row.parentId
        ? (
            await getDb()
              .select({ slug: services.slug })
              .from(services)
              .where(eq(services.id, row.parentId))
              .limit(1)
          )[0]?.slug ?? null
        : null;

      await getDb()
        .update(services)
        .set({
          status: "published",
          publishedAt: now,
          scheduledFor: null,
          updatedAt: now,
        })
        .where(eq(services.id, row.id));

      if (shouldRevalidate) {
        const path = servicePublicPath(row.slug, parentSlug);
        notifyIndexNowBackground(absoluteUrl(path));
        revalidatePath(path);
      }
    }

    if (shouldRevalidate) {
      revalidateTag("services", "max");
      revalidatePath("/services");
      revalidatePath("/admin/services");
    }

    return due.length;
  } catch (error) {
    console.warn(
      "[services] scheduled publish sweep failed; continuing.",
      error,
    );
    return 0;
  }
}
