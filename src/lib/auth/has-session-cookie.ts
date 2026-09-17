/**
 * Cheap session-cookie presence check (no DB / no Better Auth getSession).
 * Session token cookies are httpOnly, so this is for server / middleware only.
 */

const SESSION_TOKEN_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
  // Legacy / alternate prefix forms Better Auth still accepts
  "better-auth-session_token",
  "__Secure-better-auth-session_token",
] as const;

type CookieReader = {
  has(name: string): boolean;
  get(name: string): { value: string } | undefined | null;
};

/** True when a Better Auth session_token cookie is present (value may still be invalid). */
export function hasSessionCookie(store: CookieReader): boolean {
  for (const name of SESSION_TOKEN_NAMES) {
    if (store.has(name)) {
      const value = store.get(name)?.value;
      if (value && value.length > 0) return true;
    }
  }
  return false;
}

/** Middleware / RequestCookies helper. */
export function hasSessionCookieOnRequest(request: {
  cookies: CookieReader;
}): boolean {
  return hasSessionCookie(request.cookies);
}
