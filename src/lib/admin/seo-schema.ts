import { z } from "zod";
import { POST_SCHEMA_TYPES } from "@/lib/posts/constants";

export const schemaTypeSchema = z.enum(POST_SCHEMA_TYPES);

export const seoInputSchema = z.object({
  metaTitle: z.string(),
  metaDescription: z.string(),
  focusKeyword: z.string().optional(),
  secondaryKeywords: z.string().optional(),
  schemaType: schemaTypeSchema.default("WebPage"),
  schemaJson: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  noIndex: z.boolean().default(false),
  socialTitle: z.string().optional(),
  socialDescription: z.string().optional(),
  noFollow: z.boolean().optional(),
  noArchive: z.boolean().optional(),
  sitemapInclude: z.boolean().default(true),
  sitemapPriority: z.string().optional(),
});

export function applyPublishSeoRules(
  data: {
    status: string;
    metaTitle: string;
    metaDescription: string;
  },
  ctx: z.RefinementCtx,
) {
  if (data.status !== "published" && data.status !== "scheduled") {
    return;
  }

  if (!data.metaTitle.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Meta title is required to publish",
      path: ["metaTitle"],
    });
  }

  if (!data.metaDescription.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Meta description is required to publish",
      path: ["metaDescription"],
    });
  }

  if (data.metaTitle.length > 70) {
    ctx.addIssue({
      code: "custom",
      message: "Meta title must be 70 characters or fewer to publish",
      path: ["metaTitle"],
    });
  }

  if (data.metaDescription.length > 170) {
    ctx.addIssue({
      code: "custom",
      message: "Meta description must be 170 characters or fewer to publish",
      path: ["metaDescription"],
    });
  }
}

export function parseSchemaJson(raw: string | undefined | null): unknown | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    throw new Error("Custom schema JSON is invalid");
  }
}

export function seoDbValues(
  parsed: z.infer<typeof seoInputSchema>,
  fallbacks: { title: string; description?: string },
) {
  let schemaJson: unknown | null = null;
  if (parsed.schemaJson?.trim()) {
    schemaJson = parseSchemaJson(parsed.schemaJson);
  }

  return {
    metaTitle: parsed.metaTitle.trim() || fallbacks.title,
    metaDescription:
      parsed.metaDescription.trim() ||
      fallbacks.description?.trim() ||
      fallbacks.title,
    ogImage: parsed.ogImage?.trim() || null,
    canonicalUrl: parsed.canonicalUrl?.trim() || null,
    schemaType: parsed.schemaType,
    noIndex: parsed.noIndex,
    focusKeyword: parsed.focusKeyword?.trim() || null,
    secondaryKeywords: parsed.secondaryKeywords?.trim() || null,
    schemaJson,
    sitemapInclude: parsed.sitemapInclude ?? true,
    sitemapPriority: parsed.sitemapPriority?.trim() || "0.7",
  };
}
