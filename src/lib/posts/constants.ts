export const POST_CATEGORIES = [
  { value: "tax-strategy", label: "Tax Strategy" },
  { value: "seo", label: "SEO" },
  { value: "web-development", label: "Web Development" },
  { value: "real-estate", label: "Real Estate" },
  { value: "aeo-geo", label: "AEO / GEO" },
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number]["value"];

export const POST_SCHEMA_TYPES = [
  "Article",
  "BlogPosting",
  "WebPage",
  "Service",
] as const;

export type PostSchemaType = (typeof POST_SCHEMA_TYPES)[number];

export const BLOG_PAGE_SIZE = 11;

export type TiptapContent = {
  type?: string;
  content?: TiptapContent[];
  text?: string;
};

export function extractTextFromTiptap(content: unknown): string {
  if (!content || typeof content !== "object") {
    return "";
  }

  const node = content as TiptapContent;

  if (node.text) {
    return node.text;
  }

  if (!node.content?.length) {
    return "";
  }

  return node.content.map(extractTextFromTiptap).join(" ");
}

/** Wrap plain text so SEO auditors that expect TipTap JSON can score pages/blocks. */
export function plainTextAsTiptapDoc(text: string): TiptapContent {
  const trimmed = text.trim();
  if (!trimmed) {
    return { type: "doc", content: [] };
  }

  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: trimmed }],
      },
    ],
  };
}

export function computeReadingMinutes(content: unknown): number {
  const text = extractTextFromTiptap(content);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Turn a slug like `web-development` into `Web development`. */
export function humanizeCategorySlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part, index) =>
      index === 0
        ? part.charAt(0).toUpperCase() + part.slice(1)
        : part.toLowerCase(),
    )
    .join(" ");
}

export function formatPostCategory(category: string | null | undefined): string {
  if (!category) {
    return "N/A";
  }

  return (
    POST_CATEGORIES.find((item) => item.value === category)?.label ??
    humanizeCategorySlug(category)
  );
}

/** Prefer taxonomy table name when provided. */
export function resolveCategoryLabel(
  slug: string | null | undefined,
  taxonomyName?: string | null,
): string {
  if (taxonomyName?.trim()) {
    return taxonomyName.trim();
  }
  return formatPostCategory(slug);
}
