import { requireSession } from "@/lib/admin/session";
import { hasRole } from "@/lib/authz";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logAudit, type AuditAction } from "@/lib/audit";
import { getClientIp } from "@/lib/security/client-ip";

export class RateLimitedError extends Error {
  constructor() {
    super("Too many requests. Try again later.");
    this.name = "RateLimitedError";
  }
}

/**
 * Session check + mutation rate limit for admin actions that revalidate/IndexNow.
 *
 * Order matters: the session is resolved FIRST, then limits are applied by role.
 * Admin/editor sessions bypass the tight public/IP limits entirely and only face
 * a very high per-user abuse ceiling. Other authenticated roles (author) keep the
 * stricter limit, keyed by user id rather than IP so shared NAT/proxy IPs don't
 * collide.
 */
export async function beginAdminMutation() {
  const session = await requireSession();
  const ip = await getClientIp();

  const trusted = hasRole(session, ["admin", "editor"]);
  const limited = trusted
    ? await checkRateLimit(
        `admin-abuse:${session.user.id}`,
        RATE_LIMITS.adminAbuse.max,
        RATE_LIMITS.adminAbuse.windowMs,
      )
    : await checkRateLimit(
        `revalidate:user:${session.user.id}`,
        RATE_LIMITS.revalidate.max,
        RATE_LIMITS.revalidate.windowMs,
      );

  if (!limited.success) {
    throw new RateLimitedError();
  }

  return {
    session,
    ip,
    async audit(input: {
      action: AuditAction | string;
      entityType: string;
      entityId?: string | null;
      meta?: Record<string, unknown> | null;
    }) {
      await logAudit({
        userId: session.user.id,
        ip,
        ...input,
      });
    },
  };
}
