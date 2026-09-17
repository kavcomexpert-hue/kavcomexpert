"use client";

import {
  autosaveLandingPage,
  checkLandingPageSlugAvailable,
  saveLandingPage,
  trashLandingPage,
} from "@/actions/landing-pages";
import { MediaPicker } from "@/components/admin/media-picker";
import { LandingPageRevisionsPanel } from "@/components/admin/landing-page-revisions-panel";
import { SeoPanel } from "@/components/admin/seo-panel";
import { ServiceSectionsEditor } from "@/components/admin/service-sections-editor";
import { useToast } from "@/components/ui/toast";
import type { PostSchemaType } from "@/lib/posts/constants";
import { plainTextAsTiptapDoc } from "@/lib/posts/constants";
import {
  emptyMarketingPageSections,
  type MarketingPageSections,
} from "@/lib/services/page-sections";
import type { ServiceHeroVisual } from "@/lib/site/service-pages/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formatSavedAt,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  toSlug,
} from "@/lib/admin/editor-format";
import { useEditorAutosave } from "@/hooks/use-editor-autosave";

export type LandingPageEditorInitialData = {
  id?: string;
  title: string;
  slug: string;
  path?: string;
  heroVisual: ServiceHeroVisual;
  content: unknown;
  pageSections: MarketingPageSections;
  layoutKind: "marketing" | "custom";
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

type LandingPageEditorProps = {
  initialData: LandingPageEditorInitialData;
};

type LandingStatus = "draft" | "published" | "scheduled" | "trashed";

export function LandingPageEditor({ initialData }: LandingPageEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const slugManuallyEdited = useRef(Boolean(initialData.slug));
  const savingRef = useRef(false);
  const formRef = useRef<Record<string, unknown>>({});

  const [pageId, setPageId] = useState(initialData.id);
  const [title, setTitle] = useState(initialData.title);
  const [slug, setSlug] = useState(initialData.slug);
  const [pathPreview, setPathPreview] = useState(initialData.path ?? "");
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [layoutKind, setLayoutKind] = useState<"marketing" | "custom">(
    initialData.layoutKind,
  );
  const [heroVisualMode, setHeroVisualMode] = useState<
    ServiceHeroVisual["mode"]
  >(initialData.heroVisual?.mode ?? "animation");
  const [heroMediaUrl, setHeroMediaUrl] = useState(
    initialData.heroVisual?.mediaUrl ?? "",
  );
  const [heroMediaPickerOpen, setHeroMediaPickerOpen] = useState(false);
  const [content] = useState(initialData.content);
  const [pageSections, setPageSections] = useState<MarketingPageSections>(
    initialData.pageSections ?? emptyMarketingPageSections(),
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
  const [status, setStatus] = useState<LandingStatus>(
    initialData.status === "trashed" ? "draft" : initialData.status,
  );
  const [scheduledForLocal, setScheduledForLocal] = useState(
    toDatetimeLocalValue(initialData.scheduledFor),
  );
  const [publishImmediately, setPublishImmediately] = useState(
    initialData.status !== "scheduled",
  );
  const [loadingAction, setLoadingAction] = useState<
    "draft" | "publish" | "trash" | null
  >(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const wasPublished =
    initialData.status === "published" || status === "published";

  const seoAuditContent = useMemo(() => {
    const sectionText = JSON.stringify(pageSections ?? {});
    return plainTextAsTiptapDoc(`${title} ${sectionText}`);
  }, [pageSections, title]);

  const livePathPreview = `/${slug || "…"}`;

  const buildPayload = useCallback(
    (nextStatus: LandingStatus) => {
      const scheduledIso =
        nextStatus === "scheduled"
          ? fromDatetimeLocalValue(scheduledForLocal) || null
          : null;

      return {
        id: pageId,
        title,
        slug,
        heroVisual: {
          mode: heroVisualMode,
          ...(heroVisualMode === "media" && heroMediaUrl.trim()
            ? { mediaUrl: heroMediaUrl.trim() }
            : {}),
        },
        content,
        pageSections,
        layoutKind,
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
      heroVisualMode,
      heroMediaUrl,
      content,
      pageSections,
      layoutKind,
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
        const result = await checkLandingPageSlugAvailable(slug, pageId);
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
        status: (payload.status as LandingStatus) || status,
      };
    },
    save: async (payload) => {
      const result = await autosaveLandingPage(
        payload as Parameters<typeof autosaveLandingPage>[0],
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

  function handleStatusChange(next: LandingStatus) {
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

  async function handleSave(intent: "draft" | "publish") {
    let nextStatus: LandingStatus = "draft";

    if (intent === "draft") {
      nextStatus = "draft";
    } else if (!publishImmediately || status === "scheduled") {
      nextStatus = "scheduled";
    } else {
      nextStatus = "published";
    }

    setLoadingAction(intent === "draft" ? "draft" : "publish");
    setStatus(nextStatus);

    const result = await saveLandingPage(buildPayload(nextStatus));
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
          ? "Landing page updated"
          : "Landing page published"
        : nextStatus === "scheduled"
          ? "Landing page scheduled"
          : "Draft saved",
    );

    if (!initialData.id) {
      router.push(`/admin/landing-pages/${result.id}`);
    }

    router.refresh();
  }

  async function handleTrash() {
    if (!pageId) return;
    setLoadingAction("trash");
    const result = await trashLandingPage(pageId);
    setLoadingAction(null);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    toast("Moved to trash");
    router.push("/admin/landing-pages");
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
          {pageId ? "Edit landing page" : "New landing page"}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">
          {title.trim() || "Untitled landing page"}
        </h1>
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

          <div className="space-y-2">
            <label
              htmlFor="layout-kind"
              className="text-sm font-medium text-foreground"
            >
              Layout
            </label>
            <select
              id="layout-kind"
              value={layoutKind}
              onChange={(e) =>
                setLayoutKind(e.target.value as "marketing" | "custom")
              }
              className={`${fieldClassName} h-11 max-w-md`}
            >
              <option value="marketing">Marketing (section blocks)</option>
              <option value="custom">Custom (dedicated template)</option>
            </select>
            {layoutKind === "custom" ? (
              <p className="text-sm text-muted">
                Custom layout uses a dedicated public template (e.g. Houston CPA).
                Edit SEO, publish status, and hero/section fields here. The live
                body stays on the dedicated route until you switch to Marketing.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Hero visual
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="landing-hero-visual"
                  checked={heroVisualMode === "animation"}
                  onChange={() => setHeroVisualMode("animation")}
                  className="size-4 rounded border-border text-accent focus:ring-accent"
                />
                Animation
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="landing-hero-visual"
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
                  value={pageSections.heroSplineScene ?? ""}
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
                        Lottie JSON selected — white backgrounds are stripped on
                        upload; preview on the public page.
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
            value={pageSections}
            onChange={(value) => setPageSections(value)}
          />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className={panelClassName}>
            <h2 className="font-display text-base font-semibold text-foreground">
              Publish
            </h2>

            <div className="space-y-2">
              <label
                htmlFor="landing-status"
                className="text-sm font-medium text-foreground"
              >
                Status
              </label>
              <select
                id="landing-status"
                value={status === "trashed" ? "draft" : status}
                onChange={(event) =>
                  handleStatusChange(event.target.value as LandingStatus)
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
            <LandingPageRevisionsPanel
              landingPageId={pageId}
              currentTitle={title}
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
            onChooseOgImage={() => setMediaPickerOpen(true)}
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
        onSelect={(url) => {
          setOgImage(url);
          setMediaPickerOpen(false);
        }}
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
