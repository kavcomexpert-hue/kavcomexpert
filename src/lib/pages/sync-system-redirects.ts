import { getDb } from "@/lib/db";
import { redirects } from "@/lib/db/schema";
import { clearRedirectCache } from "@/lib/redirects/middleware-cache";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

const SYSTEM_REDIRECTS = [
  { fromPath: "/results", toPath: "/", permanent: true },
  { fromPath: "/roi-calculator", toPath: "/", permanent: true },
] as const;

/**
 * Seed permanent redirects for removed routes. Idempotent — never overwrites
 * existing rows (admin may have customized targets).
 */
export async function ensureSystemRedirects(): Promise<{ created: number }> {
  let created = 0;

  for (const seed of SYSTEM_REDIRECTS) {
    const [existing] = await getDb()
      .select({ id: redirects.id })
      .from(redirects)
      .where(eq(redirects.fromPath, seed.fromPath))
      .limit(1);

    if (existing) continue;

    await getDb().insert(redirects).values({
      fromPath: seed.fromPath,
      toPath: seed.toPath,
      permanent: seed.permanent,
      hits: 0,
    });
    created += 1;
  }

  if (created > 0) {
    clearRedirectCache();
    revalidateTag("redirects", "max");
  }

  return { created };
}
