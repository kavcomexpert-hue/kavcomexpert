"use server";

import { sendLeadNotification } from "@/lib/email/send-lead-notification";
import { getDb } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";
import { checkFormSpam } from "@/lib/security/form-spam";
import { verifyLeadTurnstile } from "@/lib/security/turnstile";
import { z } from "zod";

const leadSourceSchema = z.union([
  z.enum(["exit-intent", "newsletter"]),
  z.string().regex(/^popup:.+/, "Invalid popup source"),
]);

const leadCaptureSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().trim().email("Enter a valid email address"),
  source: leadSourceSchema,
  message: z.string().trim().optional(),
  website: z.string().trim().optional(),
  formStartedAt: z.number().optional(),
  turnstileToken: z.string().trim().optional(),
});

export type LeadCaptureState =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

export async function submitLeadCapture(
  input: z.input<typeof leadCaptureSchema>,
): Promise<LeadCaptureState> {
  try {
    const ip = await getClientIp();
    const limited = await checkRateLimit(
      `lead:capture:${ip}`,
      RATE_LIMITS.publicLead.max,
      RATE_LIMITS.publicLead.windowMs,
    );
    if (!limited.success) {
      return {
        success: false,
        error: "Too many requests. Please try again later.",
      };
    }

    const parsed = leadCaptureSchema.parse(input);

    const spam = checkFormSpam({
      website: parsed.website,
      formStartedAt: parsed.formStartedAt,
    });
    if (spam.discard) {
      return { success: true };
    }

    const turnstile = await verifyLeadTurnstile({
      token: parsed.turnstileToken,
      ip,
      source: parsed.source,
    });
    if (!turnstile.ok) {
      return { success: false, error: turnstile.error };
    }

    await getDb().insert(leads).values({
      name: parsed.name?.trim() || null,
      email: parsed.email,
      message: parsed.message?.trim() || null,
      source: parsed.source,
    });

    try {
      await sendLeadNotification({
        source: parsed.source,
        name: parsed.name,
        email: parsed.email,
        message: parsed.message,
      });
    } catch {
      // Lead is saved; email notification is best-effort.
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};

      for (const issue of error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }

      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
        fieldErrors,
      };
    }

    return { success: false, error: "Something went wrong. Please try again." };
  }
}
