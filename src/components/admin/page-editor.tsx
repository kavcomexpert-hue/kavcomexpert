"use client";

import {
  autosavePage,
  checkPageSlugAvailable,
  savePage,
  trashPage,
} from "@/actions/pages";
import { createPreviewLink } from "@/actions/preview";
import { openPreviewFromAction } from "@/lib/preview/open-client";
import { MediaPicker } from "@/components/admin/media-picker";
import { PageContentEditor } from "@/components/admin/page-content-editor";
import { PageRevisionsPanel } from "@/components/admin/page-revisions-panel";
import { SeoPanel } from "@/components/admin/seo-panel";
import { ServiceSectionsEditor } from "@/components/admin/service-sections-editor";
import {
  TiptapEditor,
  type TiptapEditorHandle,
} from "@/components/admin/tiptap-editor";
import { useToast } from "@/components/ui/toast";
import type { PostSchemaType } from "@/lib/posts/constants";
import { plainTextAsTiptapDoc } from "@/lib/posts/constants";
import {
  emptyMarketingPageSections,
  type MarketingPageSections,
} from "@/lib/services/page-sections";
import type { ServiceHeroVisual } from "@/lib/site/service-pages/types";
import { isSystemSectionPage } from "@/lib/pages/page-section-schemas";
import type { ContentBlockValue } from "@/lib/db/schema";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formatSavedAt,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  toSlug,
} from "@/lib/admin/editor-format";
import { useEditorAutosave } from "@/hooks/use-editor-autosave";

export type PageParentOption = {
  id: string;
  title: string;
  slug: string;
  path: string | null;
};

export type ServiceParentOption = {
  id: string;
  name: string;
  slug: string;
};

export type PageEditorInitialData = {
  id?: string;
  title: string;
  slug: string;
  path?: string;
  heroEyebrow: string;
  heroSubtext: string;
  heroVisual: ServiceHeroVisual;
  content: unknown;
  pageSections: MarketingPageSections | Record<string, unknown>;
  showCta: boolean;
  template: "marketing" | "article";
  parentId: string | null;
  parentServiceId: string | null;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string;
  schemaType: PostSchemaType;
  schemaJson: string;
  ogImage: string;
  canonicalUrl: string;
  noIndex: boolean;
  sitemapInclude?: boolean;
  sitemapPriority?: string;
  status: "draft" | "published" | "scheduled" | "trashed";
  scheduledFor?: string;
};

type PageEditorProps = {
  initialData: PageEditorInitialData;
  parentPages: PageParentOption[];
  parentServices: ServiceParentOption[];
  contentBlocks?: {
    key: string;
    label: string;
    type: string;
    value: ContentBlockValue;
  }[];
};

type PageStatus = "draft" | "published" | "scheduled" | "trashed";

