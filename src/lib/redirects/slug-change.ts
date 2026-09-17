import { getDb } from "@/lib/db";
import { redirects } from "@/lib/db/schema";
import { caseStudyPath, servicePath } from "@/lib/paths";
import { clearRedirectCache } from "@/lib/redirects/middleware-cache";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

/** Create or update a 301 redirect when published content slug/path changes. */
export async function ensureSlugRedirect(
  fromPath: string,
  toPath: string,
): Promise<void> {
  const from = fromPath.trim();
  const to = toPath.trim();
  if (!from.startsWith("/") || !to.startsWith("/") || from === to) {
    return;
  }

  const [existing] = await getDb()
    .select({ id: redirects.id, toPath: redirects.toPath })
    .from(redirects)
    .where(eq(redirects.fromPath, from))
    .limit(1);

  if (existing?.toPath === to) {
    return;
  }

  if (existing) {
    await getDb()
      .update(redirects)
      .set({ toPath: to, permanent: true })
      .where(eq(redirects.id, existing.id));
  } else {
    await getDb().insert(redirects).values({
      fromPath: from,
      toPath: to,
      permanent: true,
    });
  }

  clearRedirectCache();
  revalidateTag("redirects", "max");
}

export function servicePublicPath(
  slug: string,
  parentSlug?: string | null,
): string {
  return servicePath({ slug, parentSlug });
}

export function caseStudyPublicPath(slug: string): string {
  return caseStudyPath(slug);
}
