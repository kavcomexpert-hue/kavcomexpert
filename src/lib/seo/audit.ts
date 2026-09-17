import { parsePostFaqs } from "@/lib/posts/aeo";
import { extractTextFromTiptap, type TiptapContent } from "@/lib/posts/constants";
import { SITE_URL } from "@/lib/seo/constants";
import { parseFaqs } from "@/lib/site/content-parsers";

export type SeoCheckStatus = "pass" | "warn" | "fail";

export type SeoCheckId =
  | "metaTitle"
  | "metaDescription"
  | "focusKeyword"
  | "secondaryKeywords"
  | "keywordPlacement"
  | "keywordDensity"
  | "readability"
  | "singleH1"
  | "internalLink"
  | "coverOrOgImage"
  | "tldr"
  | "takeaways"
  | "faqs"
  | "wordCount"
  | "freshness";

export type SeoCheckResult = {
  id: SeoCheckId;
  label: string;
  status: SeoCheckStatus;
  message: string;
};

export type SeoContentType = "post" | "page" | "service" | "case-study";

export type SeoAuditInput = {
  type: SeoContentType;
  title: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword?: string | null;
  secondaryKeywords?: string | null;
  content?: unknown;
  coverImage?: string | null;
  ogImage?: string | null;
  tldr?: string | null;
  keyTakeaways?: unknown;
  postFaqs?: unknown;
  serviceFaqs?: unknown;
  updatedAt?: Date | string | null;
  noIndex?: boolean | null;
};

const STALE_MONTHS = 12;
const META_TITLE_MIN = 30;
const META_TITLE_MAX = 60;
const META_DESC_MIN = 70;
const META_DESC_MAX = 155;
const MIN_WORDS = 300;
const WARN_WORDS = 200;

type TiptapNode = TiptapContent & {
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  attrs?: Record<string, unknown>;
};

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getFirstWords(text: string, count: number) {
  return text.trim().split(/\s+/).filter(Boolean).slice(0, count).join(" ");
}

function includesKeyword(haystack: string, keyword: string) {
  if (!keyword.trim()) {
    return false;
  }

  return haystack.toLowerCase().includes(keyword.trim().toLowerCase());
}

function walkTiptap(node: TiptapNode, visitor: (node: TiptapNode) => void) {
  visitor(node);
  node.content?.forEach((child) => walkTiptap(child as TiptapNode, visitor));
}

function countH1Nodes(content: unknown) {
  if (!content || typeof content !== "object") {
    return 0;
  }

  let count = 0;

  walkTiptap(content as TiptapNode, (node) => {
    if (node.type === "heading" && node.attrs?.level === 1) {
      count += 1;
    }
  });

  return count;
}

function siteHostnames(): string[] {
  const hosts = new Set<string>(["kavcomexpert.com", "www.kavcomexpert.com"]);

  try {
    const host = new URL(SITE_URL).hostname.toLowerCase();
    if (host) {
      hosts.add(host);
      if (host.startsWith("www.")) {
        hosts.add(host.slice(4));
      } else {
        hosts.add(`www.${host}`);
      }
    }
  } catch {
    // SITE_URL may be missing/invalid in local tooling; keep defaults.
  }

  return [...hosts];
}

function isInternalHref(href: string): boolean {
  const value = href.trim();
  if (!value || value.startsWith("#") || value.startsWith("mailto:") || value.startsWith("tel:")) {
    return false;
  }

  // Same-origin path links from the TipTap internal picker.
  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  try {
    const url = new URL(value, SITE_URL);
    const host = url.hostname.toLowerCase();
    return siteHostnames().includes(host);
  } catch {
    return false;
  }
}

function parseMaybeJson(content: unknown): unknown {
  if (typeof content !== "string") {
    return content;
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return content;
  }

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return content;
    }
  }

  return content;
}

function collectHrefsFromHtml(html: string): string[] {
  const hrefs: string[] = [];
  const pattern = /\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    const href = match[2] ?? match[3] ?? match[4] ?? "";
    if (href) hrefs.push(href);
  }

  return hrefs;
}

