/**
 * Rate limiter interface — swap MemorySlidingWindowLimiter for Upstash later
 * without changing call sites.
 */

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  retryAfterMs: number;
};

export interface RateLimiter {
  limit(key: string, max: number, windowMs: number): RateLimitResult;
}

type WindowEntry = {
  timestamps: number[];
};

const CLEANUP_EVERY_N = 64;
const MAX_KEYS = 2_000;

/**
 * In-memory sliding-window limiter. Suitable for a single Node process
 * (e.g. Hostinger VPS). Not shared across multiple instances.
 */
export class MemorySlidingWindowLimiter implements RateLimiter {
  private readonly store = new Map<string, WindowEntry>();
  private opsSinceCleanup = 0;

  private cleanup(cutoff: number) {
    for (const [k, v] of this.store) {
      v.timestamps = v.timestamps.filter((t) => t > cutoff);
      if (v.timestamps.length === 0) this.store.delete(k);
    }
    // Hard cap: drop oldest keys if still over limit (Map insertion order).
    while (this.store.size > MAX_KEYS) {
      const oldest = this.store.keys().next().value;
      if (oldest === undefined) break;
      this.store.delete(oldest);
    }
  }

  limit(key: string, max: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const cutoff = now - windowMs;
    const entry = this.store.get(key) ?? { timestamps: [] };
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

    if (entry.timestamps.length >= max) {
      const oldest = entry.timestamps[0] ?? now;
      this.store.set(key, entry);
      return {
        success: false,
        remaining: 0,
        retryAfterMs: Math.max(0, oldest + windowMs - now),
      };
    }

    entry.timestamps.push(now);
    this.store.set(key, entry);

    this.opsSinceCleanup += 1;
    if (
      this.opsSinceCleanup >= CLEANUP_EVERY_N ||
      this.store.size > MAX_KEYS
    ) {
      this.opsSinceCleanup = 0;
      this.cleanup(cutoff);
    }

    return {
      success: true,
      remaining: Math.max(0, max - entry.timestamps.length),
      retryAfterMs: 0,
    };
  }
}

const globalForRateLimit = globalThis as unknown as {
  __kavcomRateLimiter?: RateLimiter;
};

export const rateLimiter: RateLimiter =
  globalForRateLimit.__kavcomRateLimiter ??
  (globalForRateLimit.__kavcomRateLimiter = new MemorySlidingWindowLimiter());

export const RATE_LIMITS = {
  login: { max: 5, windowMs: 10 * 60 * 1000 },
  publicLead: { max: 5, windowMs: 60 * 60 * 1000 },
  revalidate: { max: 60, windowMs: 60 * 60 * 1000 },
  /** Abuse ceiling for authenticated admin/editor mutations (keyed by user id). */
  adminAbuse: { max: 300, windowMs: 60 * 60 * 1000 },
} as const;

export async function checkRateLimit(
  bucket: string,
  max: number,
  windowMs: number,
): Promise<RateLimitResult> {
  return Promise.resolve(rateLimiter.limit(bucket, max, windowMs));
}
