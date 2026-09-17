import { z } from "zod";

/** Reusable admin-editable link button. Position/style stay in code. */
export type LinkButton = {
  label: string;
  href: string;
  enabled: boolean;
};

export const linkButtonSchema = z.object({
  label: z.string(),
  href: z.string(),
  enabled: z.boolean(),
});

export function linkButton(
  label: string,
  href: string,
  enabled = true,
): LinkButton {
  return { label, href, enabled };
}

/**
 * Normalize any stored value into a LinkButton.
 * Accepts full objects, legacy `{ text }` label-only blocks, or null.
 */
export function normalizeLinkButton(
  value: unknown,
  defaults: LinkButton,
): LinkButton {
  if (!value || typeof value !== "object") {
    return { ...defaults };
  }

  const record = value as Record<string, unknown>;
  const labelFromText =
    typeof record.text === "string" && record.text.trim()
      ? record.text
      : undefined;
  const label =
    typeof record.label === "string" && record.label.trim()
      ? record.label
      : (labelFromText ?? defaults.label);
  const href =
    typeof record.href === "string" && record.href.trim()
      ? record.href.trim()
      : defaults.href;
  const enabled =
    typeof record.enabled === "boolean" ? record.enabled : defaults.enabled;

  return { label, href, enabled };
}

export const linkButtonZodField = (defaults: LinkButton) =>
  z
    .unknown()
    .nullish()
    .transform((value) => normalizeLinkButton(value, defaults));

/** Absolute http(s), protocol-relative, mailto, or tel → open in new tab. */
export function isExternalHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("mailto:") || trimmed.startsWith("tel:")) return true;
  if (trimmed.startsWith("//")) return true;
  return /^https?:\/\//i.test(trimmed);
}

export function linkButtonAnchorProps(href: string): {
  target?: "_blank";
  rel?: "noopener noreferrer";
} {
  if (!isExternalHref(href)) return {};
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return {};
  return { target: "_blank", rel: "noopener noreferrer" };
}