export function PageEditor({
  initialData,
  parentPages,
  parentServices,
  contentBlocks = [],
}: PageEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const slugManuallyEdited = useRef(Boolean(initialData.slug));
  const tiptapRef = useRef<TiptapEditorHandle>(null);
  const savingRef = useRef(false);
  const formRef = useRef<Record<string, unknown>>({});

  const [pageId, setPageId] = useState(initialData.id);
  const [title, setTitle] = useState(initialData.title);
  const [slug, setSlug] = useState(initialData.slug);
  const [pathPreview, setPathPreview] = useState(initialData.path ?? "");
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [heroEyebrow, setHeroEyebrow] = useState(initialData.heroEyebrow);
  const [heroSubtext, setHeroSubtext] = useState(initialData.heroSubtext);
  const [heroVisualMode, setHeroVisualMode] = useState<
    ServiceHeroVisual["mode"]
  >(initialData.heroVisual?.mode ?? "animation");
  const [heroMediaUrl, setHeroMediaUrl] = useState(
    initialData.heroVisual?.mediaUrl ?? "",
  );
  const [heroMediaPickerOpen, setHeroMediaPickerOpen] = useState(false);
  const [content, setContent] = useState(initialData.content);
  const [pageSections, setPageSections] = useState<
    MarketingPageSections | Record<string, unknown>
  >(initialData.pageSections ?? emptyMarketingPageSections());
  const [showCta, setShowCta] = useState(initialData.showCta);
  const [template, setTemplate] = useState<"marketing" | "article">(
    initialData.template,
  );
  const [parentId, setParentId] = useState<string>(initialData.parentId ?? "");
  const [parentServiceId, setParentServiceId] = useState<string>(
    initialData.parentServiceId ?? "",
  );
  const [metaTitle, setMetaTitle] = useState(initialData.metaTitle);
  const [metaDescription, setMetaDescription] = useState(
    initialData.metaDescription,
  );
  const [focusKeyword, setFocusKeyword] = useState(initialData.focusKeyword);
  const [secondaryKeywords, setSecondaryKeywords] = useState(
    initialData.secondaryKeywords,
  );
  const [schemaType, setSchemaType] = useState<PostSchemaType>(
    initialData.schemaType,
  );
  const [schemaJson, setSchemaJson] = useState(initialData.schemaJson);
  const [ogImage, setOgImage] = useState(initialData.ogImage);
  const [canonicalUrl, setCanonicalUrl] = useState(initialData.canonicalUrl);
  const [noIndex, setNoIndex] = useState(initialData.noIndex);
  const [sitemapInclude, setSitemapInclude] = useState(
    initialData.sitemapInclude ?? true,
  );
  const [sitemapPriority, setSitemapPriority] = useState(
    initialData.sitemapPriority ?? "0.7",
  );
  const [status, setStatus] = useState<PageStatus>(
    initialData.status === "trashed" ? "draft" : initialData.status,
  );
  const [scheduledForLocal, setScheduledForLocal] = useState(
    toDatetimeLocalValue(initialData.scheduledFor),
  );
  const [publishImmediately, setPublishImmediately] = useState(
    initialData.status !== "scheduled",
  );
  const [loadingAction, setLoadingAction] = useState<
    "draft" | "publish" | "trash" | "preview" | null
  >(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"og" | "content">(
    "content",
  );

  const wasPublished =
    initialData.status === "published" || status === "published";

  const isSystemPage = isSystemSectionPage(slug);

  const seoAuditContent = useMemo(() => {
    if (!isSystemPage && template === "article") {
      return content;
    }

    const blockText = contentBlocks
      .map((block) => {
        const value = block.value;
        if (!value || typeof value !== "object") return "";
        if ("text" in value && typeof value.text === "string") return value.text;
        if ("url" in value && typeof value.url === "string") return value.url;
        return "";
      })
      .filter(Boolean)
      .join(" ");

    const sectionText = JSON.stringify(pageSections ?? {});
    return plainTextAsTiptapDoc(`${title} ${blockText} ${sectionText}`);
  }, [content, contentBlocks, isSystemPage, pageSections, template, title]);

  const livePathPreview = useMemo(() => {
    if (slug === "home") return "/";
    if (parentServiceId) {
      const service = parentServices.find((s) => s.id === parentServiceId);
      if (service) return `/services/${service.slug}/${slug || "…"}`;
    }
    if (parentId) {
      const parent = parentPages.find((p) => p.id === parentId);
      const parentPath =
        parent?.path || (parent?.slug === "home" ? "/" : `/${parent?.slug ?? ""}`);
      if (parentPath === "/") return `/${slug || "…"}`;
      return `${parentPath}/${slug || "…"}`;
    }
    return `/${slug || "…"}`;
  }, [slug, parentId, parentServiceId, parentPages, parentServices]);

  const buildPayload = useCallback(
    (nextStatus: PageStatus) => {
      const scheduledIso =
        nextStatus === "scheduled"
          ? fromDatetimeLocalValue(scheduledForLocal) || null
          : null;

      return {
        id: pageId,
        title,
        slug,
        heroEyebrow,
        heroSubtext,
        heroVisual: {
          mode: heroVisualMode,
          ...(heroVisualMode === "media" && heroMediaUrl.trim()
            ? { mediaUrl: heroMediaUrl.trim() }
            : {}),
        },
        content,
        pageSections,
        showCta,
        template,
        parentId: parentId || null,
        parentServiceId: parentServiceId || null,
        metaTitle,
        metaDescription,
        focusKeyword,
        secondaryKeywords,
        schemaType,
        schemaJson,
        ogImage,
        canonicalUrl,
        noIndex,
        sitemapInclude,
        sitemapPriority,
        status: nextStatus,
        scheduledFor: scheduledIso,
      };
    },
    [
      pageId,
      title,
      slug,
      heroEyebrow,
      heroSubtext,
      heroVisualMode,
      heroMediaUrl,
      content,
      pageSections,
      showCta,
      template,
      parentId,
      parentServiceId,
      metaTitle,
      metaDescription,
      focusKeyword,
      secondaryKeywords,
      schemaType,
      schemaJson,
      ogImage,
      canonicalUrl,
      noIndex,
      sitemapInclude,
      sitemapPriority,
      scheduledForLocal,
    ],
  );

  useEffect(() => {
    formRef.current = buildPayload(status);
  }, [buildPayload, status]);

  useEffect(() => {
    savingRef.current = loadingAction !== null;
  }, [loadingAction]);

  useEffect(() => {
    if (!slug.trim()) {
      return;
    }

    const handle = window.setTimeout(() => {
      void (async () => {
        setSlugStatus("checking");
        const result = await checkPageSlugAvailable(slug, pageId);
        setSlugStatus(result.available ? "available" : "taken");
      })();
    }, 400);

    return () => window.clearTimeout(handle);
  }, [slug, pageId]);

  const effectiveSlugStatus = !slug.trim() ? "idle" : slugStatus;

  const { markSaved } = useEditorAutosave({
    enabled: Boolean(pageId),
    isBusy: () => savingRef.current,
    getPayload: () => {
      const payload = formRef.current as ReturnType<typeof buildPayload>;
      if (!payload.title?.toString().trim() || !payload.slug?.toString().trim()) {
        return null;
      }
      return {
        ...payload,
        id: pageId,
        status: (payload.status as PageStatus) || status,
      };
    },
    save: async (payload) => {
      const result = await autosavePage(
        payload as Parameters<typeof autosavePage>[0],
      );
      if (result.success) {
        if (result.path) setPathPreview(result.path);
      }
      return result;
    },
    onSuccess: () => setLastSavedAt(new Date()),
  });

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugManuallyEdited.current) {
      setSlug(toSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    slugManuallyEdited.current = true;
    setSlug(toSlug(value));
  }

  function handleParentPageChange(value: string) {
    setParentId(value);
    if (value) setParentServiceId("");
  }

  function handleParentServiceChange(value: string) {
    setParentServiceId(value);
    if (value) setParentId("");
  }

  function handleStatusChange(next: PageStatus) {
    setStatus(next);
    if (next === "scheduled") {
      setPublishImmediately(false);
    } else if (next === "published") {
      setPublishImmediately(true);
    }
  }

  function handlePublishImmediatelyChange(checked: boolean) {
    setPublishImmediately(checked);
    if (!checked) {
      setStatus("scheduled");
    } else if (status === "scheduled") {
      setStatus(wasPublished ? "published" : "draft");
    }
  }

  function openMediaPicker(target: "og" | "content") {
    setMediaPickerTarget(target);
    setMediaPickerOpen(true);
  }

  function handleMediaSelect(url: string) {
    if (mediaPickerTarget === "og") {
      setOgImage(url);
      return;
    }
    tiptapRef.current?.insertImage(url);
  }

  async function handleSave(intent: "draft" | "publish") {
    let nextStatus: PageStatus = "draft";

    if (intent === "draft") {
      nextStatus = "draft";
    } else if (!publishImmediately || status === "scheduled") {
      nextStatus = "scheduled";
    } else {
      nextStatus = "published";
    }

    setLoadingAction(intent === "draft" ? "draft" : "publish");
    setStatus(nextStatus);

    const result = await savePage(buildPayload(nextStatus));
    setLoadingAction(null);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    setPageId(result.id);
    if (result.path) setPathPreview(result.path);
    setLastSavedAt(new Date());
    markSaved({
      ...buildPayload(nextStatus),
      id: result.id,
      status: nextStatus,
    });
    toast(
      nextStatus === "published"
        ? wasPublished
          ? "Page updated"
          : "Page published"
        : nextStatus === "scheduled"
          ? "Page scheduled"
          : "Draft saved",
    );

    if (!initialData.id) {
      router.push(`/admin/pages/${result.id}`);
    }

    router.refresh();
  }

  async function handleTrash() {
    if (!pageId) return;
    setLoadingAction("trash");
    const result = await trashPage(pageId);
    setLoadingAction(null);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    toast("Moved to trash");
    router.push("/admin/pages");
    router.refresh();
  }

  const showSchedulePicker = !publishImmediately || status === "scheduled";
  const fieldClassName =
    "w-full rounded-default border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const panelClassName =
    "space-y-3 rounded-default border border-border bg-surface p-4 shadow-soft";

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-wider text-muted">
          {pageId ? "Edit page" : "New page"}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">
          {title.trim() || "Untitled page"}
        </h1>
        {slug === "home" ? (
          <p className="mt-2 max-w-2xl text-sm text-muted">
            This is the public homepage (<span className="font-mono text-foreground">/</span>).
            Use the Rank &amp; SEO panel to set the meta title, description, focus
            keyword, and OG image that Google and social previews use.
          </p>
        ) : null}
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <input
            value={title}
            onChange={(event) => handleTitleChange(event.target.value)}
            placeholder="Add title"
            className="w-full border-0 bg-transparent font-display text-4xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted"
          />

          <div className="space-y-2">
            <label htmlFor="slug" className="text-sm font-medium text-foreground">
              Slug
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="slug"
                value={slug}
                onChange={(event) => handleSlugChange(event.target.value)}
                className={`${fieldClassName} h-11 max-w-md`}
              />
              {slug.trim() ? (
                <span
                  className={`font-mono text-xs ${
                    effectiveSlugStatus === "available"
                      ? "text-success"
                      : effectiveSlugStatus === "taken"
                        ? "text-danger"
                        : "text-muted"
                  }`}
                >
                  {effectiveSlugStatus === "checking"
                    ? "Checking…"
                    : effectiveSlugStatus === "available"
                      ? "Available"
                      : effectiveSlugStatus === "taken"
                        ? "Taken"
                        : null}
                </span>
              ) : null}
            </div>
            <p className="font-mono text-xs text-muted">
              Public URL: {pathPreview || livePathPreview}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="parent-page"
                className="text-sm font-medium text-foreground"
              >
                Parent page
              </label>
              <select
                id="parent-page"
                value={parentId}
                onChange={(e) => handleParentPageChange(e.target.value)}
                className={`${fieldClassName} h-11`}
              >
                <option value="">None (top level)</option>
                {parentPages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.title} ({page.path || `/${page.slug}`})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="parent-service"
                className="text-sm font-medium text-foreground"
              >
                Parent service
              </label>
              <select
                id="parent-service"
                value={parentServiceId}
                onChange={(e) => handleParentServiceChange(e.target.value)}
                className={`${fieldClassName} h-11`}
              >
                <option value="">None</option>
                {parentServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!isSystemPage ? (
            <div className="space-y-2">
              <label
                htmlFor="template"
                className="text-sm font-medium text-foreground"
              >
                Template
              </label>
              <select
                id="template"
                value={template}
                onChange={(e) =>
                  setTemplate(e.target.value as "marketing" | "article")
                }
                className={`${fieldClassName} h-11 max-w-md`}
              >
                <option value="marketing">Marketing (section blocks)</option>
                <option value="article">Article (rich text)</option>
              </select>
            </div>
          ) : null}

          {isSystemPage ? (
            <PageContentEditor
              pageSlug={slug}
              pageSections={pageSections}
              onPageSectionsChange={(value) =>
                setPageSections(value as MarketingPageSections)
              }
              contentBlocks={contentBlocks}
            />
          ) : template === "marketing" ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Hero visual
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="radio"
                      name="page-hero-visual"
                      checked={heroVisualMode === "animation"}
                      onChange={() => setHeroVisualMode("animation")}
                      className="size-4 rounded border-border text-accent focus:ring-accent"
                    />
                    Animation
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="radio"
                      name="page-hero-visual"
                      checked={heroVisualMode === "media"}
                      onChange={() => setHeroVisualMode("media")}
                      className="size-4 rounded border-border text-accent focus:ring-accent"
                    />
                    Media
                  </label>
                </div>

                {heroVisualMode === "animation" ? (
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-medium text-muted">
                      Spline scene URL
                    </label>
                    <input
                      value={
                        (pageSections as MarketingPageSections).heroSplineScene ??
                        ""
                      }
                      onChange={(e) =>
                        setPageSections({
                          ...pageSections,
                          heroSplineScene: e.target.value,
                        })
                      }
                      placeholder="/spline/cloud-storage-isometric.spline"
                      className={fieldClassName}
                    />
                    <p className="text-xs text-muted">
                      Optional. Leave blank for the coded hero illustration.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setHeroMediaPickerOpen(true)}
                        className="inline-flex h-10 items-center justify-center rounded-default border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                      >
                        Pick media
                      </button>
                      {heroMediaUrl ? (
                        <button
                          type="button"
                          onClick={() => setHeroMediaUrl("")}
                          className="text-sm text-danger"
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                    {heroMediaUrl ? (
                      <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-default border border-border bg-transparent">
                        {/\.json(\?|$)/i.test(heroMediaUrl) ? (
                          <p className="p-4 font-mono text-xs text-muted">
                            Lottie JSON selected — white backgrounds are stripped
                            on upload; preview on the public page.
                            <br />
                            <span className="break-all text-foreground">
                              {heroMediaUrl}
                            </span>
                          </p>
                        ) : /\.(mp4|webm|mov)(\?|$)/i.test(heroMediaUrl) ? (
                          <video
                            src={heroMediaUrl}
                            className="size-full object-contain bg-transparent"
                            muted
                            playsInline
                            controls
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={heroMediaUrl}
                            alt="Hero visual preview"
                            className="size-full object-contain bg-transparent"
                          />
                        )}
                      </div>
                    ) : (
                      <p className="font-mono text-xs text-muted">
                        No media selected — PNG, JPEG, WebP, AVIF, GIF, SVG,
                        MP4/WebM, or Lottie JSON
                      </p>
                    )}
                  </div>
                )}
              </div>

              <ServiceSectionsEditor
                value={pageSections as MarketingPageSections}
                onChange={(value) => setPageSections(value)}
              />
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="heroEyebrow"
                    className="text-sm font-medium text-foreground"
                  >
                    Hero eyebrow
                  </label>
                  <input
                    id="heroEyebrow"
                    value={heroEyebrow}
                    onChange={(event) => setHeroEyebrow(event.target.value)}
                    placeholder="Optional label above the title"
                    className={fieldClassName}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="heroSubtext"
                    className="text-sm font-medium text-foreground"
                  >
                    Hero subtext
                  </label>
                  <input
                    id="heroSubtext"
                    value={heroSubtext}
                    onChange={(event) => setHeroSubtext(event.target.value)}
                    placeholder="Optional supporting line"
                    className={fieldClassName}
                  />
                </div>
              </div>

              <label className="flex items-center justify-between gap-3 rounded-default border border-border bg-background px-3 py-3">
                <span className="text-sm font-medium text-foreground">
                  Show the Book a call band at the bottom
                </span>
                <input
                  type="checkbox"
                  checked={showCta}
                  onChange={(event) => setShowCta(event.target.checked)}
                  className="size-4 rounded border-border text-accent focus:ring-accent"
                />
              </label>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Content
                </label>
                <TiptapEditor
                  ref={tiptapRef}
                  content={content}
                  onChange={setContent}
                  onPickImage={() => openMediaPicker("content")}
                />
              </div>
            </>
          )}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className={panelClassName}>
            <h2 className="font-display text-base font-semibold text-foreground">
              Publish
            </h2>

            <div className="space-y-2">
              <label
                htmlFor="page-status"
                className="text-sm font-medium text-foreground"
              >
                Status
              </label>
              <select
                id="page-status"
                value={status === "trashed" ? "draft" : status}
                onChange={(event) =>
                  handleStatusChange(event.target.value as PageStatus)
                }
                className={`${fieldClassName} h-11`}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            <label className="flex items-center justify-between gap-3 rounded-default border border-border bg-background px-3 py-3">
              <span className="text-sm font-medium text-foreground">
                Publish immediately
              </span>
              <input
                type="checkbox"
                checked={publishImmediately}
                onChange={(event) =>
                  handlePublishImmediatelyChange(event.target.checked)
                }
                className="size-4 rounded border-border text-accent focus:ring-accent"
              />
            </label>

            {showSchedulePicker ? (
              <div className="space-y-2">
                <label
                  htmlFor="scheduledFor"
                  className="text-sm font-medium text-foreground"
                >
                  Schedule for
                </label>
                <input
                  id="scheduledFor"
                  type="datetime-local"
                  value={scheduledForLocal}
                  onChange={(event) => {
                    setScheduledForLocal(event.target.value);
                    setStatus("scheduled");
                    setPublishImmediately(false);
                  }}
                  className={`${fieldClassName} h-11`}
                />
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loadingAction !== null}
                onClick={() => handleSave("draft")}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-default border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingAction === "draft" ? "Saving…" : "Save Draft"}
              </button>
              <button
                type="button"
                disabled={loadingAction !== null}
                onClick={() => handleSave("publish")}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-default bg-accent px-4 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingAction === "publish"
                  ? "Saving…"
                  : wasPublished
                    ? "Update"
                    : !publishImmediately || status === "scheduled"
                      ? "Schedule"
                      : "Publish"}
              </button>
            </div>

            {pageId ? (
              <button
                type="button"
                disabled={loadingAction !== null}
                onClick={() => {
                  void (async () => {
                    setLoadingAction("preview");
                    const result = await openPreviewFromAction(() =>
                      createPreviewLink({ type: "page", id: pageId }),
                    );
                    setLoadingAction(null);
                    if (!result.success) {
                      toast(result.error, "error");
                    }
                  })();
                }}
                className="inline-flex h-10 w-full items-center justify-center rounded-default border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:border-accent/40 disabled:opacity-60"
              >
                {loadingAction === "preview" ? "Opening…" : "Preview"}
              </button>
            ) : null}

            {pageId ? (
              <button
                type="button"
                disabled={loadingAction !== null}
                onClick={handleTrash}
                className="text-sm text-danger hover:underline disabled:opacity-60"
              >
                {loadingAction === "trash" ? "Moving…" : "Move to Trash"}
              </button>
            ) : null}

            <p className="font-mono text-xs text-muted">
              {lastSavedAt
                ? `Last saved ${formatSavedAt(lastSavedAt)}`
                : pageId
                  ? "Autosave every 30s"
                  : "Save once to enable autosave"}
            </p>
          </div>

          {pageId ? (
            <PageRevisionsPanel
              pageId={pageId}
              currentTitle={title}
              currentContent={content}
            />
          ) : null}

          <SeoPanel
            title={title}
            slug={slug}
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            focusKeyword={focusKeyword}
            secondaryKeywords={secondaryKeywords}
            schemaType={schemaType}
            schemaJson={schemaJson}
            ogImage={ogImage}
            canonicalUrl={canonicalUrl}
            noIndex={noIndex}
            sitemapInclude={sitemapInclude}
            sitemapPriority={sitemapPriority}
            previewPath={`kavcomexpert.com${livePathPreview}`}
            auditType="page"
            liveAudit={{
              content: seoAuditContent,
              coverImage: "",
              tldr: "",
              postFaqs: [],
            }}
            onMetaTitleChange={setMetaTitle}
            onMetaDescriptionChange={setMetaDescription}
            onFocusKeywordChange={setFocusKeyword}
            onSecondaryKeywordsChange={setSecondaryKeywords}
            onSchemaTypeChange={setSchemaType}
            onSchemaJsonChange={setSchemaJson}
            onOgImageChange={setOgImage}
            onChooseOgImage={() => openMediaPicker("og")}
            onCanonicalUrlChange={setCanonicalUrl}
            onNoIndexChange={setNoIndex}
            onSitemapIncludeChange={setSitemapInclude}
            onSitemapPriorityChange={setSitemapPriority}
          />
        </aside>
      </div>

      <MediaPicker
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
      />

      <MediaPicker
        open={heroMediaPickerOpen}
        onClose={() => setHeroMediaPickerOpen(false)}
        accept="image-video"
        onSelect={(url) => {
          setHeroMediaUrl(url);
          setHeroMediaPickerOpen(false);
        }}
      />
    </div>
  );
}
