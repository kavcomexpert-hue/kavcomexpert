import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { extractTextFromTiptap } from "@/lib/posts/constants";
import { classifyImageSrc } from "@/lib/site/image-src";
import { textLooksLikeUrl } from "@/lib/tiptap/serialize";
import { normalizeHeadingLevel } from "@/lib/posts/headings";
import { SITE_URL } from "@/lib/seo/constants";
import slugify from "slugify";

type TiptapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

type TiptapNode = {
  type: string;
  text?: string;
  marks?: TiptapMark[];
  content?: TiptapNode[];
  attrs?: Record<string, unknown>;
};

type RichTextProps = {
  content: unknown;
  className?: string;
  headingIds?: Map<string, string>;
};

function parseImageDimensions(src: string) {
  try {
    const url = new URL(src, "https://placeholder.local");
    const width = Number(url.searchParams.get("w"));
    const height = Number(url.searchParams.get("h"));

    if (width > 0 && height > 0) {
      return { width, height };
    }
  } catch {
    return null;
  }

  return null;
}

function applyMarks(text: string, marks: TiptapMark[] | undefined): ReactNode {
  if (!marks?.length) {
    return text;
  }

  return marks.reduce<ReactNode>((node, mark) => {
    switch (mark.type) {
      case "bold":
        return <strong>{node}</strong>;
      case "italic":
        return <em>{node}</em>;
      case "strike":
        return <s>{node}</s>;
      case "code":
        return (
          <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
            {node}
          </code>
        );
      case "link": {
        // Older saves stripped mark.attrs via React Flight; recover when the
        // linked text itself is a URL (e.g. "pagespeed.web.dev").
        const rawAttrs =
          typeof mark.attrs?.href === "string" ? mark.attrs.href.trim() : "";
        const rawFallback =
          !rawAttrs && textLooksLikeUrl(text) ? text.trim() : "";
        const href = sanitizeHref(rawAttrs || rawFallback);
        if (!href) {
          return node;
        }
        const isExternal =
          href.startsWith("http://") || href.startsWith("https://");

        return (
          <Link
            href={href}
            className="group/link relative text-accent underline decoration-accent/30 underline-offset-4 transition-colors hover:text-foreground hover:decoration-accent"
            {...(isExternal
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {node}
          </Link>
        );
      }
      default:
        return node;
    }
  }, text);
}

/** Whitelist safe link protocols; block javascript:/data: XSS vectors. */
function sanitizeHref(href: string): string | null {
  if (!href) return null;
  const trimmed = href.trim();
  if (!trimmed || trimmed === "#") return null;

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:")
  ) {
    return null;
  }

  // Internal relative links
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;

  // Common schemes
  if (
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  ) {
    // If it's an absolute URL to our own site, normalize it back to a
    // relative path so it's treated as internal.
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      try {
        const url = new URL(trimmed);
        const siteHost = new URL(SITE_URL).hostname;
        const hosts = new Set([
          siteHost,
          siteHost.replace(/^www\./, ""),
          `www.${siteHost.replace(/^www\./, "")}`,
        ]);
        if (hosts.has(url.hostname)) {
          return `${url.pathname}${url.search}${url.hash}`;
        }
      } catch {
        // Fall back to returning the original URL.
      }
    }
    return trimmed;
  }

  // Protocol-less URLs like `example.com` or `www.example.com` become https.
  // Also support paths without a leading `/` (e.g. `blog/foo`).
  if (/^(www\.)?[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  const internalNoSlash =
    /^(blog|services|work|careers|case-studies)(\/.*)?$/i;
  if (internalNoSlash.test(lower) && !trimmed.startsWith("/")) {
    return `/${trimmed}`;
  }

  return null;
}

function getHeadingText(node: TiptapNode): string {
  return extractTextFromTiptap(node).replace(/\s+/g, " ").trim();
}

function resolveHeadingId(
  text: string,
  headingIds: Map<string, string> | undefined,
  usedFallbackIds: Set<string>,
): string | undefined {
  const normalized = text.replace(/\s+/g, " ").trim();
  const mapped = headingIds?.get(normalized);
  if (mapped) {
    return mapped;
  }

  const base =
    slugify(normalized, {
      lower: true,
      strict: true,
      trim: true,
    }) || "section";

  let id = base;
  let counter = 2;

  while (usedFallbackIds.has(id)) {
    id = `${base}-${counter}`;
    counter += 1;
  }

  usedFallbackIds.add(id);
  return id;
}

function renderNode(
  node: TiptapNode,
  key: string,
  headingIds?: Map<string, string>,
  usedFallbackIds?: Set<string>,
): ReactNode {
  switch (node.type) {
    case "doc":
      return node.content?.map((child, index) =>
        renderNode(child, `${key}-${index}`, headingIds, usedFallbackIds),
      );
    case "paragraph": {
      const children = node.content?.map((child, index) =>
        renderNode(child, `${key}-${index}`, headingIds, usedFallbackIds),
      );
      const hasContent = Boolean(
        node.content?.some(
          (child) =>
            child.type === "image" ||
            child.type === "hardBreak" ||
            (child.type === "text" && child.text?.trim()),
        ),
      );
      if (!hasContent) {
        return null;
      }
      return <p key={key}>{children}</p>;
    }
    case "text":
      return (
        <span key={key}>{applyMarks(node.text ?? "", node.marks)}</span>
      );
    case "heading": {
      const level = normalizeHeadingLevel(node.attrs?.level);
      const text = getHeadingText(node);
      // TOC lists H2s; always stamp matching ids so Lenis hash scroll finds targets.
      const id =
        level === 2 && usedFallbackIds
          ? resolveHeadingId(text, headingIds, usedFallbackIds)
          : undefined;

      const children = node.content?.map((child, index) =>
        renderNode(child, `${key}-${index}`, headingIds, usedFallbackIds),
      );

      if (level >= 3) {
        return <h3 key={key}>{children}</h3>;
      }

      return (
        <h2 key={key} id={id} className={id ? "scroll-mt-28" : undefined}>
          {children}
        </h2>
      );
    }
    case "bulletList":
      return (
        <ul key={key}>
          {node.content?.map((child, index) =>
            renderNode(child, `${key}-${index}`, headingIds, usedFallbackIds),
          )}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={key}>
          {node.content?.map((child, index) =>
            renderNode(child, `${key}-${index}`, headingIds, usedFallbackIds),
          )}
        </ol>
      );
    case "listItem":
      return (
        <li key={key}>
          {node.content?.map((child, index) =>
            renderNode(child, `${key}-${index}`, headingIds, usedFallbackIds),
          )}
        </li>
      );
    case "blockquote":
      return (
        <blockquote
          key={key}
          className="border-l-2 border-accent pl-4 text-muted"
        >
          {node.content?.map((child, index) =>
            renderNode(child, `${key}-${index}`, headingIds, usedFallbackIds),
          )}
        </blockquote>
      );
    case "codeBlock":
      return (
        <pre
          key={key}
          className="overflow-x-auto rounded-default border border-border bg-surface p-4 font-mono text-sm text-foreground"
        >
          <code>
            {node.content
              ?.map((child) => (child.type === "text" ? child.text : ""))
              .join("")}
          </code>
        </pre>
      );
    case "horizontalRule":
      return <hr key={key} className="my-8 border-border" />;
    case "hardBreak":
      return <br key={key} />;
    case "image": {
      const rawSrc = typeof node.attrs?.src === "string" ? node.attrs.src : "";
      const src = sanitizeHref(rawSrc);
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      const dimensions = src ? parseImageDimensions(src) : null;

      if (!src || src.startsWith("mailto:") || src.startsWith("tel:") || src.startsWith("#")) {
        return null;
      }

      const srcKind = classifyImageSrc(src);
      if (srcKind === "invalid") {
        return null;
      }

      return (
        <figure key={key} className="my-8">
          <Image
            src={src}
            alt={alt.trim() || "Article illustration"}
            width={dimensions?.width ?? 1200}
            height={dimensions?.height ?? 675}
            sizes="(max-width: 720px) 100vw, 720px"
            loading="lazy"
            unoptimized={srcKind === "unoptimized"}
            className="h-auto w-full rounded-default border border-border"
          />
        </figure>
      );
    }
    case "table":
      return (
        <div key={key} className="rich-text-table-wrap my-8 overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
            <tbody>
              {node.content?.map((child, index) =>
                renderNode(child, `${key}-${index}`, headingIds, usedFallbackIds),
              )}
            </tbody>
          </table>
        </div>
      );
    case "tableRow":
      return (
        <tr key={key} className="border-b border-border">
          {node.content?.map((child, index) =>
            renderNode(child, `${key}-${index}`, headingIds, usedFallbackIds),
          )}
        </tr>
      );
    case "tableHeader": {
      const colspan =
        typeof node.attrs?.colspan === "number" && node.attrs.colspan > 1
          ? node.attrs.colspan
          : undefined;
      const rowspan =
        typeof node.attrs?.rowspan === "number" && node.attrs.rowspan > 1
          ? node.attrs.rowspan
          : undefined;
      return (
        <th
          key={key}
          colSpan={colspan}
          rowSpan={rowspan}
          className="border border-border bg-surface px-3 py-2 font-medium text-foreground"
        >
          {node.content?.map((child, index) =>
            renderNode(child, `${key}-${index}`, headingIds, usedFallbackIds),
          )}
        </th>
      );
    }
    case "tableCell": {
      const colspan =
        typeof node.attrs?.colspan === "number" && node.attrs.colspan > 1
          ? node.attrs.colspan
          : undefined;
      const rowspan =
        typeof node.attrs?.rowspan === "number" && node.attrs.rowspan > 1
          ? node.attrs.rowspan
          : undefined;
      return (
        <td
          key={key}
          colSpan={colspan}
          rowSpan={rowspan}
          className="border border-border px-3 py-2 text-foreground"
        >
          {node.content?.map((child, index) =>
            renderNode(child, `${key}-${index}`, headingIds, usedFallbackIds),
          )}
        </td>
      );
    }
    default:
      return null;
  }
}

export function RichText({
  content,
  className = "",
  headingIds,
}: RichTextProps) {
  if (!content || typeof content !== "object") {
    return null;
  }

  const usedFallbackIds = new Set<string>();

  return (
    <div className={`rich-text tiptap-content text-foreground ${className}`.trim()}>
      {renderNode(content as TiptapNode, "root", headingIds, usedFallbackIds)}
    </div>
  );
}
