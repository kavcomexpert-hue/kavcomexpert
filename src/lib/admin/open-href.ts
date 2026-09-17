import { absoluteUrl } from "@/lib/seo/constants";

/**
 * Open a relative or absolute href in a new tab from admin UIs.
 * Always resolves against NEXT_PUBLIC_SITE_URL (never window origin /
 * 0.0.0.0 bind address).
 */
export function openAdminHref(href: string): void {
  const raw = href.trim();
  if (!raw) return;

  try {
    window.open(absoluteUrl(raw), "_blank", "noopener,noreferrer");
  } catch {
    // ignore invalid URLs
  }
}
