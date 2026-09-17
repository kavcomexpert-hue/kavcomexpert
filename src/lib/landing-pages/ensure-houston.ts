import {
  PAGE_DESCRIPTION,
  PAGE_TITLE,
} from "@/components/houston-cpa/constants";
import { getDb } from "@/lib/db";
import { landingPages } from "@/lib/db/schema";
import { emptyMarketingPageSections } from "@/lib/services/page-sections";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

const HOUSTON_SLUG = "cpa-marketing-agency-houston";
const HOUSTON_PATH = "/cpa-marketing-agency-houston";
const HOUSTON_TITLE = "CPA Marketing Agency Houston";
const HOUSTON_H1 =
  "Marketing and Back Office Support for Houston CPA Firms";

/**
 * Ensure the Houston CPA custom landing exists as a CMS row for SEO/status.
 * Inserts once if missing; never overwrites existing content on re-run.
 */
export async function ensureHoustonLandingPage(): Promise<{
  created: boolean;
}> {
  const [existing] = await getDb()
    .select({ id: landingPages.id })
    .from(landingPages)
    .where(eq(landingPages.slug, HOUSTON_SLUG))
    .limit(1);

  if (existing) {
    return { created: false };
  }

  const now = new Date();
  const sections = emptyMarketingPageSections();
  sections.heroHeading = HOUSTON_H1;

  await getDb().insert(landingPages).values({
    slug: HOUSTON_SLUG,
    path: HOUSTON_PATH,
    title: HOUSTON_TITLE,
    content: { type: "doc", content: [] },
    pageSections: sections,
    heroVisual: { mode: "animation" },
    layoutKind: "custom",
    status: "published",
    publishedAt: now,
    updatedAt: now,
    metaTitle: PAGE_TITLE,
    metaDescription: PAGE_DESCRIPTION,
    schemaType: "WebPage",
    noIndex: false,
    sitemapInclude: true,
    sitemapPriority: "0.9",
  });

  try {
    revalidateTag("landing-pages", "max");
    revalidateTag("sitemap", "max");
    revalidatePath("/admin/landing-pages");
    revalidatePath(HOUSTON_PATH);
  } catch {
    // revalidateTag requires a Next.js request/static-generation store
  }

  return { created: true };
}
