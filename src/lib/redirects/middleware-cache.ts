import { getDb } from "@/lib/db";
import { redirects } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export type CachedRedirect = {
  fromPath: string;
  toPath: string;
  permanent: boolean;
};

let cache: CachedRedirect[] | null = null;
let cachedAt = 0;

const TTL_MS = 5 * 60_000; // 5 minutes — redirects change rarely

const STATIC_ASSET_PATTERN =
  /\.(?:avif|bmp|css|gif|ico|jpe?g|js|json|map|mp4|pdf|png|svg|txt|webmanifest|webp|woff2?)$/i;

export function shouldLookupRedirect(pathname: string): boolean {
  if (pathname.startsWith("/_next")) {
    return false;
  }

  if (pathname.startsWith("/api")) {
    return false;
  }

  if (STATIC_ASSET_PATTERN.test(pathname)) {
    return false;
  }

  return true;
}

export async function getCachedRedirects(): Promise<CachedRedirect[]> {
  const now = Date.now();

  if (cache && now - cachedAt < TTL_MS) {
    return cache;
  }

  const rows = await getDb()
    .select({
      fromPath: redirects.fromPath,
      toPath: redirects.toPath,
      permanent: redirects.permanent,
    })
    .from(redirects);

  cache = rows.map((row) => ({
    fromPath: row.fromPath,
    toPath: row.toPath,
    permanent: row.permanent ?? true,
  }));
  cachedAt = now;

  return cache;
}

export async function recordRedirectHit(fromPath: string): Promise<void> {
  try {
    await getDb()
      .update(redirects)
      .set({ hits: sql`coalesce(${redirects.hits}, 0) + 1` })
      .where(eq(redirects.fromPath, fromPath));
  } catch {
    // Best-effort counter; never block the redirect response.
  }
}

export function clearRedirectCache(): void {
  cache = null;
  cachedAt = 0;
}
