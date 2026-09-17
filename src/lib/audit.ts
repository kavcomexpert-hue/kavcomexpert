import { getDb } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { getClientIp } from "@/lib/security/client-ip";
import { lt } from "drizzle-orm";

const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "unpublish"
  | "reorder"
  | "settings_change"
  | "login_success"
  | "login_failure"
  | "two_factor_enable"
  | "two_factor_disable"
  | "two_factor_verify"
  | "session_revoke"
  | "password_change"
  | "export"
  | "upload";

export type LogAuditInput = {
  userId?: string | null;
  action: AuditAction | string;
  entityType: string;
  entityId?: string | null;
  meta?: Record<string, unknown> | null;
  ip?: string | null;
};

export async function logAudit(input: LogAuditInput): Promise<void> {
  try {
    const ip = input.ip ?? (await getClientIp());

    await getDb().insert(auditLog).values({
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      meta: input.meta ?? null,
      ip,
    });

    const cutoff = new Date(Date.now() - RETENTION_MS);
    await getDb().delete(auditLog).where(lt(auditLog.createdAt, cutoff));
  } catch (error) {
    console.error("[audit] failed to write audit log", error);
  }
}
