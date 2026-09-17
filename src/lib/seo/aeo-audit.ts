import { parseKeyTakeaways, parsePostFaqs } from "@/lib/posts/aeo";
import type { PublishedPost } from "@/lib/queries/posts";

export type AeoPostFlag =
  | "missing_tldr"
  | "missing_takeaways"
  | "missing_faqs"
  | "stale";

export type AeoPostRow = {
  id: string;
  title: string;
  slug: string;
  editorHref: string;
  updatedAt: Date | null;
  flags: AeoPostFlag[];
};

const STALE_MS = 365 * 24 * 60 * 60 * 1000;

export function buildAeoPostRows(
  posts: Pick<
    PublishedPost,
    "id" | "title" | "slug" | "tldr" | "keyTakeaways" | "postFaqs" | "updatedAt"
  >[],
): AeoPostRow[] {
  const now = Date.now();

  return posts
    .map((post) => {
      const flags: AeoPostFlag[] = [];
      const takeaways = parseKeyTakeaways(post.keyTakeaways);
      const faqs = parsePostFaqs(post.postFaqs);
      const updatedAt =
        post.updatedAt instanceof Date
          ? post.updatedAt
          : post.updatedAt
            ? new Date(post.updatedAt)
            : null;

      if (!post.tldr?.trim()) {
        flags.push("missing_tldr");
      }
      if (takeaways.length === 0) {
        flags.push("missing_takeaways");
      }
      if (faqs.length === 0) {
        flags.push("missing_faqs");
      }
      if (
        !updatedAt ||
        Number.isNaN(updatedAt.getTime()) ||
        now - updatedAt.getTime() > STALE_MS
      ) {
        flags.push("stale");
      }

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        editorHref: `/admin/posts/${post.id}`,
        updatedAt:
          updatedAt && !Number.isNaN(updatedAt.getTime()) ? updatedAt : null,
        flags,
      };
    })
    .filter((row) => row.flags.length > 0)
    .sort((a, b) => b.flags.length - a.flags.length || a.title.localeCompare(b.title));
}
