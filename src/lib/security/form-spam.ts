/**
 * Shared spam checks for public forms.
 * - Honeypot field named "website": any non-empty value = discard
 * - Minimum time: submitted sooner than MIN_SUBMIT_MS after formStartedAt = discard
 */

export const MIN_FORM_SUBMIT_MS = 3000;

let discardedCount = 0;

export type SpamCheckInput = {
  website?: string | null;
  formStartedAt?: number | null;
};

export type SpamCheckResult =
  | { discard: false }
  | { discard: true; reason: "honeypot" | "too-fast" };

export function checkFormSpam(input: SpamCheckInput): SpamCheckResult {
  if (input.website != null && String(input.website).trim() !== "") {
    discardedCount += 1;
    console.info(
      `[spam] discarded honeypot submission (total discarded: ${discardedCount})`,
    );
    return { discard: true, reason: "honeypot" };
  }

  const started = input.formStartedAt;
  if (
    typeof started === "number" &&
    Number.isFinite(started) &&
    Date.now() - started < MIN_FORM_SUBMIT_MS
  ) {
    discardedCount += 1;
    console.info(
      `[spam] discarded too-fast submission (total discarded: ${discardedCount})`,
    );
    return { discard: true, reason: "too-fast" };
  }

  return { discard: false };
}

/** Visually hidden honeypot styles (keep in sync across forms). */
export const honeypotFieldClassName =
  "absolute left-[-10000px] top-auto h-px w-px overflow-hidden whitespace-nowrap";
