/**
 * Shared emptiness helpers so optional frontend sections never render blanks.
 */

export function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function hasItems<T>(
  value: readonly T[] | null | undefined,
): value is readonly [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}

export function hasRichDoc(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value !== "object") return false;
  const doc = value as { type?: string; content?: unknown[] };
  if (!Array.isArray(doc.content) || doc.content.length === 0) return false;
  return JSON.stringify(doc.content).replace(/\s/g, "").length > 20;
}
