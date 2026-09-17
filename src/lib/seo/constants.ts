/**
 * Canonical public site origin. Never use the Node bind address (0.0.0.0)
 * or request host for user-facing absolute URLs — browsers refuse those.
 */
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const fallback =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://kavcomexpert.com";

  const candidate = raw && raw.length > 0 ? raw : fallback;

  try {
    const url = new URL(candidate);
    if (
      url.hostname === "0.0.0.0" ||
      url.hostname === "[::]" ||
      url.hostname === "::"
    ) {
      url.hostname = "localhost";
    }
    return url.origin;
  } catch {
    return fallback;
  }
}

export const SITE_URL = resolveSiteUrl();

/** Absolute URL for a site path (must start with `/` or be path-only). */
export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const parsed = new URL(path);
      if (
        parsed.hostname === "0.0.0.0" ||
        parsed.hostname === "[::]" ||
        parsed.hostname === "::"
      ) {
        return `${SITE_URL}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
      return parsed.toString();
    } catch {
      // fall through
    }
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

/** `URL` instance rooted at SITE_URL (safe for NextResponse.redirect). */
export function publicUrl(path: string): URL {
  return new URL(absoluteUrl(path));
}

function isUsableImageCandidate(candidate: string): boolean {
  const trimmed = candidate.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") {
    return false;
  }

  // Seed / demo paths that were never shipped under public/
  if (trimmed.startsWith("/og/") || trimmed.startsWith("/images/blog")) {
    return false;
  }

  return true;
}

export function resolveImageUrl(
  ...candidates: Array<string | null | undefined>
): string | undefined {
  for (const candidate of candidates) {
    if (!candidate || !isUsableImageCandidate(candidate)) {
      continue;
    }

    const trimmed = candidate.trim();

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }

    return absoluteUrl(trimmed.startsWith("/") ? trimmed : `/${trimmed}`);
  }

  return undefined;
}
