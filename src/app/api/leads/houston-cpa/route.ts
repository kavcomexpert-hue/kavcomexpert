import { sendHoustonCpaConfirmation } from "@/lib/email/send-houston-cpa-confirmation";
import { sendLeadNotification } from "@/lib/email/send-lead-notification";
import { getDb } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";
import { checkFormSpam } from "@/lib/security/form-spam";
import {
  BOOKING_URL,
  FIRM_SIZE_OPTIONS,
  HOUSTON_CPA_PATH,
  SERVICE_OPTIONS,
  SPEND_OPTIONS,
} from "@/components/houston-cpa/constants";
import { NextResponse } from "next/server";
import { z } from "zod";

const firmSizes = FIRM_SIZE_OPTIONS.map((o) => o.value) as [
  string,
  ...string[],
];
const spendValues = SPEND_OPTIONS.map((o) => o.value) as [string, ...string[]];
const serviceValues = [...SERVICE_OPTIONS] as [string, ...string[]];

const schema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  email: z.string().trim().email("Enter a valid work email"),
  firmName: z.string().trim().min(1, "Firm name is required"),
  phone: z.string().trim().min(7, "Phone number is required"),
  firmSize: z.enum(firmSizes),
  primaryNeed: z.enum(serviceValues),
  monthlySpend: z.enum(spendValues),
  message: z.string().trim().optional(),
  website: z.string().trim().optional(),
  formStartedAt: z.number().optional(),
  utmSource: z.string().trim().optional(),
  utmMedium: z.string().trim().optional(),
  utmCampaign: z.string().trim().optional(),
  utmContent: z.string().trim().optional(),
});

function buildStoredMessage(parsed: z.infer<typeof schema>): string {
  const firmLabel =
    FIRM_SIZE_OPTIONS.find((o) => o.value === parsed.firmSize)?.label ??
    parsed.firmSize;
  const spendLabel =
    SPEND_OPTIONS.find((o) => o.value === parsed.monthlySpend)?.label ??
    parsed.monthlySpend;

  const lines = [
    `Phone: ${parsed.phone}`,
    `Firm size: ${firmLabel}`,
    `Primary need: ${parsed.primaryNeed}`,
    `Current monthly marketing spend: ${spendLabel}`,
    parsed.utmSource ? `utm_source: ${parsed.utmSource}` : null,
    parsed.utmMedium ? `utm_medium: ${parsed.utmMedium}` : null,
    parsed.utmCampaign ? `utm_campaign: ${parsed.utmCampaign}` : null,
    parsed.utmContent ? `utm_content: ${parsed.utmContent}` : null,
    "",
    parsed.message?.trim() || "(no additional message)",
  ].filter((line) => line !== null);

  return lines.join("\n");
}

export async function POST(request: Request) {
  try {
    const ip = await getClientIp();
    const limited = await checkRateLimit(
      `lead:houston-cpa:${ip}`,
      RATE_LIMITS.publicLead.max,
      RATE_LIMITS.publicLead.windowMs,
    );
    if (!limited.success) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400 },
      );
    }

    const parsed = schema.parse(body);

    const spam = checkFormSpam({
      website: parsed.website,
      formStartedAt: parsed.formStartedAt,
    });
    if (spam.discard) {
      return NextResponse.json({ success: true });
    }

    const message = buildStoredMessage(parsed);

    await getDb().insert(leads).values({
      name: parsed.fullName,
      email: parsed.email,
      company: parsed.firmName,
      message,
      source: "houston-cpa",
      path: HOUSTON_CPA_PATH,
    });

    try {
      await sendLeadNotification({
        source: "houston-cpa",
        name: parsed.fullName,
        email: parsed.email,
        company: parsed.firmName,
        message,
        path: HOUSTON_CPA_PATH,
      });
    } catch {
      // Lead saved; notification is best-effort.
    }

    try {
      await sendHoustonCpaConfirmation({
        name: parsed.fullName,
        email: parsed.email,
        bookingUrl: BOOKING_URL,
      });
    } catch {
      // Confirmation is best-effort.
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      return NextResponse.json(
        {
          success: false,
          error: error.issues[0]?.message ?? "Validation failed",
          fieldErrors,
        },
        { status: 400 },
      );
    }

    console.error("[houston-cpa lead]", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
