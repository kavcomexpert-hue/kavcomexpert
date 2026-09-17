import { createHmac, timingSafeEqual } from "node:crypto";
import {
  caseStudyPath,
  jobPath,
  pagePath,
  postPath,
  servicePath,
} from "@/lib/paths";

export type PreviewEntityType =
  | "post"
  | "page"
  | "case_study"
  | "service"
  | "job";

export type PreviewTokenPayload = {
  type: PreviewEntityType;
  id: string;
  slug: string;
  userId: string;
  exp: number;
  /** Parent service slug for nested service URLs. */
  parentSlug?: string | null;
};

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function previewSecret(): string {
  const secret =
    process.env.PREVIEW_SECRET?.trim() ||
    process.env.BETTER_AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("PREVIEW_SECRET or BETTER_AUTH_SECRET is required");
  }
  return secret;
}

function encodePayload(payload: PreviewTokenPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(encoded: string): PreviewTokenPayload | null {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as PreviewTokenPayload;
    if (
      !parsed ||
      (parsed.type !== "post" &&
        parsed.type !== "page" &&
        parsed.type !== "case_study" &&
        parsed.type !== "service" &&
        parsed.type !== "job") ||
      typeof parsed.id !== "string" ||
      typeof parsed.slug !== "string" ||
      typeof parsed.userId !== "string" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function sign(encoded: string): string {
  return createHmac("sha256", previewSecret())
    .update(encoded)
    .digest("base64url");
}

export function createPreviewToken(input: {
  type: PreviewEntityType;
  id: string;
  slug: string;
  userId: string;
  parentSlug?: string | null;
  ttlMs?: number;
}): string {
  const payload: PreviewTokenPayload = {
    type: input.type,
    id: input.id,
    slug: input.slug,
    userId: input.userId,
    exp: Date.now() + (input.ttlMs ?? TOKEN_TTL_MS),
    ...(input.parentSlug ? { parentSlug: input.parentSlug } : {}),
  };
  const encoded = encodePayload(payload);
  return `${encoded}.${sign(encoded)}`;
}

export function verifyPreviewToken(token: string): PreviewTokenPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  const payload = decodePayload(encoded);
  if (!payload) return null;
  if (payload.exp < Date.now()) return null;
  return payload;
}

export function publicPathForPreview(
  type: PreviewEntityType,
  slug: string,
  path?: string | null,
  parentSlug?: string | null,
): string {
  if (type === "post") return postPath(slug);
  if (type === "case_study") return caseStudyPath(slug);
  if (type === "job") return jobPath(slug);
  if (type === "service") {
    return servicePath({ slug, parentSlug: parentSlug?.trim() || null });
  }
  if (path?.trim()) {
    return pagePath(path);
  }
  return pagePath(slug);
}
