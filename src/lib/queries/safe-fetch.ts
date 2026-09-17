/**
 * Wraps a public CMS query so a DB outage or schema drift during `next build`
 * does not abort static generation. Returns null on failure; callers should
 * fall back to static content or `notFound()`.
 */
export async function safePublicQuery<T>(
  label: string,
  query: () => Promise<T>,
): Promise<T | null> {
  try {
    return await query();
  } catch (error) {
    console.warn(
      `[${label}] database query failed; continuing without row data.`,
      error,
    );
    return null;
  }
}