function hasInternalLink(content: unknown) {
  const normalized = parseMaybeJson(content);

  if (typeof normalized === "string") {
    return collectHrefsFromHtml(normalized).some(isInternalHref);
  }

  if (!normalized || typeof normalized !== "object") {
    return false;
  }

  let found = false;

  walkTiptap(normalized as TiptapNode, (node) => {
    if (found) return;

    // TipTap usually stores links as marks on text; some imports use link nodes.
    if (node.type === "link") {
      const href = typeof node.attrs?.href === "string" ? node.attrs.href : "";
      if (isInternalHref(href)) {
        found = true;
      }
      return;
    }

    for (const mark of node.marks ?? []) {
      if (mark.type !== "link") continue;
      const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "";
      if (isInternalHref(href)) {
        found = true;
        return;
      }
    }
  });

  return found;
}

function toDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function checkMetaTitle(metaTitle: string): SeoCheckResult {
  const value = metaTitle.trim();
  const length = value.length;

  if (!value) {
    return {
      id: "metaTitle",
      label: "Meta title",
      status: "fail",
      message: "Meta title is missing",
    };
  }

  if (length >= META_TITLE_MIN && length <= META_TITLE_MAX) {
    return {
      id: "metaTitle",
      label: "Meta title",
      status: "pass",
      message: `${length} characters (30-60)`,
    };
  }

  if (length > 70) {
    return {
      id: "metaTitle",
      label: "Meta title",
      status: "fail",
      message: `${length} characters, trim below 60`,
    };
  }

  return {
    id: "metaTitle",
    label: "Meta title",
    status: "warn",
    message: `${length} characters, aim for 30-60`,
  };
}

function checkMetaDescription(metaDescription: string): SeoCheckResult {
  const value = metaDescription.trim();
  const length = value.length;

  if (!value) {
    return {
      id: "metaDescription",
      label: "Meta description",
      status: "fail",
      message: "Meta description is missing",
    };
  }

  if (length >= META_DESC_MIN && length <= META_DESC_MAX) {
    return {
      id: "metaDescription",
      label: "Meta description",
      status: "pass",
      message: `${length} characters (70-155)`,
    };
  }

  if (length > 170) {
    return {
      id: "metaDescription",
      label: "Meta description",
      status: "fail",
      message: `${length} characters, trim below 155`,
    };
  }

  return {
    id: "metaDescription",
    label: "Meta description",
    status: "warn",
    message: `${length} characters, aim for 70-155`,
  };
}

function checkSecondaryKeywords(
  content: unknown,
  title: string,
  metaTitle: string,
  metaDescription: string,
  secondaryKeywords?: string | null,
): SeoCheckResult {
  const raw = secondaryKeywords?.trim() ?? "";
  if (!raw) {
    return {
      id: "secondaryKeywords",
      label: "Secondary keywords",
      status: "warn",
      message: "Add comma-separated related phrases to broaden topical coverage.",
    };
  }

  const phrases = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (phrases.length === 0) {
    return {
      id: "secondaryKeywords",
      label: "Secondary keywords",
      status: "warn",
      message: "Add comma-separated related phrases to broaden topical coverage.",
    };
  }

  const body = extractTextFromTiptap(content as TiptapContent).toLowerCase();
  const haystack = `${title} ${metaTitle} ${metaDescription} ${body}`.toLowerCase();
  const found = phrases.some((phrase) => haystack.includes(phrase.toLowerCase()));

  if (found) {
    return {
      id: "secondaryKeywords",
      label: "Secondary keywords",
      status: "pass",
      message: "At least one secondary keyword appears in the content.",
    };
  }

  return {
    id: "secondaryKeywords",
    label: "Secondary keywords",
    status: "warn",
    message:
      "None of the secondary keywords appear in the title or body yet (soft warning).",
  };
}

function checkFocusKeyword(focusKeyword?: string | null): SeoCheckResult {
  const value = focusKeyword?.trim() ?? "";

  if (value) {
    return {
      id: "focusKeyword",
      label: "Focus keyword",
      status: "pass",
      message: value,
    };
  }

  return {
    id: "focusKeyword",
    label: "Focus keyword",
    status: "fail",
    message: "Add a focus keyword",
  };
}

