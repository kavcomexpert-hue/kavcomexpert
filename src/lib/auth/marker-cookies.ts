/**
 * Non-httpOnly marker cookies so client chrome can gate auth/draft UI
 * without calling cookies()/draftMode() in the public site layout
 * (keeps anonymous pages eligible for ISR/static shells).
 */

export const STAFF_MARKER_COOKIE = "kavcom_staff";
export const DRAFT_MARKER_COOKIE = "kavcom_draft";

const WEEK_SECONDS = 60 * 60 * 24 * 7;

export function staffMarkerCookieOptions(maxAge = WEEK_SECONDS) {
  return {
    path: "/",
    sameSite: "lax" as const,
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

export function draftMarkerCookieOptions(maxAge = WEEK_SECONDS) {
  return staffMarkerCookieOptions(maxAge);
}

/** Client-side: true when document.cookie contains name=1 */
export function hasClientMarkerCookie(name: string): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((part) => part.trim() === `${name}=1`);
}

export function setClientMarkerCookie(name: string, maxAge = WEEK_SECONDS) {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${name}=1; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function clearClientMarkerCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}
