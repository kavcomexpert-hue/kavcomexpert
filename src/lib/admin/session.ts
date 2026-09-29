import { auth, type Session } from "@/lib/auth";
import {
  cookieHeaderHasSession,
  hasSessionCookie,
} from "@/lib/auth/has-session-cookie";
import {
  hasRole,
  parseAppRole,
  requireRole,
  type AppRole,
} from "@/lib/authz";
import { getDb } from "@/lib/db";
import { isTransientDbError, withDbRetry } from "@/lib/db/retry";
import { session as sessionTable, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Confirms the user still exists and is not suspended.
 * On suspend, revokes only the current session token (not every device)
 * unless the user row is missing — then wipe all sessions for that id.
 */
async function assertActiveUser(session: Session): Promise<Session> {
  const [row] = await withDbRetry(() =>
    getDb()
      .select({ suspended: user.suspended, role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1),
  );

  if (!row) {
    try {
      await getDb()
        .delete(sessionTable)
        .where(eq(sessionTable.userId, session.user.id));
    } catch {
      // Ignore revoke failures during DB blips.
    }
    throw new Error("Forbidden");
  }

  if (row.suspended) {
    try {
      await getDb()
        .delete(sessionTable)
        .where(eq(sessionTable.token, session.session.token));
    } catch {
      // Ignore revoke failures during DB blips.
    }
    throw new Error("Forbidden");
  }

  (session.user as { role?: string; suspended?: boolean }).role = row.role;
  (session.user as { suspended?: boolean }).suspended = false;
  return session;
}

async function getSessionWithRetry(): Promise<Session | null> {
  // Skip Better Auth entirely when no session cookie — no DB, no crypto work.
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  if (
    !hasSessionCookie(cookieStore) &&
    !cookieHeaderHasSession(requestHeaders.get("cookie"))
  ) {
    return null;
  }

  // Always GET: this helper is called from POST routes (uploads) and Server
  // Actions. Better Auth origin/CSRF middleware treats POST + Cookie as a
  // mutation and 403s when Origin does not match BETTER_AUTH_URL (www vs apex,
  // or a proxy that strips Origin).
  return withDbRetry(
    () =>
      auth.api.getSession({
        headers: requestHeaders,
        method: "GET",
      }),
    { attempts: 6, delayMs: 700 },
  );
}

/**
 * Soft session read for layouts / optional UI.
 * Never throws — returns null on missing or transient DB/auth failures.
 */
export async function getOptionalPageSession(): Promise<Session | null> {
  try {
    const session = await getSessionWithRetry();
    if (!session) return null;
    try {
      return await assertActiveUser(session);
    } catch (error) {
      if (isTransientDbError(error)) return null;
      return null;
    }
  } catch {
    return null;
  }
}

/** For server actions: throw if unauthenticated or suspended. */
export async function requireSession(): Promise<Session> {
  const session = await getSessionWithRetry();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return assertActiveUser(session);
}

/** For admin pages: redirect to login if unauthenticated or suspended. */
export async function requirePageSession(): Promise<Session> {
  let session: Session | null;

  try {
    session = await getSessionWithRetry();
  } catch (error) {
    // Transient Neon blips should not dump a Better Auth overlay mid-navigation.
    if (isTransientDbError(error)) {
      redirect("/admin/login?error=session");
    }
    // Any session lookup failure in page context → login, not a crash overlay.
    redirect("/admin/login?error=session");
  }

  if (!session) {
    redirect("/admin/login");
  }

  try {
    return await assertActiveUser(session);
  } catch (error) {
    if (isTransientDbError(error)) {
      redirect("/admin/login?error=session");
    }
    redirect("/admin/login");
  }
}

/** Session required + role check. Throws Forbidden if role mismatch. */
export async function requireSessionRole(roles: AppRole[]): Promise<Session> {
  const session = await requireSession();
  requireRole(session, roles);
  return session;
}

/** For admin-only pages: redirect non-admins to /admin. */
export async function requireAdminPageSession(): Promise<Session> {
  const session = await requirePageSession();

  if (!hasRole(session, ["admin"])) {
    redirect("/admin");
  }

  return session;
}

/** Redirect if the page role gate fails. */
export async function requirePageRoles(roles: AppRole[]): Promise<Session> {
  const session = await requirePageSession();
  if (!hasRole(session, roles)) {
    redirect("/admin");
  }
  return session;
}

export function roleFromUser(userLike: {
  role?: string | null;
}): AppRole {
  return parseAppRole(userLike.role);
}
