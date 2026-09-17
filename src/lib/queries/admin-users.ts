import { getDb } from "@/lib/db";
import { invitations, session, user } from "@/lib/db/schema";
import { parseAppRole, type AppRole } from "@/lib/authz";
import { and, desc, eq, isNull, sql } from "drizzle-orm";

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  twoFactorEnabled: boolean;
  suspended: boolean;
  lastActiveAt: Date | null;
  createdAt: Date;
};

export type PendingInvitation = {
  id: string;
  email: string;
  role: AppRole;
  expiresAt: Date;
  createdAt: Date;
};

export async function getAdminUsers(): Promise<AdminUserListItem[]> {
  const rows = await getDb()
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
      suspended: user.suspended,
      createdAt: user.createdAt,
      lastActiveAt: sql<Date | null>`(
        select max(coalesce(${session.updatedAt}, ${session.createdAt}))
        from ${session}
        where ${session.userId} = ${user.id}
      )`,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: parseAppRole(row.role),
    twoFactorEnabled: Boolean(row.twoFactorEnabled),
    suspended: Boolean(row.suspended),
    lastActiveAt: row.lastActiveAt ? new Date(row.lastActiveAt) : null,
    createdAt: row.createdAt,
  }));
}

export async function getPendingInvitations(): Promise<PendingInvitation[]> {
  const now = new Date();
  const rows = await getDb()
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      expiresAt: invitations.expiresAt,
      createdAt: invitations.createdAt,
    })
    .from(invitations)
    .where(
      and(isNull(invitations.acceptedAt), sql`${invitations.expiresAt} > ${now}`),
    )
    .orderBy(desc(invitations.createdAt));

  return rows.map((row) => ({
    ...row,
    role: parseAppRole(row.role),
  }));
}

export async function countAdmins(): Promise<number> {
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(user)
    .where(and(eq(user.role, "admin"), eq(user.suspended, false)));

  return Number(row?.count ?? 0);
}

export async function getFirstAdminUserId(): Promise<string | null> {
  const [row] = await getDb()
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.role, "admin"), eq(user.suspended, false)))
    .orderBy(user.createdAt)
    .limit(1);

  return row?.id ?? null;
}
