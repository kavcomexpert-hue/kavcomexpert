import { getDb } from "@/lib/db";
import { caseStudies } from "@/lib/db/schema";
import { publishDueScheduledCaseStudies } from "@/lib/case-studies/publish-scheduled";
import { and, desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export type CaseStudySummary = {
  id: string;
  slug: string;
  client: string;
  industry: string | null;
  challenge: string | null;
  infoHeadlineLabel: string | null;
  infoHeadlineValue: string | null;
  gallery: unknown;
  metaTitle: string;
  metaDescription: string;
  ogImage: string | null;
};

export type PublishedCaseStudy = typeof caseStudies.$inferSelect;

const caseStudyListColumns = {
  id: caseStudies.id,
  slug: caseStudies.slug,
  client: caseStudies.client,
  industry: caseStudies.industry,
  challenge: caseStudies.challenge,
  infoHeadlineLabel: caseStudies.infoHeadlineLabel,
  infoHeadlineValue: caseStudies.infoHeadlineValue,
  gallery: caseStudies.gallery,
  metaTitle: caseStudies.metaTitle,
  metaDescription: caseStudies.metaDescription,
  ogImage: caseStudies.ogImage,
};

async function fetchCaseStudies() {
  await publishDueScheduledCaseStudies({ revalidate: false });

  return getDb()
    .select(caseStudyListColumns)
    .from(caseStudies)
    .where(eq(caseStudies.status, "published"))
    .orderBy(desc(caseStudies.client));
}

export function getCaseStudies() {
  return unstable_cache(
    async () => {
      try {
        return await fetchCaseStudies();
      } catch (error) {
        console.warn("[case-studies] list fetch failed; returning empty.", error);
        return [];
      }
    },
    ["published-case-studies"],
    {
      tags: ["case-studies"],
    },
  )();
}

async function fetchCaseStudyBySlug(slug: string) {
  try {
    await publishDueScheduledCaseStudies({ revalidate: false });
  } catch (error) {
    console.warn(
      "[case-studies] scheduled publish sweep failed; continuing.",
      error,
    );
  }

  const [caseStudy] = await getDb()
    .select()
    .from(caseStudies)
    .where(
      and(eq(caseStudies.slug, slug), eq(caseStudies.status, "published")),
    )
    .limit(1);

  return caseStudy ?? null;
}

export function getCaseStudyBySlug(slug: string) {
  return unstable_cache(
    () => fetchCaseStudyBySlug(slug),
    ["published-case-study", slug],
    { tags: ["case-studies"] },
  )();
}
