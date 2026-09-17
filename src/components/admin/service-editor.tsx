"use client";

import {
  autosaveService,
  checkServiceSlugAvailable,
  saveService,
  trashService,
} from "@/actions/services";
import { createPreviewLink } from "@/actions/preview";
import { MediaPicker } from "@/components/admin/media-picker";
import { SeoPanel } from "@/components/admin/seo-panel";
import { ServiceRevisionsPanel } from "@/components/admin/service-revisions-panel";
import { ServiceSectionsEditor } from "@/components/admin/service-sections-editor";
import { useToast } from "@/components/ui/toast";
import type { PostSchemaType } from "@/lib/posts/constants";
import type { ServiceHeroVisual } from "@/lib/site/service-pages/types";
import { openPreviewFromAction } from "@/lib/preview/open-client";
import {
  emptyServicePageSections,
  type ServicePageSections,
} from "@/lib/services/page-sections";
import {
  formatSavedAt,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  toSlug,
} from "@/lib/admin/editor-format";
import { useEditorAutosave } from "@/hooks/use-editor-autosave";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type ServiceEditorData = {
  id?: string;
  slug: string;
  name: string;
  shortPitch: string;
  heroVisual: ServiceHeroVisual;
  pageSections: ServicePageSections;
  parentId: string | null;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string;
  schemaType: PostSchemaType;
  schemaJson: string;
  ogImage: string;
  canonicalUrl: string;
  noIndex: boolean;
  socialTitle: string;
  socialDescription: string;
  noFollow: boolean;
  noArchive: boolean;
  sitemapInclude: boolean;
  sitemapPriority: string;
  status: "draft" | "published" | "scheduled" | "trashed";
  scheduledFor?: string;
};

export type ServiceParentOption = {
  id: string;
  name: string;
  slug: string;
};

type ServiceStatus = "draft" | "published" | "scheduled" | "trashed";

const fieldClassName =
  "w-full rounded-default border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent";
const panelClassName =
  "space-y-3 rounded-default border border-border bg-surface p-4 shadow-soft";

