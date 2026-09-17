"use server";

import { sendLeadNotification } from "@/lib/email/send-lead-notification";
import { getDb } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";
import { checkFormSpam } from "@/lib/security/form-spam";
import { verifyLeadTurnstile } from "@/lib/security/turnstile";
import { z } from "zod";

const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  company: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  /** Real company website (not the honeypot). */
  companyWebsite: z.string().trim().optional(),
  /** Honeypot — must stay empty. */
  website: z.string().trim().optional(),
  formStartedAt: z.number().optional(),
  service: z.string().trim().optional(),
  budget: z.string().trim().optional(),
  message: z.string().trim().min(1, "Message is required"),
  turnstileToken: z.string().trim().optional(),
});

export type ContactFormState =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

function buildStoredMessage(
  parsed: z.infer<typeof contactFormSchema>,
): string {
  const details = [
    parsed.phone ? `Phone: ${parsed.phone}` : null,
    parsed.companyWebsite ? `Website: ${parsed.companyWebsite}` : null,
    parsed.service ? `Service interest: ${parsed.service}` : null,
    parsed.budget ? `Budget: ${parsed.budget}` : null,
  ].filter(Boolean);

  if (details.length === 0) {
    return parsed.message;
  }

  return `${details.join("\n")}\n\n${parsed.message}`;
}

export async function submitContactForm(
  input: z.input<typeof contactFormSchema>,
): Promise<ContactFormState> {
  try {
    const ip = await getClientIp();
    const limited = await checkRateLimit(
      `lead:contact:${ip}`,
      RATE_LIMITS.publicLead.max,
      RATE_LIMITS.publicLead.windowMs,
    );
    if (!limited.success) {
      return {
        success: false,
        error: "Too many requests. Please try again later.",
      };
    }

    const parsed = contactFormSchema.parse(input);

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
      source: "contact",
    });
    if (!turnstile.ok) {
      return { success: false, error: turnstile.error };
    }

    const message = buildStoredMessage(parsed);

    await getDb().insert(leads).values({
      name: parsed.name,
      email: parsed.email,
      company: parsed.company?.trim() || null,
      message,
      source: "contact",
      path: "/contact-us",
    });

    try {
      await sendLeadNotification({
        source: "contact",
        name: parsed.name,
        email: parsed.email,
        company: parsed.company,
        message,
        path: "/contact-us",
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
