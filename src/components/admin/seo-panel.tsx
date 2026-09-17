"use client";

import {
  POST_SCHEMA_TYPES,
  type PostSchemaType,
} from "@/lib/posts/constants";
import {
  runPostLiveAudit,
  runSeoAudit,
  scoreSeoChecks,
  type SeoContentType,
} from "@/lib/seo/audit";
import { SeoLiveChecklist } from "@/components/admin/seo-live-checklist";
import { useMemo, useState } from "react";

type SeoPanelProps = {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords?: string;
  schemaType: PostSchemaType;
  schemaJson?: string;
  ogImage: string;
  canonicalUrl: string;
  noIndex: boolean;
  socialTitle?: string;
  socialDescription?: string;
  noFollow?: boolean;
  noArchive?: boolean;
  sitemapInclude?: boolean;
  sitemapPriority?: string;
  previewPath?: string;
  schemaOptions?: readonly PostSchemaType[];
  /** Defaults to post (includes TL;DR / takeaways / FAQs checks). */
  auditType?: SeoContentType;
  onMetaTitleChange: (value: string) => void;
  onMetaDescriptionChange: (value: string) => void;
  onFocusKeywordChange: (value: string) => void;
  onSecondaryKeywordsChange?: (value: string) => void;
  onSchemaTypeChange: (value: PostSchemaType) => void;
  onSchemaJsonChange?: (value: string) => void;
  onOgImageChange: (value: string) => void;
  onChooseOgImage?: () => void;
  onCanonicalUrlChange: (value: string) => void;
  onNoIndexChange: (value: boolean) => void;
  onSocialTitleChange?: (value: string) => void;
  onSocialDescriptionChange?: (value: string) => void;
  onNoFollowChange?: (value: boolean) => void;
  onNoArchiveChange?: (value: boolean) => void;
  onSitemapIncludeChange?: (value: boolean) => void;
  onSitemapPriorityChange?: (value: string) => void;
  liveAudit?: {
    content: unknown;
    coverImage: string;
    tldr: string;
    keyTakeaways?: unknown;
    postFaqs: unknown;
    serviceFaqs?: unknown;
  };
};

const SITEMAP_PRIORITIES = [
  "0.1",
  "0.2",
  "0.3",
  "0.4",
  "0.5",
  "0.6",
  "0.7",
  "0.8",
  "0.9",
  "1.0",
] as const;

type TabId = "general" | "social" | "advanced";

function Counter({
  value,
  limit,
  previewLimit,
}: {
  value: number;
  limit: number;
  previewLimit?: number;
}) {
  const threshold = previewLimit ?? limit;
  const isOver = value > threshold;

  return (
    <span className={`font-mono text-xs ${isOver ? "text-danger" : "text-success"}`}>
      {value}/{limit}
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-success" : score >= 50 ? "text-accent" : "text-danger";
  const label =
    score >= 80 ? "Great" : score >= 50 ? "Needs work" : "Poor";

  return (
    <div className="flex items-center gap-4 rounded-default border border-border bg-background p-4">
      <div
        className={`flex size-16 shrink-0 items-center justify-center rounded-full border-4 border-current ${color}`}
        style={{
          background: `conic-gradient(currentColor ${score}%, var(--border) 0)`,
          WebkitMask:
            "radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px))",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px))",
        }}
        aria-hidden="true"
      />
      <div>
        <p className={`font-mono text-2xl font-semibold tracking-tight ${color}`}>
          {score}/100
        </p>
        <p className="text-sm text-muted">SEO score · {label}</p>
      </div>
    </div>
  );
}

