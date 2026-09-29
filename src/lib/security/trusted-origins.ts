/**
 * Hosts / origins that may invoke admin Server Actions and Better Auth.
 * Hostinger binds Node to 0.0.0.0; the public Origin still must be trusted.
 */

function hostFromUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.host || null;
  } catch {
    return null;
  }
}

function originFromUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.hostname === "0.0.0.0" || url.hostname === "[::]" || url.hostname === "::") {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

const STATIC_ACTION_HOSTS = [
  "kavcomexpert.com",
  "www.kavcomexpert.com",
  "localhost:3000",
  "127.0.0.1:3000",
] as const;

const STATIC_ORIGINS = [
  "https://kavcomexpert.com",
  "https://www.kavcomexpert.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
] as const;

/** Host header values for Next.js Server Action CSRF (`allowedOrigins`). */
export function trustedActionHosts(): string[] {
  const hosts = new Set<string>([
    ...STATIC_ACTION_HOSTS,
    "*.kavcomexpert.com",
  ]);

  for (const raw of [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.BETTER_AUTH_URL,
  ]) {
    const host = hostFromUrl(raw);
    if (host && host !== "0.0.0.0" && host !== "[::]") {
      hosts.add(host);
    }
  }

  return [...hosts];
}

/** Full origins for Better Auth `trustedOrigins`. */
export function trustedAuthOrigins(): string[] {
  const origins = new Set<string>(STATIC_ORIGINS);

  for (const raw of [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.BETTER_AUTH_URL,
  ]) {
    const origin = originFromUrl(raw);
    if (origin) origins.add(origin);
  }

  return [...origins];
}

export function isTrustedActionHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  if (!normalized) return false;

  const allowed = trustedActionHosts();
  if (allowed.includes(normalized)) return true;

  const hostname = normalized.split(":")[0] ?? normalized;
  return (
    hostname === "kavcomexpert.com" ||
    hostname.endsWith(".kavcomexpert.com")
  );
}
