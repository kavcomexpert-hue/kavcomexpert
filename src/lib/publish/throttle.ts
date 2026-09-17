/**
 * In-process throttle retained for any non-cron callers that still opt in.
 * Public scheduled publishing is cron-only (see publish-scheduled modules).
 */
const lastRunAt = new Map<string, number>();

export function shouldRunPublishSweep(
  key: string,
  minIntervalMs = 60_000,
): boolean {
  const now = Date.now();
  const previous = lastRunAt.get(key) ?? 0;
  if (now - previous < minIntervalMs) {
    return false;
  }
  lastRunAt.set(key, now);
  return true;
}
