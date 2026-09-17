"use server";

import { requireSession } from "@/lib/admin/session";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const eventSchema = z.object({
  action: z.enum([
    "two_factor_enable",
    "two_factor_disable",
    "two_factor_verify",
    "session_revoke",
    "password_change",
    "login_success",
    "login_failure",
  ]),
});

export async function logSecurityEvent(
  input: z.input<typeof eventSchema>,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await requireSession();
    const parsed = eventSchema.parse(input);

    await logAudit({
      userId: session.user.id,
      action: parsed.action,
      entityType: "security",
      entityId: session.user.id,
    });

    return { success: true };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to log security event" };
  }
}