export function ServiceEditor({
  initialData,
  parentServices,
}: {
  initialData: ServiceEditorData;
  parentServices: ServiceParentOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const slugManual = useRef(Boolean(initialData.slug));
  const savingRef = useRef(false);
  const formRef = useRef<Record<string, unknown>>({});
  const [recordId, setRecordId] = useState(initialData.id);
  const [name, setName] = useState(initialData.name);
  const [slug, setSlug] = useState(initialData.slug);
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [shortPitch, setShortPitch] = useState(initialData.shortPitch);
  const [heroVisualMode, setHeroVisualMode] = useState<
    ServiceHeroVisual["mode"]
  >(initialData.heroVisual?.mode ?? "animation");
  const [heroMediaUrl, setHeroMediaUrl] = useState(
    initialData.heroVisual?.mediaUrl ?? "",
  );
  const [heroMediaPickerOpen, setHeroMediaPickerOpen] = useState(false);
  const [pageSections, setPageSections] = useState(
    initialData.pageSections ?? emptyServicePageSections(),
  );
  const [parentId, setParentId] = useState(initialData.parentId ?? "");
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
  const [socialTitle, setSocialTitle] = useState(initialData.socialTitle);
  const [socialDescription, setSocialDescription] = useState(
    initialData.socialDescription,
  );
  const [noFollow, setNoFollow] = useState(initialData.noFollow);
  const [noArchive, setNoArchive] = useState(initialData.noArchive);
  const [sitemapInclude, setSitemapInclude] = useState(
    initialData.sitemapInclude,
  );
  const [sitemapPriority, setSitemapPriority] = useState(
    initialData.sitemapPriority,
  );
  const [status, setStatus] = useState<ServiceStatus>(
    initialData.status === "trashed" ? "draft" : initialData.status,
  );
  const [scheduledForLocal, setScheduledForLocal] = useState(
    toDatetimeLocalValue(initialData.scheduledFor),
  );
  const [publishImmediately, setPublishImmediately] = useState(
    initialData.status !== "scheduled",
  );
  const [loading, setLoading] = useState<
    "draft" | "publish" | "trash" | "preview" | null
  >(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [ogPickerOpen, setOgPickerOpen] = useState(false);

  const wasPublished =
    initialData.status === "published" || status === "published";

  const buildPayload = useCallback(
    (nextStatus: ServiceStatus) => {
      const scheduledIso =
        nextStatus === "scheduled"
          ? fromDatetimeLocalValue(scheduledForLocal) || null
          : null;

      return {
        id: recordId,
        slug,
        name,
        shortPitch,
        heroVisual: {
          mode: heroVisualMode,
          ...(heroVisualMode === "media" && heroMediaUrl.trim()
            ? { mediaUrl: heroMediaUrl.trim() }
            : {}),
        },
        pageSections,
        parentId: parentId || null,
        metaTitle,
        metaDescription,
        focusKeyword,
        secondaryKeywords,
        schemaType,
        schemaJson,
        ogImage,
        canonicalUrl,
        noIndex,
        socialTitle,
        socialDescription,
        noFollow,
        noArchive,
        sitemapInclude,
        sitemapPriority,
        status: nextStatus,
        scheduledFor: scheduledIso,
      };
    },
    [
      recordId,
      slug,
      name,
      shortPitch,
      heroVisualMode,
      heroMediaUrl,
      pageSections,
      parentId,
      metaTitle,
      metaDescription,
      focusKeyword,
      secondaryKeywords,
      schemaType,
      schemaJson,
      ogImage,
      canonicalUrl,
      noIndex,
      socialTitle,
      socialDescription,
      noFollow,
      noArchive,
      sitemapInclude,
      sitemapPriority,
      scheduledForLocal,
    ],
  );

  useEffect(() => {
    formRef.current = buildPayload(status);
  }, [buildPayload, status]);

  useEffect(() => {
    savingRef.current = loading !== null;
  }, [loading]);

  const dirty = useMemo(() => {
    const initialHeroMode = initialData.heroVisual?.mode ?? "animation";
    const initialHeroMedia = initialData.heroVisual?.mediaUrl ?? "";
    return (
      name !== initialData.name ||
      slug !== initialData.slug ||
      shortPitch !== initialData.shortPitch ||
      JSON.stringify(pageSections) !== JSON.stringify(initialData.pageSections) ||
      parentId !== initialData.parentId ||
      metaTitle !== initialData.metaTitle ||
      metaDescription !== initialData.metaDescription ||
      focusKeyword !== initialData.focusKeyword ||
      secondaryKeywords !== initialData.secondaryKeywords ||
      schemaType !== initialData.schemaType ||
      schemaJson !== initialData.schemaJson ||
      ogImage !== initialData.ogImage ||
      canonicalUrl !== initialData.canonicalUrl ||
      noIndex !== initialData.noIndex ||
      socialTitle !== initialData.socialTitle ||
      socialDescription !== initialData.socialDescription ||
      noFollow !== initialData.noFollow ||
      noArchive !== initialData.noArchive ||
      sitemapInclude !== initialData.sitemapInclude ||
      sitemapPriority !== initialData.sitemapPriority ||
      heroVisualMode !== initialHeroMode ||
      heroMediaUrl !== initialHeroMedia ||
      status !==
        (initialData.status === "trashed" ? "draft" : initialData.status) ||
      scheduledForLocal !== toDatetimeLocalValue(initialData.scheduledFor)
    );
  }, [
    name,
    slug,
    shortPitch,
    pageSections,
    parentId,
    metaTitle,
    metaDescription,
    focusKeyword,
    secondaryKeywords,
    schemaType,
    schemaJson,
    ogImage,
    canonicalUrl,
    noIndex,
    socialTitle,
    socialDescription,
    noFollow,
    noArchive,
    sitemapInclude,
    sitemapPriority,
    heroVisualMode,
    heroMediaUrl,
    status,
    scheduledForLocal,
    initialData,
  ]);

  useUnsavedChangesWarning(dirty);

  useEffect(() => {
    if (!slug.trim()) {
      return;
    }

    const handle = window.setTimeout(() => {
      void (async () => {
        setSlugStatus("checking");
        const result = await checkServiceSlugAvailable(slug, recordId);
        setSlugStatus(result.available ? "available" : "taken");
      })();
    }, 400);

    return () => window.clearTimeout(handle);
  }, [slug, recordId]);

  const effectiveSlugStatus = !slug.trim() ? "idle" : slugStatus;

  const { markSaved } = useEditorAutosave({
    enabled: Boolean(recordId),
    isBusy: () => savingRef.current,
    getPayload: () => {
      const payload = formRef.current as ReturnType<typeof buildPayload>;
      if (!payload.name?.toString().trim() || !payload.slug?.toString().trim()) {
        return null;
      }
      return {
        ...payload,
        id: recordId,
        status: (payload.status as ServiceStatus) || status,
      };
    },
    save: async (payload) =>
      autosaveService(payload as Parameters<typeof autosaveService>[0]),
    onSuccess: () => setLastSavedAt(new Date()),
  });

  function handleNameChange(value: string) {
    setName(value);
    if (!slugManual.current) {
      setSlug(toSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    slugManual.current = true;
    setSlug(toSlug(value));
  }

  function handleStatusChange(next: ServiceStatus) {
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
    let nextStatus: ServiceStatus = "draft";

    if (intent === "draft") {
      nextStatus = "draft";
    } else if (!publishImmediately || status === "scheduled") {
      nextStatus = "scheduled";
    } else {
      nextStatus = "published";
    }

    setLoading(intent === "draft" ? "draft" : "publish");
    setStatus(nextStatus);

    const result = await saveService(buildPayload(nextStatus));
    setLoading(null);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    setRecordId(result.id);
    setLastSavedAt(new Date());
    markSaved({
      ...buildPayload(nextStatus),
      id: result.id,
      status: nextStatus,
    });
    toast(
      nextStatus === "published"
        ? wasPublished
          ? "Service updated"
          : "Service published"
        : nextStatus === "scheduled"
          ? "Service scheduled"
          : "Draft saved",
    );
    if (!initialData.id) router.replace(`/admin/services/${result.id}`);
    router.refresh();
  }

  async function handlePreview() {
    if (!slug.trim()) {
      toast("Add a slug first", "error");
      return;
    }
    setLoading("preview");
    // Always flush current edits so Preview matches the editor.
    const previewStatus: ServiceStatus =
      status === "published" || status === "scheduled" ? status : "draft";
    const saveResult = await saveService(buildPayload(previewStatus));
    if (!saveResult.success) {
      setLoading(null);
      toast(saveResult.error, "error");
      return;
    }
    if (saveResult.id) setRecordId(saveResult.id);
    setLastSavedAt(new Date());

    const result = await openPreviewFromAction(() =>
      createPreviewLink({ type: "service", id: saveResult.id! }),
    );
    setLoading(null);
    if (!result.success) {
      toast(result.error, "error");
    }
  }

  async function handleTrash() {
    if (!recordId) return;
    setLoading("trash");
    const result = await trashService(recordId);
    setLoading(null);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast("Moved to trash");
    router.push("/admin/services");
    router.refresh();
  }

  const showSchedulePicker = !publishImmediately || status === "scheduled";

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-wider text-muted">
          {recordId ? "Edit service" : "New service"}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">
          {name.trim() || "New service"}
        </h1>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Service name"
            className="w-full border-0 bg-transparent font-display text-4xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted"
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Slug</label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
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
                        : ""}
                </span>
              ) : null}
            </div>
            <p className="text-xs text-muted">
              Public URL:{" "}
              {parentId
                ? `/services/${parentServices.find((s) => s.id === parentId)?.slug || "…"}/${slug || "…"}`
                : `/services/${slug || "…"}`}
            </p>
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
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className={`${fieldClassName} h-10`}
            >
              <option value="">None (top level)</option>
              {parentServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted">
              Nest this service under another for a parent / child URL.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Hero visual
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="hero-visual"
                  checked={heroVisualMode === "animation"}
                  onChange={() => setHeroVisualMode("animation")}
                  className="size-4 rounded border-border text-accent focus:ring-accent"
                />
                Animation
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="hero-visual"
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
                  value={pageSections.heroSplineScene}
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
                        upload; preview on the public service page.
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
                    No media selected — PNG, JPEG, WebP, AVIF, GIF, SVG, MP4/WebM,
                    or Lottie JSON
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Short pitch
            </label>
            <textarea
              value={shortPitch}
              onChange={(e) => setShortPitch(e.target.value)}
              rows={3}
              className={fieldClassName}
              placeholder="Shown in listings and as SEO fallback"
            />
          </div>

          <ServiceSectionsEditor
            value={pageSections}
            onChange={setPageSections}
          />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className={panelClassName}>
            <h2 className="font-display text-base font-semibold text-foreground">
              Publish
            </h2>

            <div className="space-y-2">
              <label
                htmlFor="service-status"
                className="text-sm font-medium text-foreground"
              >
                Status
              </label>
              <select
                id="service-status"
                value={status === "trashed" ? "draft" : status}
                onChange={(event) =>
                  handleStatusChange(event.target.value as ServiceStatus)
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
                disabled={loading !== null}
                onClick={() => void handleSave("draft")}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-default border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading === "draft" ? "Saving…" : "Save Draft"}
              </button>
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => void handleSave("publish")}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-default bg-accent px-4 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading === "publish"
                  ? "Saving…"
                  : wasPublished
                    ? "Update"
                    : !publishImmediately || status === "scheduled"
                      ? "Schedule"
                      : "Publish"}
              </button>
            </div>

            {recordId ? (
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => void handlePreview()}
                className="inline-flex h-10 w-full items-center justify-center rounded-default border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:border-accent/40 disabled:opacity-60"
              >
                {loading === "preview" ? "Opening…" : "Preview"}
              </button>
            ) : null}

            {recordId ? (
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => void handleTrash()}
                className="text-sm text-danger hover:underline disabled:opacity-60"
              >
                {loading === "trash" ? "Moving…" : "Move to Trash"}
              </button>
            ) : null}

            <p className="font-mono text-xs text-muted">
              {lastSavedAt
                ? `Last saved ${formatSavedAt(lastSavedAt)}`
                : recordId
                  ? "Autosave every 30s"
                  : "Save once to enable autosave"}
            </p>
          </div>

          <SeoPanel
            title={name}
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
            socialTitle={socialTitle}
            socialDescription={socialDescription}
            noFollow={noFollow}
            noArchive={noArchive}
            sitemapInclude={sitemapInclude}
            sitemapPriority={sitemapPriority}
            previewPath={`kavcomexpert.com/services/${slug || "slug"}`}
            schemaOptions={["Service", "WebPage"]}
            onMetaTitleChange={setMetaTitle}
            onMetaDescriptionChange={setMetaDescription}
            onFocusKeywordChange={setFocusKeyword}
            onSecondaryKeywordsChange={setSecondaryKeywords}
            onSchemaTypeChange={setSchemaType}
            onSchemaJsonChange={setSchemaJson}
            onOgImageChange={setOgImage}
            onChooseOgImage={() => setOgPickerOpen(true)}
            onCanonicalUrlChange={setCanonicalUrl}
            onNoIndexChange={setNoIndex}
            onSocialTitleChange={setSocialTitle}
            onSocialDescriptionChange={setSocialDescription}
            onNoFollowChange={setNoFollow}
            onNoArchiveChange={setNoArchive}
            onSitemapIncludeChange={setSitemapInclude}
            onSitemapPriorityChange={setSitemapPriority}
          />

          {recordId ? (
            <ServiceRevisionsPanel
              serviceId={recordId}
              currentName={name}
              currentShortPitch={shortPitch}
            />
          ) : null}
        </aside>
      </div>

      <MediaPicker
        open={ogPickerOpen}
        onClose={() => setOgPickerOpen(false)}
        onSelect={setOgImage}
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
