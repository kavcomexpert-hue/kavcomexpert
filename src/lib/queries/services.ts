import { getDb } from "@/lib/db";
import { withDbRetry } from "@/lib/db/retry";
import { services } from "@/lib/db/schema";
import { publishDueScheduledServices } from "@/lib/services/publish-scheduled";
import { and, asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export type ServiceSummary = {
  id: string;
  slug: string;
  name: string;
  shortPitch: string | null;
  icon: string | null;
  sortOrder: number | null;
  deliverables: unknown;
  parentId: string | null;
};

export type PublishedService = typeof services.$inferSelect;

const serviceListColumns = {
  id: services.id,
  slug: services.slug,
  name: services.name,
  shortPitch: services.shortPitch,
  icon: services.icon,
  sortOrder: services.sortOrder,
  deliverables: services.deliverables,
  parentId: services.parentId,
};

async function fetchServices() {
  await publishDueScheduledServices({ revalidate: false });

  return getDb()
    .select(serviceListColumns)
    .from(services)
    .where(eq(services.status, "published"))
    .orderBy(asc(services.sortOrder));
}

export function getServices() {
  return unstable_cache(
    async () => {
      try {
        return await fetchServices();
      } catch (error) {
        console.warn("[services] published list fetch failed; returning empty.", error);
        return [];
      }
    },
    ["published-services-v2"],
    {
      tags: ["services"],
    },
  )();
}

async function fetchServiceBySlug(slug: string) {
  await publishDueScheduledServices({ revalidate: false });

  const [service] = await withDbRetry(() =>
    getDb()
      .select()
      .from(services)
      .where(and(eq(services.slug, slug), eq(services.status, "published")))
      .limit(1),
  );

  return service ?? null;
}

/**
 * Returns null ONLY when the query succeeded and no published row exists.
 * DB failures throw (after retries) so a transient outage becomes a
 * retryable 500 instead of a cached 404.
 */
export function getServiceBySlug(slug: string) {
  return unstable_cache(
    () => fetchServiceBySlug(slug),
    ["published-service", slug],
    { tags: ["services"] },
  )();
}

async function fetchChildService(parentSlug: string, childSlug: string) {
  const parent = await fetchServiceBySlug(parentSlug);
  if (!parent) return null;

  const [child] = await getDb()
    .select()
    .from(services)
    .where(
      and(
        eq(services.slug, childSlug),
        eq(services.parentId, parent.id),
        eq(services.status, "published"),
      ),
    )
    .limit(1);

  if (!child) return null;
  return { parent, child };
}

export function getChildService(parentSlug: string, childSlug: string) {
  return unstable_cache(
    () => fetchChildService(parentSlug, childSlug),
    ["published-child-service", parentSlug, childSlug],
    { tags: ["services"] },
  )();
}
