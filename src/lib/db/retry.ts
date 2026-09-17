/**
 * Neon HTTP (`fetch`) can fail transiently when the compute is waking
 * or the local network blips. Retry a few times before surfacing.
 */

function collectErrorText(error: unknown, depth = 0): string {
  if (depth > 6 || error == null) return "";
  if (typeof error === "string") return error;
  if (typeof error !== "object") return String(error);

  const parts: string[] = [];
  if (error instanceof Error) {
    parts.push(error.message);
    parts.push(error.name);
  } else {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string") parts.push(record.message);
    if (typeof record.code === "string") parts.push(record.code);
  }

  const record = error as Record<string, unknown>;
  for (const key of ["cause", "error", "sourceError", "reason"]) {
    if (record[key] != null) {
      parts.push(collectErrorText(record[key], depth + 1));
    }
  }

  return parts.filter(Boolean).join(" ");
}

export function isTransientDbError(error: unknown): boolean {
  const text = collectErrorText(error).toLowerCase();
  return (
    text.includes("fetch failed") ||
    text.includes("failed to get session") ||
    text.includes("error connecting to database") ||
    text.includes("econnreset") ||
    text.includes("etimedout") ||
    text.includes("enotfound") ||
    text.includes("eai_again") ||
    text.includes("socket hang up") ||
    text.includes("network") ||
    text.includes("connection terminated") ||
    text.includes("server closed the connection") ||
    text.includes("neondberror") ||
    text.includes("failed query") ||
    text.includes("too many connections") ||
    text.includes("connection refused")
  );
}

export async function withDbRetry<T>(
  fn: () => Promise<T>,
  options?: { attempts?: number; delayMs?: number },
): Promise<T> {
  const attempts = options?.attempts ?? 5;
  const delayMs = options?.delayMs ?? 400;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isTransientDbError(error) || attempt === attempts - 1) {
        throw error;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, delayMs * (attempt + 1)),
      );
    }
  }

  throw lastError;
}

/** Run a query with retries; return fallback instead of crashing the page. */
export async function withDbFallback<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await withDbRetry(fn);
  } catch (error) {
    if (isTransientDbError(error)) {
      return fallback;
    }
    throw error;
  }
}
