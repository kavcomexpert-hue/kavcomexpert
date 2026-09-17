/**
 * TipTap/ProseMirror builds mark/node `attrs` with Object.create(null).
 * React Flight (server actions) silently drops those objects, which is why
 * saved link marks were arriving in the DB as `{ "type": "link" }` with no
 * href. Always round-trip through this helper before setState / save.
 */

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function looksLikeUrl(text: string): boolean {
  const value = text.trim();
  if (!value || /\s/.test(value)) return false;
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("/")
  ) {
    return true;
  }
  return /^(www\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(\/.*)?$/i.test(
    value,
  );
}

function normalizeHref(href: string): string {
  const value = href.trim();
  if (!value) return "";
  if (
    value.startsWith("/") ||
    value.startsWith("#") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }
  if (looksLikeUrl(value)) {
    return `https://${value.replace(/^\/+/, "")}`;
  }
  return value;
}

function plainAttrs(attrs: unknown): JsonObject | undefined {
  if (!isObject(attrs)) return undefined;
  const next: JsonObject = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined) next[key] = value;
  }
  return next;
}

function healLinkMark(
  mark: JsonObject,
  text: string | undefined,
): JsonObject | null {
  const attrs = plainAttrs(mark.attrs) ?? {};
  const existing =
    typeof attrs.href === "string" ? attrs.href.trim() : "";

  if (existing) {
    return {
      type: "link",
      attrs: { ...attrs, href: normalizeHref(existing) },
    };
  }

  if (text && looksLikeUrl(text)) {
    return {
      type: "link",
      attrs: { ...attrs, href: normalizeHref(text) },
    };
  }

  // Empty link mark with no recoverable href — drop it so text still renders.
  return null;
}

function serializeNode(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(serializeNode);
  }
  if (!isObject(node)) {
    return node;
  }

  const next: JsonObject = { type: node.type };
  if (typeof node.text === "string") next.text = node.text;

  const attrs = plainAttrs(node.attrs);
  if (attrs && Object.keys(attrs).length > 0) {
    next.attrs = attrs;
  }

  if (Array.isArray(node.marks)) {
    const text = typeof node.text === "string" ? node.text : undefined;
    const marks = node.marks
      .map((mark) => {
        if (!isObject(mark) || typeof mark.type !== "string") return null;
        if (mark.type === "link") return healLinkMark(mark, text);
        const markAttrs = plainAttrs(mark.attrs);
        return markAttrs && Object.keys(markAttrs).length > 0
          ? { type: mark.type, attrs: markAttrs }
          : { type: mark.type };
      })
      .filter((mark): mark is JsonObject => Boolean(mark));
    if (marks.length > 0) next.marks = marks;
  }

  if (Array.isArray(node.content)) {
    next.content = node.content.map(serializeNode);
  }

  return next;
}

/** Deep-clone a TipTap doc into Flight-safe plain objects and heal bare links. */
export function toPlainTiptapJson<T = unknown>(doc: T): T {
  if (doc == null) return doc;
  return serializeNode(doc) as T;
}

export function normalizeLinkHref(href: string): string {
  return normalizeHref(href);
}

export function textLooksLikeUrl(text: string): boolean {
  return looksLikeUrl(text);
}
