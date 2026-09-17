/** Public site key — read on the server at runtime and passed into client forms. */
export function getTurnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";
}

/** Secret for siteverify. Prefers TURNSTILE_SECRET_KEY; also accepts TURNSTILE_SECRET. */
export function getTurnstileSecret(): string {
  return (
    process.env.TURNSTILE_SECRET_KEY?.trim() ||
    process.env.TURNSTILE_SECRET?.trim() ||
    ""
  );
}

/** Client-side: true when a site key was provided (via prop from the server). */
export function isTurnstileClientEnabled(siteKey?: string | null): boolean {
  return Boolean(siteKey?.trim() || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());
}

/** Server-side: verify only when both keys are configured at runtime. */
export function isTurnstileServerEnabled(): boolean {
  return Boolean(getTurnstileSecret() && getTurnstileSiteKey());
}

export const TURNSTILE_FAILURE_MESSAGE =
  "Verification failed, please try again.";
