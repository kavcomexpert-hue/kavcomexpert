import { getDb } from "@/lib/db";
import { services } from "@/lib/db/schema";
import {
  staticServicePages,
  staticServiceSlugs,
} from "@/lib/site/service-pages";
import type { StaticServicePage } from "@/lib/site/service-pages/types";
import { staticPageToSections } from "@/lib/services/page-sections";
import { eq, notInArray } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

function valuesFromStatic(page: StaticServicePage, sortOrder: number) {
  const pageSections = staticPageToSections(page);
  return {
    slug: page.slug,
    name: page.name,
    shortPitch: page.aeoSummary,
    pageSections,
    body: null as null,
    deliverables: page.offerings.map((item) => item.title),
    faqs: page.faqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    })),
    icon: null as string | null,
    sortOrder,
    status: "published" as const,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    focusKeyword: page.name,
    schemaType: "Service",
    ogImage: null as string | null,
    // Leave canonical empty so metadata derives it from the service's real
    // path (nested for children) and NEXT_PUBLIC_SITE_URL.
    canonicalUrl: null as string | null,
    noIndex: false,
    sitemapInclude: true,
    sitemapPriority: "0.7",
    updatedAt: new Date(),
  };
}

export type SyncServicesOptions = {
  /**
   * Destructive: overwrite pitch/sections/FAQs from static templates and
   * remove DB services that are not in the static catalog.
   * Only for an explicit admin “reset from templates” action — never auto.
   */
  forceContent?: boolean;
  /** When true with forceContent, delete services not in the static catalog. */
  removeExtras?: boolean;
};

/**
 * Align CMS services with the public static service pages.
 * Default mode is insert/backfill-only and never overwrites CMS edits.
 */
export async function syncServicesFromStaticPages(
  options: SyncServicesOptions = {},
): Promise<{ upserted: number; removed: number; backfilled: number }> {
  const { forceContent = false, removeExtras = false } = options;
  const pages = Object.values(staticServicePages);
  let upserted = 0;
  let backfilled = 0;
  let removedCount = 0;

  if (forceContent && removeExtras) {
    const removed = await getDb()
      .delete(services)
      .where(notInArray(services.slug, [...staticServiceSlugs]))
      .returning({ id: services.id });
    removedCount = removed.length;
  }

  for (let index = 0; index < pages.length; index++) {
    const page = pages[index];
    const values = valuesFromStatic(page, index + 1);

    const [existing] = await getDb()
      .select({
        id: services.id,
        pageSections: services.pageSections,
        shortPitch: services.shortPitch,
      })
      .from(services)
      .where(eq(services.slug, page.slug))
      .limit(1);

    if (!existing) {
      await getDb().insert(services).values(values);
      upserted += 1;
      continue;
    }

    if (forceContent) {
      await getDb()
        .update(services)
        .set({
          name: values.name,
          sortOrder: values.sortOrder,
          status: "published",
          metaTitle: values.metaTitle,
          metaDescription: values.metaDescription,
          canonicalUrl: values.canonicalUrl,
          focusKeyword: values.focusKeyword,
          schemaType: values.schemaType,
          noIndex: false,
          sitemapInclude: true,
          shortPitch: values.shortPitch,
          body: values.body,
          pageSections: values.pageSections,
          deliverables: values.deliverables,
          faqs: values.faqs,
          updatedAt: values.updatedAt,
        })
        .where(eq(services.id, existing.id));
      upserted += 1;
      continue;
    }

    // Safe backfill: only fill null pageSections on this row. Never touch
    // name/meta/status/pitch when the admin already edited the service.
    if (!existing.pageSections) {
      await getDb()
        .update(services)
        .set({
          pageSections: values.pageSections,
          shortPitch: existing.shortPitch?.trim()
            ? existing.shortPitch
            : values.shortPitch,
          deliverables: values.deliverables,
          faqs: values.faqs,
          updatedAt: new Date(),
        })
        .where(eq(services.id, existing.id));
      backfilled += 1;
    }
  }

  try {
    revalidateTag("services", "max");
    revalidatePath("/admin/services");
    revalidatePath("/services");
    for (const slug of staticServiceSlugs) {
      revalidatePath(`/services/${slug}`);
    }
  } catch {
    // Outside a Next.js request (scripts), revalidate is a no-op.
  }

  return { upserted, removed: removedCount, backfilled };
}

/**
 * Auto-seed on admin Services list load.
 * Inserts missing static services and backfills null pageSections only.
 * Never deletes custom services or overwrites CMS content.
 */
export async function ensureServicesFromStaticPages() {
  return syncServicesFromStaticPages({ forceContent: false });
}
