import slugify from "slugify";
import type { TiptapContent } from "@/lib/posts/constants";
import { extractTextFromTiptap } from "@/lib/posts/constants";

type TiptapNode = TiptapContent & {
  attrs?: Record<string, unknown>;
};

export type ContentHeading = {
  id: string;
  text: string;
  level: number;
};

/** Normalize Tiptap heading level (JSON may store "2" as a string). */
export function normalizeHeadingLevel(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5 || n === 6) {
    return n;
  }
  return 2;
}

export function slugifyHeading(text: string, usedIds: Set<string>): string {
  const base =
    slugify(text, {
      lower: true,
      strict: true,
      trim: true,
    }) || "section";

  let id = base;
  let counter = 2;

  while (usedIds.has(id)) {
    id = `${base}-${counter}`;
    counter += 1;
  }

  usedIds.add(id);
  return id;
}

export function extractHeadings(content: unknown): ContentHeading[] {
  if (!content || typeof content !== "object") {
    return [];
  }

  const headings: ContentHeading[] = [];
  const usedIds = new Set<string>();

  function walk(node: TiptapNode) {
    if (node.type === "heading") {
      const level = normalizeHeadingLevel(node.attrs?.level);
      const text = extractTextFromTiptap(node).replace(/\s+/g, " ").trim();

      if (text && level === 2) {
        headings.push({
          id: slugifyHeading(text, usedIds),
          text,
          level,
        });
      }
    }

    node.content?.forEach(walk);
  }

  walk(content as TiptapNode);
  return headings;
}

export function createHeadingIdRegistry(content: unknown): Map<string, string> {
  const headings = extractHeadings(content);
  return new Map(headings.map((heading) => [heading.text, heading.id]));
}
