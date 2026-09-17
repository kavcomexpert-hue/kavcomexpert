export type ImageSrcKind = "optimized" | "unoptimized" | "invalid";

function isAlreadyCompressedPath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return (
    lower.endsWith(".webp") ||
    lower.endsWith(".avif") ||
    lower.endsWith(".svg") ||
    lower.endsWith(".gif")
  );
}

function isR2Host(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host.endsWith(".r2.dev")) return true;
  // Optional public mirror of R2_PUBLIC_URL for client classification.
  const configured =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim() ||
    process.env.R2_PUBLIC_URL?.trim();
  if (!configured) return false;
  try {
    return new URL(configured).hostname.toLowerCase() === host;
  } catch {
    return false;
  }
}

/**
 * Mirrors the images.remotePatterns allowlist in next.config.ts. next/image
 * THROWS at render time for remote hosts outside that list, so CMS-sourced
 * URLs must be classified first.
 *
 * R2 / already-compressed assets are `unoptimized` so Node Sharp does not
 * re-encode them on every /_next/image hit (critical on small VPS heaps).
 * Cloudflare/R2 then serve bytes directly from the CDN edge.
 */
export function classifyImageSrc(src: string): ImageSrcKind {
  const value = src.trim();
  if (!value) return "invalid";

  // Local public assets under blog-media are often large; skip Sharp.
  if (value.startsWith("/blog-media/")) {
    return "unoptimized";
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    if (isAlreadyCompressedPath(value)) return "unoptimized";
    return "optimized";
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "invalid";
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return "invalid";
  }

  if (url.protocol === "https:") {
    const host = url.hostname.toLowerCase();
    if (host === "i.ytimg.com" && url.pathname.startsWith("/vi/")) {
      return "optimized";
    }
    // R2 public hosts: serve directly (Cloudflare-cached), never re-optimize.
    if (isR2Host(host)) {
      return "unoptimized";
    }
    // Already webp/avif on any HTTPS CDN — no Sharp pass needed.
    if (isAlreadyCompressedPath(url.pathname)) {
      return "unoptimized";
    }
  }

  return "unoptimized";
}
