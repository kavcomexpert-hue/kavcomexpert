/**
 * Minimal HTML → TipTap JSON converter for WordPress content.
 * Supports paragraphs, headings, lists, blockquotes, images, links, bold/italic.
 */

export type TiptapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type TiptapNode = {
  type: string;
  text?: string;
  marks?: TiptapMark[];
  content?: TiptapNode[];
  attrs?: Record<string, unknown>;
};

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) =>
      String.fromCharCode(parseInt(n, 16)),
    );
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, "")).trim();
}

function parseInline(html: string): TiptapNode[] {
  const nodes: TiptapNode[] = [];
  const pattern =
    /<(a|strong|b|em|i|code|br)\b([^>]*)>([\s\S]*?)<\/\1>|<(br)\s*\/?>|([^<]+)/gi;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    if (match[5]) {
      const text = decodeEntities(match[5]);
      if (text) {
        nodes.push({ type: "text", text });
      }
      continue;
    }

    if (match[4] === "br" || match[1]?.toLowerCase() === "br") {
      nodes.push({ type: "hardBreak" });
      continue;
    }

    const tag = match[1].toLowerCase();
    const attrs = match[2] ?? "";
    const inner = match[3] ?? "";

    if (tag === "a") {
      const href = (attrs.match(/href=["']([^"']+)["']/i) || [])[1] ?? "#";
      const children = parseInline(inner);
      for (const child of children) {
        if (child.type === "text") {
          child.marks = [
            ...(child.marks ?? []),
            { type: "link", attrs: { href } },
          ];
        }
        nodes.push(child);
      }
      continue;
    }

    const markType =
      tag === "strong" || tag === "b"
        ? "bold"
        : tag === "em" || tag === "i"
          ? "italic"
          : tag === "code"
            ? "code"
            : null;

    const children = parseInline(inner);
    for (const child of children) {
      if (child.type === "text" && markType) {
        child.marks = [...(child.marks ?? []), { type: markType }];
      }
      nodes.push(child);
    }
  }

  return nodes.length ? nodes : [{ type: "text", text: stripTags(html) || " " }];
}

function paragraphFromHtml(inner: string): TiptapNode {
  const content = parseInline(inner);
  return { type: "paragraph", content };
}

function listFromHtml(html: string, ordered: boolean): TiptapNode {
  const items = [...html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map(
    (m) => {
      const inner = m[1]
        .replace(/<\/?p\b[^>]*>/gi, "")
        .replace(/<\/?div\b[^>]*>/gi, "");
      return {
        type: "listItem",
        content: [paragraphFromHtml(inner)],
      };
    },
  );

  return {
    type: ordered ? "orderedList" : "bulletList",
    content: items.length
      ? items
      : [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: " " }] }],
          },
        ],
  };
}

function extractImage(attrs: string): TiptapNode | null {
  const src = (attrs.match(/src=["']([^"']+)["']/i) || [])[1];
  if (!src) {
    return null;
  }

  const alt = (attrs.match(/alt=["']([^"']*)["']/i) || [])[1] ?? "";
  return {
    type: "image",
    attrs: { src, alt },
  };
}

/**
 * Convert WordPress HTML (including Gutenberg comments) into a TipTap doc.
 */
export function htmlToTiptap(html: string): TiptapNode {
  const cleaned = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?(div|span|figure|figcaption|section|article)\b[^>]*>/gi, "")
    .replace(/\r\n/g, "\n")
    .trim();

  const content: TiptapNode[] = [];
  const blockPattern =
    /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>|<(ul)\b[^>]*>([\s\S]*?)<\/ul>|<(ol)\b[^>]*>([\s\S]*?)<\/ol>|<(blockquote)\b[^>]*>([\s\S]*?)<\/blockquote>|<(p)\b[^>]*>([\s\S]*?)<\/p>|<img\b([^>]*?)\/?>|<(hr)\b[^>]*\/?>/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(cleaned)) !== null) {
    const between = cleaned.slice(lastIndex, match.index).trim();
    if (between && stripTags(between)) {
      content.push(paragraphFromHtml(between));
    }
    lastIndex = match.index + match[0].length;

    if (match[1]) {
      const levelNum = Number(match[1].slice(1));
      const level = Math.min(3, Math.max(2, levelNum));
      content.push({
        type: "heading",
        attrs: { level },
        content: parseInline(match[2]),
      });
      continue;
    }

    if (match[3] === "ul") {
      content.push(listFromHtml(match[4], false));
      continue;
    }

    if (match[5] === "ol") {
      content.push(listFromHtml(match[6], true));
      continue;
    }

    if (match[7] === "blockquote") {
      const inner = match[8].replace(/<\/?p\b[^>]*>/gi, "");
      content.push({
        type: "blockquote",
        content: [paragraphFromHtml(inner)],
      });
      continue;
    }

    if (match[9] === "p") {
      const inner = match[10].trim();
      if (inner) {
        content.push(paragraphFromHtml(inner));
      }
      continue;
    }

    if (match[11] !== undefined) {
      const image = extractImage(match[11]);
      if (image) {
        content.push(image);
      }
      continue;
    }

    if (match[12] === "hr") {
      content.push({ type: "horizontalRule" });
    }
  }

  const trailing = cleaned.slice(lastIndex).trim();
  if (trailing && stripTags(trailing)) {
    content.push(paragraphFromHtml(trailing));
  }

  if (!content.length) {
    const text = stripTags(cleaned) || " ";
    content.push({
      type: "paragraph",
      content: [{ type: "text", text }],
    });
  }

  return { type: "doc", content };
}

export function extractPlainText(html: string): string {
  return stripTags(html).replace(/\s+/g, " ").trim();
}
