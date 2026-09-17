import type { PostFaq } from "@/lib/posts/aeo";
import type { TiptapContent } from "@/lib/posts/constants";
import { extractTextFromTiptap } from "@/lib/posts/constants";
import { formatPostCategory } from "@/lib/posts/constants";
import type { PublishedPost } from "@/lib/queries/posts";
import { postPath } from "@/lib/paths";
import { absoluteUrl } from "@/lib/seo/constants";

type TiptapNode = TiptapContent & {
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  attrs?: Record<string, unknown>;
};

function renderInline(node: TiptapNode): string {
  if (node.type === "text") {
    let text = node.text ?? "";
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") {
        text = `**${text}**`;
      } else if (mark.type === "italic") {
        text = `*${text}*`;
      } else if (mark.type === "code") {
        text = `\`${text}\``;
      } else if (mark.type === "link") {
        const href =
          typeof mark.attrs?.href === "string" ? mark.attrs.href : "#";
        text = `[${text}](${href})`;
      }
    }
    return text;
  }

  return node.content?.map((child) => renderInline(child as TiptapNode)).join("") ?? "";
}

function renderBlock(node: TiptapNode): string {
  switch (node.type) {
    case "doc":
      return node.content?.map((child) => renderBlock(child as TiptapNode)).join("\n\n") ?? "";
    case "paragraph":
      return renderInline(node);
    case "heading": {
      const level = node.attrs?.level === 3 ? "###" : "##";
      const text =
        node.content
          ?.map((child) => renderInline(child as TiptapNode))
          .join("") ?? "";
      return `${level} ${text}`;
    }
    case "bulletList":
      return (
        node.content
          ?.map((item) => {
            const text =
              item.content
                ?.map((child) => renderBlock(child as TiptapNode))
                .join("") ?? "";
            return `- ${text}`;
          })
          .join("\n") ?? ""
      );
    case "orderedList":
      return (
        node.content
          ?.map((item, index) => {
            const text =
              item.content
                ?.map((child) => renderBlock(child as TiptapNode))
                .join("") ?? "";
            return `${index + 1}. ${text}`;
          })
          .join("\n") ?? ""
      );
    case "listItem":
      return node.content?.map((child) => renderBlock(child as TiptapNode)).join("") ?? "";
    case "blockquote":
      return (
        node.content
          ?.map((child) => `> ${renderBlock(child as TiptapNode)}`)
          .join("\n") ?? ""
      );
    case "codeBlock":
      return `\`\`\`\n${node.content?.map((child) => child.text ?? "").join("") ?? ""}\n\`\`\``;
    case "horizontalRule":
      return "---";
    case "hardBreak":
      return "\n";
    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      return src ? `![${alt}](${src})` : "";
    }
    default:
      return "";
  }
}

export function postToMarkdown(
  post: Pick<
    PublishedPost,
    | "title"
    | "tldr"
    | "excerpt"
    | "metaDescription"
    | "publishedAt"
    | "updatedAt"
    | "category"
    | "slug"
    | "keyTakeaways"
    | "content"
    | "postFaqs"
  >,
): string {
  const lines: string[] = [
    `# ${post.title}`,
    "",
    `> ${post.tldr?.trim() ?? post.excerpt?.trim() ?? post.metaDescription}`,
    "",
    `- **Published:** ${post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 10) : "N/A"}`,
    `- **Updated:** ${post.updatedAt ? new Date(post.updatedAt).toISOString().slice(0, 10) : "N/A"}`,
    `- **Category:** ${formatPostCategory(post.category)}`,
    `- **URL:** ${absoluteUrl(postPath(post.slug))}`,
    "",
  ];

  const takeaways = Array.isArray(post.keyTakeaways)
    ? (post.keyTakeaways as string[]).filter(Boolean)
    : [];

  if (takeaways.length > 0) {
    lines.push("## Key takeaways", "");
    for (const item of takeaways) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }

  if (post.content) {
    lines.push(renderBlock(post.content as TiptapNode), "");
  }

  const faqs = Array.isArray(post.postFaqs)
    ? (post.postFaqs as PostFaq[])
    : [];

  if (faqs.length > 0) {
    lines.push("## FAQs", "");
    for (const faq of faqs) {
      if (faq.q && faq.a) {
        lines.push(`### ${faq.q}`, "", faq.a, "");
      }
    }
  }

  return lines.join("\n").trim() + "\n";
}

export function extractPlainTextFromPost(post: PublishedPost): string {
  return extractTextFromTiptap(post.content);
}
