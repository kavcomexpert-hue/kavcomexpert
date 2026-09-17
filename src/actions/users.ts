"use server";

import { beginAdminMutation, RateLimitedError } from "@/lib/admin/mutation-guard";
import { requireRole, type AppRole, APP_ROLES } from "@/lib/authz";
import { getDb } from "@/lib/db";
import {
  account,
  caseStudies,
  invitations,
  pages,
  posts,
  session,
  user,
} from "@/lib/db/schema";
import { sendInvitationEmail } from "@/lib/email/send-invitation";
import {
  countAdmins,
  getFirstAdminUserId,
} from "@/lib/queries/admin-users";
import { absoluteUrl } from "@/lib/seo/constants";
import { hashPassword } from "better-auth/crypto";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";

const roleSchema = z.enum(APP_ROLES);

type ActionResult =
  | { success: true; id?: string; message?: string }
  | { success: false; error: string };

function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function revalidateUsers() {
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function inviteUser(input: {
  email: string;
  role: AppRole;
  allowExternalEmail?: boolean;
}): Promise<ActionResult> {
  try {
    const { audit, session: adminSession } = await beginAdminMutation();
    requireRole(adminSession, ["admin"]);

    const parsed = z
      .object({
        email: z.string().trim().email().toLowerCase(),
        role: roleSchema,
        allowExternalEmail: z.boolean().optional().default(false),
      })
      .parse(input);

    const allowedDomain = (
      process.env.INVITE_EMAIL_DOMAIN?.trim() || "kavcomexpert.com"
    ).toLowerCase();
    const emailDomain = parsed.email.split("@")[1] ?? "";
    const isExternal = emailDomain !== allowedDomain;

    if (isExternal && !parsed.allowExternalEmail) {
      return {
        success: false,
        error: `Invites are limited to @${allowedDomain}. Check “Allow external email” to invite outside the company domain.`,
      };
    }

    const [existingUser] = await getDb()
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, parsed.email))
      .limit(1);

    if (existingUser) {
      return { success: false, error: "A user with this email already exists" };
    }

    const [pending] = await getDb()
      .select({ id: invitations.id })
      .from(invitations)
      .where(
        and(
          eq(invitations.email, parsed.email),
          isNull(invitations.acceptedAt),
        ),
      )
      .limit(1);

    if (pending) {
      await getDb().delete(invitations).where(eq(invitations.id, pending.id));
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashInviteToken(token);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const [created] = await getDb()
      .insert(invitations)
      .values({
        email: parsed.email,
        role: parsed.role,
        tokenHash,
        invitedByUserId: adminSession.user.id,
        expiresAt,
      })
      .returning({ id: invitations.id });

    const inviteUrl = absoluteUrl(`/admin/invite/${token}`);
    const emailResult = await sendInvitationEmail({
      to: parsed.email,
      role: parsed.role,
      inviteUrl,
      expiresAt,
    });

    if (!emailResult.sent) {
      await getDb().delete(invitations).where(eq(invitations.id, created.id));
      return {
        success: false,
        error: emailResult.error ?? "Failed to send invitation email",
      };
    }

    await audit({
      action: "user_invite",
      entityType: "invitation",
      entityId: created.id,
      meta: {
        email: parsed.email,
        role: parsed.role,
        allowExternalEmail: parsed.allowExternalEmail,
        emailDomain,
      },
    });

    if (isExternal && parsed.allowExternalEmail) {
      await audit({
        action: "user_invite_domain_override",
        entityType: "invitation",
        entityId: created.id,
        meta: {
          email: parsed.email,
          emailDomain,
          allowedDomain,
          invitedBy: adminSession.user.email,
          invitedByUserId: adminSession.user.id,
        },
      });
    }

    revalidateUsers();
    return { success: true, id: created.id, message: "Invitation sent" };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Invalid input",
      };
    }
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return { success: false, error: error.message };
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return { success: false, error: "Forbidden" };
    }
    console.error("[inviteUser]", error);
    return { success: false, error: "Failed to invite user" };
  }
}