function checkKeywordPlacement(
  title: string,
  metaTitle: string,
  content: unknown,
  focusKeyword?: string | null,
): SeoCheckResult {
  const keyword = focusKeyword?.trim() ?? "";

  if (!keyword) {
    return {
      id: "keywordPlacement",
      label: "Keyword in title & intro",
      status: "fail",
      message: "Set a focus keyword first",
    };
  }

  const bodyText = extractTextFromTiptap(content);
  const intro = getFirstWords(bodyText, 150);
  const inTitle = includesKeyword(metaTitle, keyword) || includesKeyword(title, keyword);
  const inIntro = includesKeyword(intro, keyword);

  if (inTitle && inIntro) {
    return {
      id: "keywordPlacement",
      label: "Keyword in title & intro",
      status: "pass",
      message: "Found in title and first 150 words",
    };
  }

  if (inTitle || inIntro) {
    return {
      id: "keywordPlacement",
      label: "Keyword in title & intro",
      status: "warn",
      message: inTitle
        ? "In title, missing from first 150 words"
        : "In intro, missing from title",
    };
  }

  return {
    id: "keywordPlacement",
    label: "Keyword in title & intro",
    status: "fail",
    message: "Not found in title or first 150 words",
  };
}

function checkSingleH1(content: unknown): SeoCheckResult {
  const h1Count = countH1Nodes(content);

  if (h1Count === 0) {
    return {
      id: "singleH1",
      label: "Single H1",
      status: "pass",
      message: "Page title is the only H1",
    };
  }

  if (h1Count === 1) {
    return {
      id: "singleH1",
      label: "Single H1",
      status: "warn",
      message: "Content includes an extra H1, use H2/H3 instead",
    };
  }

  return {
    id: "singleH1",
    label: "Single H1",
    status: "fail",
    message: `${h1Count} H1 headings in content`,
  };
}

function checkInternalLink(content: unknown): SeoCheckResult {
  if (hasInternalLink(content)) {
    return {
      id: "internalLink",
      label: "Internal link",
      status: "pass",
      message: "At least one internal link found",
    };
  }

  return {
    id: "internalLink",
    label: "Internal link",
    status: "fail",
    message: "Add a link to another page on your site",
  };
}

function checkCoverOrOgImage(coverImage?: string | null, ogImage?: string | null) {
  if (coverImage?.trim() || ogImage?.trim()) {
    return {
      id: "coverOrOgImage" as const,
      label: "Cover / OG image",
      status: "pass" as const,
      message: coverImage?.trim() ? "Cover image set" : "OG image set",
    };
  }

  return {
    id: "coverOrOgImage" as const,
    label: "Cover / OG image",
    status: "fail" as const,
    message: "Add a cover or OG image",
  };
}

function checkTldr(tldr?: string | null): SeoCheckResult {
  if (tldr?.trim()) {
    return {
      id: "tldr",
      label: "TL;DR",
      status: "pass",
      message: "Quick answer present",
    };
  }

  return {
    id: "tldr",
    label: "TL;DR",
    status: "fail",
    message: "Add a TL;DR for AI extractability",
  };
}

function checkTakeaways(keyTakeaways?: unknown): SeoCheckResult {
  const items = Array.isArray(keyTakeaways)
    ? keyTakeaways.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : [];

  if (items.length >= 3) {
    return {
      id: "takeaways",
      label: "Key takeaways",
      status: "pass",
      message: `${items.length} takeaways ready`,
    };
  }

  return {
    id: "takeaways",
    label: "Key takeaways",
    status: "fail",
    message: "Add at least 3 key takeaways",
  };
}

function checkFaqs(postFaqs?: unknown, serviceFaqs?: unknown): SeoCheckResult {
  const faqCount =
    parsePostFaqs(postFaqs).length + parseFaqs(serviceFaqs).length;

  if (faqCount > 0) {
    return {
      id: "faqs",
      label: "FAQs",
      status: "pass",
      message: `${faqCount} FAQ${faqCount === 1 ? "" : "s"} present`,
    };
  }

  return {
    id: "faqs",
    label: "FAQs",
    status: "fail",
    message: "Add at least one FAQ",
  };
}

