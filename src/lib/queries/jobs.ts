import { getDb } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export async function getAdminJobs() {
  return getDb()
    .select({
      id: jobs.id,
      slug: jobs.slug,
      title: jobs.title,
      department: jobs.department,
      location: jobs.location,
      employmentType: jobs.employmentType,
      status: jobs.status,
      sortOrder: jobs.sortOrder,
      publishedAt: jobs.publishedAt,
    })
    .from(jobs)
    .orderBy(asc(jobs.sortOrder));
}

export async function getAdminJobById(id: string) {
  const [row] = await getDb()
    .select()
    .from(jobs)
    .where(eq(jobs.id, id))
    .limit(1);
  return row ?? null;
}

async function fetchPublishedJobs() {
  return getDb()
    .select({
      id: jobs.id,
      slug: jobs.slug,
      title: jobs.title,
      department: jobs.department,
      location: jobs.location,
      employmentType: jobs.employmentType,
      requirements: jobs.requirements,
      description: jobs.description,
      publishedAt: jobs.publishedAt,
    })
    .from(jobs)
    .where(eq(jobs.status, "published"))
    .orderBy(asc(jobs.sortOrder));
}

export function getPublishedJobs() {
  return unstable_cache(
    async () => {
      try {
        return await fetchPublishedJobs();
      } catch (error) {
        console.warn("[jobs] published list fetch failed; returning empty.", error);
        return [];
      }
    },
    ["published-jobs"],
    {
      tags: ["jobs"],
    },
  )();
}

async function fetchJobBySlug(slug: string) {
  const [row] = await getDb()
    .select()
    .from(jobs)
    .where(eq(jobs.slug, slug))
    .limit(1);

  if (!row || row.status !== "published") return null;
  return row;
}

export function getJobBySlug(slug: string) {
  return unstable_cache(
    () => fetchJobBySlug(slug),
    [`job-slug-${slug}`],
    { tags: ["jobs"] },
  )();
}

export async function getPublishedJobSlugs(): Promise<string[]> {
  try {
    const rows = await getDb()
      .select({ slug: jobs.slug })
      .from(jobs)
      .where(eq(jobs.status, "published"));
    return rows.map((r) => r.slug);
  } catch (error) {
    console.warn("[jobs] slug list fetch failed; returning empty.", error);
    return [];
  }
}