export async function changeUserRole(input: {
  userId: string;
  role: AppRole;
}): Promise<ActionResult> {
  try {
    const { audit, session: adminSession } = await beginAdminMutation();
    requireRole(adminSession, ["admin"]);

    const parsed = z
      .object({
        userId: z.string().min(1),
        role: roleSchema,
      })
      .parse(input);

    const [target] = await getDb()
      .select({
        id: user.id,
        role: user.role,
        suspended: user.suspended,
      })
      .from(user)
      .where(eq(user.id, parsed.userId))
      .limit(1);

    if (!target) {
      return { success: false, error: "User not found" };
    }

    if (target.role === "admin" && parsed.role !== "admin") {
      const admins = await countAdmins();
      if (admins <= 1 && !target.suspended) {
        return { success: false, error: "Cannot remove the last admin" };
      }
    }

    await getDb()
      .update(user)
      .set({ role: parsed.role, updatedAt: new Date() })
      .where(eq(user.id, parsed.userId));

    await audit({
      action: "user_role_change",
      entityType: "user",
      entityId: parsed.userId,
      meta: { from: target.role, to: parsed.role },
    });

    revalidateUsers();
    return { success: true, id: parsed.userId };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Invalid input",
      };
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return { success: false, error: "Forbidden" };
    }
    return { success: false, error: "Failed to change role" };
  }
}

export async function setUserSuspended(input: {
  userId: string;
  suspended: boolean;
}): Promise<ActionResult> {
  try {
    const { audit, session: adminSession } = await beginAdminMutation();
    requireRole(adminSession, ["admin"]);

    const parsed = z
      .object({
        userId: z.string().min(1),
        suspended: z.boolean(),
      })
      .parse(input);

    if (parsed.userId === adminSession.user.id && parsed.suspended) {
      return { success: false, error: "You cannot suspend your own account" };
    }

    const [target] = await getDb()
      .select({
        id: user.id,
        role: user.role,
        suspended: user.suspended,
      })
      .from(user)
      .where(eq(user.id, parsed.userId))
      .limit(1);

    if (!target) {
      return { success: false, error: "User not found" };
    }

    if (
      parsed.suspended &&
      target.role === "admin" &&
      !target.suspended
    ) {
      const admins = await countAdmins();
      if (admins <= 1) {
        return { success: false, error: "Cannot suspend the last admin" };
      }
    }

    await getDb()
      .update(user)
      .set({ suspended: parsed.suspended, updatedAt: new Date() })
      .where(eq(user.id, parsed.userId));

    if (parsed.suspended) {
      await getDb().delete(session).where(eq(session.userId, parsed.userId));
    }

    await audit({
      action: parsed.suspended ? "user_suspend" : "user_reactivate",
      entityType: "user",
      entityId: parsed.userId,
    });

    revalidateUsers();
    return { success: true, id: parsed.userId };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return { success: false, error: "Forbidden" };
    }
    return { success: false, error: "Failed to update user status" };
  }
}

export async function deleteUser(input: {
  userId: string;
}): Promise<ActionResult> {
  try {
    const { audit, session: adminSession } = await beginAdminMutation();
    requireRole(adminSession, ["admin"]);

    const parsed = z.object({ userId: z.string().min(1) }).parse(input);

    if (parsed.userId === adminSession.user.id) {
      return { success: false, error: "You cannot delete your own account" };
    }

    const [target] = await getDb()
      .select({
        id: user.id,
        role: user.role,
        suspended: user.suspended,
      })
      .from(user)
      .where(eq(user.id, parsed.userId))
      .limit(1);

    if (!target) {
      return { success: false, error: "User not found" };
    }

    if (!target.suspended) {
      return {
        success: false,
        error: "Suspend the user before deleting",
      };
    }

    const adminId = await getFirstAdminUserId();
    if (!adminId) {
      return { success: false, error: "No admin available for reassignment" };
    }

    await getDb()
      .update(posts)
      .set({ authorId: adminId })
      .where(eq(posts.authorId, parsed.userId));
    await getDb()
      .update(caseStudies)
      .set({ authorId: adminId })
      .where(eq(caseStudies.authorId, parsed.userId));
    await getDb()
      .update(pages)
      .set({ authorId: adminId })
      .where(eq(pages.authorId, parsed.userId));

    await getDb().delete(session).where(eq(session.userId, parsed.userId));
    await getDb().delete(user).where(eq(user.id, parsed.userId));

    await audit({
      action: "user_delete",
      entityType: "user",
      entityId: parsed.userId,
      meta: { reassignedTo: adminId },
    });

    revalidateUsers();
    return { success: true, id: parsed.userId };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return { success: false, error: "Forbidden" };
    }
    console.error("[deleteUser]", error);
    return { success: false, error: "Failed to delete user" };
  }
}

