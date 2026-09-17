import type { Session } from "@/lib/auth";

export const APP_ROLES = ["admin", "editor", "author"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export type AuthSession = Session;

export function parseAppRole(value: unknown): AppRole {
  if (value === "admin" || value === "editor" || value === "author") {
    return value;
  }
  return "author";
}

export function sessionRole(session: AuthSession): AppRole {
  return parseAppRole((session.user as { role?: string | null }).role);
}

export function isSuspended(session: AuthSession): boolean {
  return Boolean((session.user as { suspended?: boolean | null }).suspended);
}

/**
 * Throws if the session user is not in the allowed roles list.
 */
export function requireRole(session: AuthSession, roles: AppRole[]): AppRole {
  const role = sessionRole(session);
  if (!roles.includes(role)) {
    throw new Error("Forbidden");
  }
  return role;
}

export function hasRole(session: AuthSession, roles: AppRole[]): boolean {
  return roles.includes(sessionRole(session));
}

export function requireNotSuspended(session: AuthSession): void {
  if (isSuspended(session)) {
    throw new Error("Forbidden");
  }
}

/** Admin only: users, settings, redirects, audit log, CSV export. */
export function canManageUsers(session: AuthSession): boolean {
  return hasRole(session, ["admin"]);
}

export function canManageSettings(session: AuthSession): boolean {
  return hasRole(session, ["admin"]);
}

export function canManageRedirects(session: AuthSession): boolean {
  return hasRole(session, ["admin"]);
}

export function canViewAuditLog(session: AuthSession): boolean {
  return hasRole(session, ["admin"]);
}

export function canExportLeadsCsv(session: AuthSession): boolean {
  return hasRole(session, ["admin"]);
}

/** Admin + editor: full content CRUD/publish, leads view, menus, SEO, etc. */
export function canManageAllContent(session: AuthSession): boolean {
  return hasRole(session, ["admin", "editor"]);
}

export function canViewLeads(session: AuthSession): boolean {
  return hasRole(session, ["admin", "editor"]);
}

export function canPublish(session: AuthSession): boolean {
  return hasRole(session, ["admin", "editor"]);
}

/** Posts + case studies for authors; all content for admin/editor. */
export function canAccessOwnedContent(session: AuthSession): boolean {
  return hasRole(session, ["admin", "editor", "author"]);
}

export function canUseMedia(session: AuthSession): boolean {
  return hasRole(session, ["admin", "editor", "author"]);
}

export type EditableEntity = {
  authorId?: string | null;
};

/**
 * Admins and editors can edit any entity.
 * Authors can edit only entities they authored.
 */
export function canEditEntity(
  session: AuthSession,
  entity: EditableEntity,
): boolean {
  if (canManageAllContent(session)) {
    return true;
  }

  if (sessionRole(session) !== "author") {
    return false;
  }

  return String(entity.authorId) === String(session.user.id);
}

/**
 * Authors cannot publish/schedule. Admin/editor can.
 */
export function assertCanSetStatus(
  session: AuthSession,
  status: string,
): void {
  if (status === "published" || status === "scheduled") {
    if (!canPublish(session)) {
      throw new Error("Forbidden");
    }
  }
}

/**
 * Authors cannot delete or trash published content.
 */
export function assertCanDeleteContent(
  session: AuthSession,
  existingStatus: string | null | undefined,
): void {
  if (
    existingStatus === "published" &&
    !canManageAllContent(session)
  ) {
    throw new Error("Forbidden");
  }
}

/** Server action helper: admin|editor for site-wide content (pages, services, …). */
export function requireContentManager(session: AuthSession): AppRole {
  return requireRole(session, ["admin", "editor"]);
}
