import { getDb } from "@/lib/db";
import {
  caseStudies,
  jobs,
  pages,
  posts,
  revisions,
  services,
} from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function getLatestRevisionSnapshot(
  entityType: "post" | "page" | "case_study" | "service",
  entityId: string,
): Promise<Record<string, unknown> | null> {
  const [row] = await getDb()
    .select({ snapshot: revisions.snapshot })
    .from(revisions)
    .where(
      and(
        eq(revisions.entityType, entityType),
        eq(revisions.entityId, entityId),
      ),
    )
    .orderBy(desc(revisions.createdAt))
    .limit(1);

  if (!row?.snapshot || typeof row.snapshot !== "object") {
    return null;
  }

  return row.snapshot as Record<string, unknown>;
}

function mergeSnapshot<T extends Record<string, unknown>>(
  row: T,
  snapshot: Record<string, unknown> | null,
): T {
  if (!snapshot) return row;
  return { ...row, ...snapshot, id: row.id } as T;
}

/** Any status; merges latest revision snapshot over the live row. */
export async function getPostForPreview(slug: string) {
  const [row] = await getDb()
    .select()
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);

  if (!row) return null;

  const snapshot = await getLatestRevisionSnapshot("post", row.id);
  return mergeSnapshot(row, snapshot);
}

export async function getPageForPreview(slug: string) {
  const [row] = await getDb()
    .select()
    .from(pages)
    .where(eq(pages.slug, slug))
    .limit(1);

  if (!row) return null;

  const snapshot = await getLatestRevisionSnapshot("page", row.id);
  return mergeSnapshot(row, snapshot);
}

/** Resolve a CMS page draft by public path (supports nested paths). */
export async function getPageForPreviewByPath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const [byPath] = await getDb()
    .select()
    .from(pages)
    .where(eq(pages.path, normalized))
    .limit(1);

  if (byPath) {
    const snapshot = await getLatestRevisionSnapshot("page", byPath.id);
    return mergeSnapshot(byPath, snapshot);
  }

  // Fallback: single-segment path → slug lookup
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 1) {
    return getPageForPreview(segments[0]!);
  }

  return null;
}

export async function getCaseStudyForPreview(slug: string) {
  const [row] = await getDb()
    .select()
    .from(caseStudies)
    .where(eq(caseStudies.slug, slug))
    .limit(1);

  if (!row) return null;

  const snapshot = await getLatestRevisionSnapshot("case_study", row.id);
  return mergeSnapshot(row, snapshot);
}

export async function getServiceForPreview(slug: string) {
  const [row] = await getDb()
    .select()
    .from(services)
    .where(eq(services.slug, slug))
    .limit(1);

  if (!row) return null;

  const snapshot = await getLatestRevisionSnapshot("service", row.id);
  return mergeSnapshot(row, snapshot);
}

/** Jobs have no revision snapshots — return the live row at any status. */
export async function getJobForPreview(slug: string) {
  const [row] = await getDb()
    .select()
    .from(jobs)
    .where(eq(jobs.slug, slug))
    .limit(1);

  return row ?? null;
}

export async function getPostByIdForPreview(id: string) {
  const [row] = await getDb().select().from(posts).where(eq(posts.id, id)).limit(1);
  return row ?? null;
}

export async function getPageByIdForPreview(id: string) {
  const [row] = await getDb().select().from(pages).where(eq(pages.id, id)).limit(1);
  return row ?? null;
}

export async function getCaseStudyByIdForPreview(id: string) {
  const [row] = await getDb()
    .select()
    .from(caseStudies)
    .where(eq(caseStudies.id, id))
    .limit(1);
  return row ?? null;
}

export async function getServiceByIdForPreview(id: string) {
  const [row] = await getDb()
    .select()
    .from(services)
    .where(eq(services.id, id))
    .limit(1);
  return row ?? null;
}

export async function getJobByIdForPreview(id: string) {
  const [row] = await getDb().select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return row ?? null;
}

export async function getServiceParentSlug(parentId: string | null | undefined) {
  if (!parentId) return null;
  const [parent] = await getDb()
    .select({ slug: services.slug })
    .from(services)
    .where(eq(services.id, parentId))
    .limit(1);
  return parent?.slug ?? null;
}