function checkWordCount(content: unknown): SeoCheckResult {
  const words = countWords(extractTextFromTiptap(content));

  if (words > MIN_WORDS) {
    return {
      id: "wordCount",
      label: "Content length",
      status: "pass",
      message: `${words} words`,
    };
  }

  if (words >= WARN_WORDS) {
    return {
      id: "wordCount",
      label: "Content length",
      status: "warn",
      message: `${words} words, aim for 300+`,
    };
  }

  return {
    id: "wordCount",
    label: "Content length",
    status: "fail",
    message: `${words} words, too thin`,
  };
}

function checkKeywordDensity(
  content: unknown,
  focusKeyword?: string | null,
): SeoCheckResult {
  const keyword = focusKeyword?.trim().toLowerCase() ?? "";
  const text = extractTextFromTiptap(content).toLowerCase();
  const words = countWords(text);

  if (!keyword) {
    return {
      id: "keywordDensity",
      label: "Keyword density",
      status: "warn",
      message: "Set a focus keyword to measure density",
    };
  }

  if (words < 50) {
    return {
      id: "keywordDensity",
      label: "Keyword density",
      status: "warn",
      message: "Not enough content to measure density",
    };
  }

  const occurrences = text.split(keyword).length - 1;
  const density = (occurrences / words) * 100;

  if (density >= 0.5 && density <= 2.5) {
    return {
      id: "keywordDensity",
      label: "Keyword density",
      status: "pass",
      message: `${density.toFixed(1)}% (${occurrences} uses), ideal range`,
    };
  }

  if (density > 0 && density < 0.5) {
    return {
      id: "keywordDensity",
      label: "Keyword density",
      status: "warn",
      message: `${density.toFixed(1)}%, use the keyword a bit more`,
    };
  }

  if (density > 2.5) {
    return {
      id: "keywordDensity",
      label: "Keyword density",
      status: "warn",
      message: `${density.toFixed(1)}%, may look like stuffing`,
    };
  }

  return {
    id: "keywordDensity",
    label: "Keyword density",
    status: "fail",
    message: "Focus keyword not found in the body",
  };
}

function checkReadability(content: unknown): SeoCheckResult {
  const text = extractTextFromTiptap(content).trim();
  if (!text) {
    return {
      id: "readability",
      label: "Readability",
      status: "fail",
      message: "Add content to score readability",
    };
  }

  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const words = countWords(text);
  const avg =
    sentences.length > 0 ? words / sentences.length : words;

  if (avg <= 20) {
    return {
      id: "readability",
      label: "Readability",
      status: "pass",
      message: `Avg ${avg.toFixed(1)} words/sentence, easy to scan`,
    };
  }

  if (avg <= 28) {
    return {
      id: "readability",
      label: "Readability",
      status: "warn",
      message: `Avg ${avg.toFixed(1)} words/sentence, tighten a few long lines`,
    };
  }

  return {
    id: "readability",
    label: "Readability",
    status: "fail",
    message: `Avg ${avg.toFixed(1)} words/sentence, break up long sentences`,
  };
}

function checkFreshness(updatedAt?: Date | string | null): SeoCheckResult {
  const date = toDate(updatedAt);

  if (!date) {
    return {
      id: "freshness",
      label: "Freshness",
      status: "warn",
      message: "No update date recorded",
    };
  }

  const monthsAgo =
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);

  if (monthsAgo <= STALE_MONTHS) {
    return {
      id: "freshness",
      label: "Freshness",
      status: "pass",
      message: `Updated ${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`,
    };
  }

  return {
    id: "freshness",
    label: "Freshness",
    status: "warn",
    message: `Stale, last updated ${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`,
  };
}

export function aggregateSeoStatus(checks: SeoCheckResult[]): SeoCheckStatus {
  if (checks.some((check) => check.status === "fail")) {
    return "fail";
  }

  if (checks.some((check) => check.status === "warn")) {
    return "warn";
  }

  return "pass";
}

