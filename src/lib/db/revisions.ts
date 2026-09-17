import { getDb } from "@/lib/db";
import { revisions } from "@/lib/db/schema";
import { and, asc, count, eq } from "drizzle-orm";

const MAX_REVISIONS_PER_ENTITY = 15;

/**
 * Persist a full-row snapshot and trim history to the last 15 per entity.
 */
export async function saveRevision(input: {
  entityType: string;
  entityId: string;
  snapshot: unknown;
  authorId?: string | null;
}) {
  await getDb().insert(revisions).values({
    entityType: input.entityType,
    entityId: input.entityId,
    snapshot: input.snapshot,
    authorId: input.authorId ?? null,
  });

  const [totals] = await getDb()
    .select({ total: count() })
    .from(revisions)
    .where(
      and(
        eq(revisions.entityType, input.entityType),
        eq(revisions.entityId, input.entityId),
      ),
    );

  const excess = (totals?.total ?? 0) - MAX_REVISIONS_PER_ENTITY;
  if (excess <= 0) {
    return;
  }

  const oldest = await getDb()
    .select({ id: revisions.id })
    .from(revisions)
    .where(
      and(
        eq(revisions.entityType, input.entityType),
        eq(revisions.entityId, input.entityId),
      ),
    )
    .orderBy(asc(revisions.createdAt))
    .limit(excess);

  for (const row of oldest) {
    await getDb().delete(revisions).where(eq(revisions.id, row.id));
  }
}
