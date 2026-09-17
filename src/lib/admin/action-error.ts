import { RateLimitedError } from "@/lib/admin/mutation-guard";
import { z } from "zod";

/**
 * Maps common admin action failures to stable client-facing messages.
 * Prefer this in every server-action catch so Forbidden isn't swallowed.
 */
export function actionErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof RateLimitedError) {
    return error.message;
  }
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Validation failed";
  }
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return "Unauthorized";
    if (error.message === "Forbidden") return "Forbidden";
  }
  return fallback;
}