/** RankMath-style 0-100 score from live checklist results. */
export function scoreSeoChecks(checks: SeoCheckResult[]): number {
  if (checks.length === 0) {
    return 0;
  }

  const points = checks.reduce((sum, check) => {
    if (check.status === "pass") return sum + 1;
    if (check.status === "warn") return sum + 0.45;
    return sum;
  }, 0);

  return Math.round((points / checks.length) * 100);
}

export function runSeoAudit(input: SeoAuditInput): SeoCheckResult[] {
  const checks: SeoCheckResult[] = [
    checkMetaTitle(input.metaTitle),
    checkMetaDescription(input.metaDescription),
    checkFocusKeyword(input.focusKeyword),
    checkSecondaryKeywords(
      input.content,
      input.title,
      input.metaTitle,
      input.metaDescription,
      input.secondaryKeywords,
    ),
    checkKeywordPlacement(
      input.title,
      input.metaTitle,
      input.content,
      input.focusKeyword,
    ),
    checkSingleH1(input.content),
    checkInternalLink(input.content),
    checkCoverOrOgImage(input.coverImage, input.ogImage),
    checkWordCount(input.content),
    checkFreshness(input.updatedAt),
  ];

  if (input.type === "post") {
    checks.splice(4, 0, checkKeywordDensity(input.content, input.focusKeyword));
    checks.splice(5, 0, checkReadability(input.content));
    checks.push(checkTldr(input.tldr));
    checks.push(checkTakeaways(input.keyTakeaways));
    checks.push(checkFaqs(input.postFaqs));
  }

  if (input.type === "service") {
    checks.push(checkFaqs(undefined, input.serviceFaqs));
  }

  return checks;
}

export function getEditorHref(type: SeoContentType, id: string) {
  switch (type) {
    case "post":
      return `/admin/posts/${id}`;
    case "page":
      return `/admin/pages/${id}`;
    case "service":
      return `/admin/services/${id}`;
    case "case-study":
      return `/admin/case-studies/${id}`;
  }
}

export type SeoAuditRow = {
  id: string;
  type: SeoContentType;
  title: string;
  slug: string;
  editorHref: string;
  updatedAt: Date | null;
  indexed: boolean;
  overallStatus: SeoCheckStatus;
  checks: SeoCheckResult[];
};

export function buildSeoAuditRow(input: SeoAuditInput & { id: string; slug: string }): SeoAuditRow {
  const checks = runSeoAudit(input);

  return {
    id: input.id,
    type: input.type,
    title: input.title,
    slug: input.slug,
    editorHref: getEditorHref(input.type, input.id),
    updatedAt: toDate(input.updatedAt),
    indexed: !input.noIndex,
    overallStatus: aggregateSeoStatus(checks),
    checks,
  };
}

export function runPostLiveAudit(input: {
  title: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords?: string;
  content: unknown;
  coverImage: string;
  ogImage: string;
  tldr: string;
  keyTakeaways?: unknown;
  postFaqs: unknown;
  updatedAt?: Date | string | null;
}) {
  return runSeoAudit({
    type: "post",
    title: input.title,
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
    focusKeyword: input.focusKeyword,
    secondaryKeywords: input.secondaryKeywords,
    content: input.content,
    coverImage: input.coverImage,
    ogImage: input.ogImage,
    tldr: input.tldr,
    keyTakeaways: input.keyTakeaways,
    postFaqs: input.postFaqs,
    updatedAt: input.updatedAt ?? new Date(),
  });
}

export function summarizeSeoAudit(rows: SeoAuditRow[]) {
  const indexedRows = rows.filter((row) => row.indexed);

  return {
    totalIndexed: indexedRows.length,
    failing: rows.filter((row) => row.overallStatus === "fail").length,
    stale: rows.filter((row) =>
      row.checks.some((check) => check.id === "freshness" && check.status === "warn"),
    ).length,
    missingFaqs: rows.filter((row) => {
      if (row.type !== "post" && row.type !== "service") {
        return false;
      }

      return row.checks.some(
        (check) => check.id === "faqs" && check.status === "fail",
      );
    }).length,
  };
}
