import { logAudit } from "@/lib/audit";
import {
  getTurnstileSecret,
  isTurnstileServerEnabled,
  TURNSTILE_FAILURE_MESSAGE,
} from "@/lib/security/turnstile-config";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileVerifyResult =
  | { success: true }
  | { success: false; errorCodes?: string[] };

/**
 * Canonical Cloudflare Turnstile siteverify.
 * Fail closed on network / non-2xx / unsuccessful response.
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteip: string,
): Promise<TurnstileVerifyResult> {
  if (!isTurnstileServerEnabled()) {
    return { success: true };
  }

  const secret = getTurnstileSecret();
  if (!secret) {
    return { success: true };
  }

  if (!token?.trim()) {
    return { success: false, errorCodes: ["missing-input-response"] };
  }

  const body = new URLSearchParams({
    secret,
    response: token.trim(),
    remoteip,
  });

  let data: { success: boolean; "error-codes"?: string[] };

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) {
      return { success: false, errorCodes: ["internal-error"] };
    }
    data = (await res.json()) as typeof data;
  } catch {
    return { success: false, errorCodes: ["internal-error"] };
  }

  if (!data.success) {
    return { success: false, errorCodes: data["error-codes"] };
  }

  return { success: true };
}

export async function verifyLeadTurnstile(input: {
  token?: string | null;
  ip: string;
  source: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isTurnstileServerEnabled()) {
    return { ok: true };
  }

  const result = await verifyTurnstileToken(input.token, input.ip);
  if (result.success) {
    return { ok: true };
  }

  void logAudit({
    action: "turnstile_failure",
    entityType: "lead_form",
    meta: {
      source: input.source,
      errorCodes: result.errorCodes ?? null,
    },
    ip: input.ip,
  });

  return { ok: false, error: TURNSTILE_FAILURE_MESSAGE };
}