export function SeoPanel({
  title,
  slug,
  metaTitle,
  metaDescription,
  focusKeyword,
  secondaryKeywords = "",
  schemaType,
  schemaJson = "",
  ogImage,
  canonicalUrl,
  noIndex,
  socialTitle = "",
  socialDescription = "",
  noFollow = false,
  noArchive = false,
  sitemapInclude = true,
  sitemapPriority = "0.7",
  previewPath,
  schemaOptions = POST_SCHEMA_TYPES,
  auditType = "post",
  onMetaTitleChange,
  onMetaDescriptionChange,
  onFocusKeywordChange,
  onSecondaryKeywordsChange,
  onSchemaTypeChange,
  onSchemaJsonChange,
  onOgImageChange,
  onChooseOgImage,
  onCanonicalUrlChange,
  onNoIndexChange,
  onSocialTitleChange,
  onSocialDescriptionChange,
  onNoFollowChange,
  onNoArchiveChange,
  onSitemapIncludeChange,
  onSitemapPriorityChange,
  liveAudit,
}: SeoPanelProps) {
  const [tab, setTab] = useState<TabId>("general");

  const previewTitle = metaTitle.trim() || title.trim() || "Page title preview";
  const previewDescription =
    metaDescription.trim() ||
    "Add a meta description to preview how this page may appear in search results.";
  const previewUrl =
    previewPath ??
    `kavcomexpert.com/blog/${slug || "your-post-slug"}`;

  const socialPreviewTitle =
    socialTitle.trim() || metaTitle.trim() || title.trim() || "Social title";
  const socialPreviewDescription =
    socialDescription.trim() ||
    metaDescription.trim() ||
    "Add a social description for Facebook, LinkedIn, and X.";

  const liveChecks = useMemo(() => {
    if (!liveAudit) {
      return null;
    }

    if (auditType === "post") {
      return runPostLiveAudit({
        title,
        metaTitle,
        metaDescription,
        focusKeyword,
        secondaryKeywords,
        content: liveAudit.content,
        coverImage: liveAudit.coverImage,
        ogImage,
        tldr: liveAudit.tldr,
        keyTakeaways: liveAudit.keyTakeaways,
        postFaqs: liveAudit.postFaqs,
      });
    }

    return runSeoAudit({
      type: auditType,
      title,
      metaTitle,
      metaDescription,
      focusKeyword,
      secondaryKeywords,
      content: liveAudit.content,
      coverImage: liveAudit.coverImage,
      ogImage,
      tldr: liveAudit.tldr,
      keyTakeaways: liveAudit.keyTakeaways,
      postFaqs: liveAudit.postFaqs,
      serviceFaqs: liveAudit.serviceFaqs,
      updatedAt: new Date(),
    });
  }, [
    auditType,
    focusKeyword,
    secondaryKeywords,
    liveAudit,
    metaDescription,
    metaTitle,
    ogImage,
    title,
  ]);

  const score = liveChecks ? scoreSeoChecks(liveChecks) : 0;

  const fieldClassName =
    "h-11 w-full rounded-default border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

  const tabs: { id: TabId; label: string }[] = [
    { id: "general", label: "General" },
    { id: "social", label: "Social" },
    { id: "advanced", label: "Advanced" },
  ];

  return (
    <aside className="sticky top-6 space-y-5 rounded-default border border-border bg-surface p-5 shadow-soft dark:shadow-glow">
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground">
          Rank & SEO
        </h2>
        <p className="mt-1 text-sm text-muted">
          Live analysis inspired by Rank Math, optimize search, social, and robots.
        </p>
      </div>

      {liveChecks ? <ScoreRing score={score} /> : null}
      {liveChecks ? <SeoLiveChecklist checks={liveChecks} /> : null}

      <div className="flex gap-1 rounded-default border border-border bg-background p-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded-[10px] px-2 py-2 text-xs font-medium transition-colors ${
              tab === item.id
                ? "bg-accent text-surface"
                : "text-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "general" ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="metaTitle" className="text-sm font-medium text-foreground">
                Meta title
              </label>
              <Counter value={metaTitle.length} limit={70} previewLimit={60} />
            </div>
            <input
              id="metaTitle"
              value={metaTitle}
              onChange={(event) => onMetaTitleChange(event.target.value)}
              className={fieldClassName}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="metaDescription"
                className="text-sm font-medium text-foreground"
              >
                Meta description
              </label>
              <Counter value={metaDescription.length} limit={170} previewLimit={155} />
            </div>
            <textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(event) => onMetaDescriptionChange(event.target.value)}
              rows={4}
              className="w-full rounded-default border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            />
          </div>

          <div className="space-y-2 rounded-default border border-border bg-background p-4">
            <p className="font-mono text-xs uppercase tracking-wider text-muted">
              Google preview
            </p>
            <p className="text-base text-accent">{previewTitle}</p>
            <p className="text-sm text-success">{previewUrl}</p>
            <p className="text-sm leading-relaxed text-muted">{previewDescription}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="focusKeyword" className="text-sm font-medium text-foreground">
              Focus keyword
            </label>
            <input
              id="focusKeyword"
              value={focusKeyword}
              onChange={(event) => onFocusKeywordChange(event.target.value)}
              className={fieldClassName}
              placeholder="Primary phrase to rank for"
            />
          </div>

          {onSecondaryKeywordsChange ? (
            <div className="space-y-2">
              <label
                htmlFor="secondaryKeywords"
                className="text-sm font-medium text-foreground"
              >
                Secondary keywords
              </label>
              <input
                id="secondaryKeywords"
                value={secondaryKeywords}
                onChange={(event) =>
                  onSecondaryKeywordsChange(event.target.value)
                }
                className={fieldClassName}
                placeholder="Comma-separated related phrases"
              />
              <p className="text-xs text-muted">
                Comma-separated related phrases. Soft checklist: at least one should
                appear in the content (never blocks publish).
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="schemaType" className="text-sm font-medium text-foreground">
              Schema type
            </label>
            <select
              id="schemaType"
              value={schemaType}
              onChange={(event) =>
                onSchemaTypeChange(event.target.value as PostSchemaType)
              }
              className={fieldClassName}
            >
              {schemaOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted">
              JSON-LD is generated automatically for Google. Override only if needed
              under Advanced.
            </p>
          </div>
        </div>
      ) : null}

      {tab === "social" ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="socialTitle" className="text-sm font-medium text-foreground">
              Social title
            </label>
            <input
              id="socialTitle"
              value={socialTitle}
              onChange={(event) => onSocialTitleChange?.(event.target.value)}
              className={fieldClassName}
              placeholder="Defaults to meta title"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="socialDescription"
              className="text-sm font-medium text-foreground"
            >
              Social description
            </label>
            <textarea
              id="socialDescription"
              value={socialDescription}
              onChange={(event) => onSocialDescriptionChange?.(event.target.value)}
              rows={3}
              className="w-full rounded-default border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              placeholder="Defaults to meta description"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="ogImage" className="text-sm font-medium text-foreground">
              Social / OG image
            </label>
            <div className="flex flex-col gap-2">
              <input
                id="ogImage"
                value={ogImage}
                onChange={(event) => onOgImageChange(event.target.value)}
                className={fieldClassName}
              />
              {onChooseOgImage ? (
                <button
                  type="button"
                  onClick={onChooseOgImage}
                  className="inline-flex h-10 items-center justify-center self-start rounded-default border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                >
                  Choose from library
                </button>
              ) : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-default border border-border bg-background">
            <div className="aspect-[1.91/1] bg-surface">
              {ogImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ogImage}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-xs text-muted">
                  No social image
                </div>
              )}
            </div>
            <div className="space-y-1 border-t border-border p-3">
              <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                Facebook / LinkedIn preview
              </p>
              <p className="text-sm font-medium text-foreground">
                {socialPreviewTitle}
              </p>
              <p className="line-clamp-2 text-xs text-muted">
                {socialPreviewDescription}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "advanced" ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="canonicalUrl" className="text-sm font-medium text-foreground">
              Canonical URL
            </label>
            <input
              id="canonicalUrl"
              value={canonicalUrl}
              onChange={(event) => onCanonicalUrlChange(event.target.value)}
              className={fieldClassName}
              placeholder="https://kavcomexpert.com/blog/…"
            />
          </div>

          <label className="flex items-center justify-between gap-3 rounded-default border border-border bg-background px-3 py-3">
            <span className="text-sm font-medium text-foreground">No index</span>
            <input
              type="checkbox"
              checked={noIndex}
              onChange={(event) => onNoIndexChange(event.target.checked)}
              className="size-4 rounded border-border text-accent focus:ring-accent"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-default border border-border bg-background px-3 py-3">
            <span className="text-sm font-medium text-foreground">No follow</span>
            <input
              type="checkbox"
              checked={noFollow}
              onChange={(event) => onNoFollowChange?.(event.target.checked)}
              className="size-4 rounded border-border text-accent focus:ring-accent"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-default border border-border bg-background px-3 py-3">
            <span className="text-sm font-medium text-foreground">No archive</span>
            <input
              type="checkbox"
              checked={noArchive}
              onChange={(event) => onNoArchiveChange?.(event.target.checked)}
              className="size-4 rounded border-border text-accent focus:ring-accent"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-default border border-border bg-background px-3 py-3">
            <span className="text-sm font-medium text-foreground">
              Include in sitemap
            </span>
            <input
              type="checkbox"
              checked={sitemapInclude}
              onChange={(event) =>
                onSitemapIncludeChange?.(event.target.checked)
              }
              className="size-4 rounded border-border text-accent focus:ring-accent"
            />
          </label>

          <div className="space-y-2">
            <label
              htmlFor="sitemapPriority"
              className="text-sm font-medium text-foreground"
            >
              Sitemap priority
            </label>
            <select
              id="sitemapPriority"
              value={sitemapPriority}
              onChange={(event) =>
                onSitemapPriorityChange?.(event.target.value)
              }
              className={fieldClassName}
            >
              {SITEMAP_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          {onSchemaJsonChange ? (
            <div className="space-y-2">
              <label
                htmlFor="schemaJson"
                className="text-sm font-medium text-foreground"
              >
                Custom schema JSON
              </label>
              <textarea
                id="schemaJson"
                value={schemaJson}
                onChange={(event) => onSchemaJsonChange(event.target.value)}
                rows={8}
                spellCheck={false}
                className="w-full rounded-default border border-border bg-background px-3 py-2 font-mono text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
                placeholder='Leave empty for auto-generated schema. Example: { "@context": "https://schema.org", "@type": "Service", ... }'
              />
              <p className="text-xs text-muted">
                Optional override. When set, this replaces the auto-generated JSON-LD
                for this page.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