export async function revokeInvitation(input: {
  invitationId: string;
}): Promise<ActionResult> {
  try {
    const { audit, session: adminSession } = await beginAdminMutation();
    requireRole(adminSession, ["admin"]);

    const parsed = z.object({ invitationId: z.string().uuid() }).parse(input);
    await getDb().delete(invitations).where(eq(invitations.id, parsed.invitationId));

    await audit({
      action: "user_invite_revoke",
      entityType: "invitation",
      entityId: parsed.invitationId,
    });

    revalidateUsers();
    return { success: true, id: parsed.invitationId };
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return { success: false, error: "Forbidden" };
    }
    return { success: false, error: "Failed to revoke invitation" };
  }
}

export type InvitePreview =
  | { valid: true; email: string; role: AppRole; expiresAt: Date }
  | { valid: false; error: string };

export async function getInvitationPreview(
  token: string,
): Promise<InvitePreview> {
  const tokenHash = hashInviteToken(token);
  const [row] = await getDb()
    .select({
      email: invitations.email,
      role: invitations.role,
      expiresAt: invitations.expiresAt,
      acceptedAt: invitations.acceptedAt,
    })
    .from(invitations)
    .where(eq(invitations.tokenHash, tokenHash))
    .limit(1);

  if (!row) {
    return { valid: false, error: "Invitation not found" };
  }
  if (row.acceptedAt) {
    return { valid: false, error: "Invitation already used" };
  }
  if (row.expiresAt.getTime() < Date.now()) {
    return { valid: false, error: "Invitation expired" };
  }

  return {
    valid: true,
    email: row.email,
    role: row.role as AppRole,
    expiresAt: row.expiresAt,
  };
}

export async function acceptInvitation(input: {
  token: string;
  name: string;
  password: string;
}): Promise<ActionResult & { email?: string }> {
  try {
    const parsed = z
      .object({
        token: z.string().min(20),
        name: z.string().trim().min(1).max(120),
        password: z
          .string()
          .min(12, "Password must be at least 12 characters"),
      })
      .parse(input);

    const tokenHash = hashInviteToken(parsed.token);
    const [invite] = await getDb()
      .select()
      .from(invitations)
      .where(eq(invitations.tokenHash, tokenHash))
      .limit(1);

    if (!invite) {
      return { success: false, error: "Invitation not found" };
    }
    if (invite.acceptedAt) {
      return { success: false, error: "Invitation already used" };
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      return { success: false, error: "Invitation expired" };
    }

    const [existing] = await getDb()
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, invite.email))
      .limit(1);

    if (existing) {
      return { success: false, error: "A user with this email already exists" };
    }

    const userId = randomUUID();
    const now = new Date();
    const passwordHash = await hashPassword(parsed.password);

    // neon-http does not support Drizzle .transaction(); run steps sequentially
    // and compensate on failure (account cascades when user is deleted).
    const db = getDb();
    let userCreated = false;
    try {
      await db.insert(user).values({
        id: userId,
        name: parsed.name,
        email: invite.email,
        emailVerified: true,
        role: invite.role,
        suspended: false,
        createdAt: now,
        updatedAt: now,
      });
      userCreated = true;

      await db.insert(account).values({
        id: randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      });

      await db
        .update(invitations)
        .set({ acceptedAt: now })
        .where(eq(invitations.id, invite.id));
    } catch (writeError) {
      if (userCreated) {
        try {
          await db.delete(user).where(eq(user.id, userId));
        } catch (cleanupError) {
          console.error("[acceptInvitation] cleanup failed", cleanupError);
        }
      }
      throw writeError;
    }

    const { logAudit } = await import("@/lib/audit");
    await logAudit({
      userId,
      action: "user_invite_accept",
      entityType: "user",
      entityId: userId,
      meta: { invitationId: invite.id, role: invite.role },
    });

    return { success: true, id: userId, email: invite.email };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Invalid input",
      };
    }
    console.error("[acceptInvitation]", error);
    return { success: false, error: "Failed to accept invitation" };
  }
}
