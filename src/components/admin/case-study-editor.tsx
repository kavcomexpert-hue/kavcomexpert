"use client";

import {
  autosaveCaseStudy,
  checkCaseStudySlugAvailable,
  saveCaseStudy,
  trashCaseStudy,
} from "@/actions/case-studies";
import { createPreviewLink } from "@/actions/preview";
import { openPreviewFromAction } from "@/lib/preview/open-client";
import { CaseStudyRevisionsPanel } from "@/components/admin/case-study-revisions-panel";
import {
  MediaGalleryPicker,
  type GalleryItem,
} from "@/components/admin/media-gallery-picker";
import { MediaPicker } from "@/components/admin/media-picker";
import { SeoPanel } from "@/components/admin/seo-panel";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { useToast } from "@/components/ui/toast";
import {
  CASE_STUDY_LABEL_DEFAULTS,
  type CaseStudySectionLabels,
} from "@/lib/case-studies/section-labels";
import type { PostSchemaType } from "@/lib/posts/constants";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatSavedAt,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  toSlug,
} from "@/lib/admin/editor-format";
import { useEditorAutosave } from "@/hooks/use-editor-autosave";

type ClientQuote = {
  quote: string;
  name: string;
  role: string;
  videoUrl: string;
};

export type CaseStudyEditorData = {
  id?: string;
  slug: string;
  client: string;
  pageHeading: string;
  industry: string;
  website: string;
  engagementType: string;
  servicesProvided: string;
  location: string;
  platformStack: string;
  infoHeadlineLabel: string;
  infoHeadlineValue: string;
  challenge: string;
  challengeMedia: string;
  approach: unknown;
  approachMedia: string;
  solution: unknown;
  solutionMedia: string;
  clientNoticed: unknown;
  clientNoticedMedia: string;
  sectionLabels: CaseStudySectionLabels;
  gallery: GalleryItem[];
  clientQuote: ClientQuote;
  serviceSlugs: string[];
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  schemaType: PostSchemaType;
  ogImage: string;
  canonicalUrl: string;
  noIndex: boolean;
  sitemapInclude: boolean;
  sitemapPriority: string;
  status: "draft" | "published" | "scheduled" | "trashed";
  scheduledFor?: string;
};

type ServiceOption = {
  id: string;
  slug: string;
  name: string;
};

type CaseStudyStatus = "draft" | "published" | "scheduled" | "trashed";

type EditorTabId = "content" | "media" | "labels" | "seo";

const editorTabs: { id: EditorTabId; label: string }[] = [
  { id: "content", label: "Content" },
  { id: "media", label: "Media" },
  { id: "labels", label: "Section labels" },
  { id: "seo", label: "SEO" },
];

const LABEL_FIELDS: {
  key: keyof typeof CASE_STUDY_LABEL_DEFAULTS;
  label: string;
}[] = [
  { key: "backLink", label: "Back link" },
  { key: "visitSite", label: "Visit site link" },
  { key: "clientCardClientLabel", label: "Client card: client label" },
  { key: "clientCardIndustryLabel", label: "Client card: industry label" },
  { key: "clientCardServicesLabel", label: "Client card: services label" },
  { key: "clientCardLocationLabel", label: "Client card: location label" },
  { key: "clientCardPlatformLabel", label: "Client card: platform / stack label" },
  { key: "clientCardEngagementLabel", label: "Client card: engagement label" },
  { key: "challengeEyebrow", label: "Challenge eyebrow" },
  { key: "challengeHeadline", label: "Challenge headline" },
  { key: "approachEyebrow", label: "Approach eyebrow" },
  { key: "approachHeadline", label: "Approach headline" },
  { key: "solutionEyebrow", label: "Delivery eyebrow" },
  { key: "solutionHeadline", label: "Delivery headline" },
  { key: "clientNoticedEyebrow", label: "Rollout eyebrow" },
  { key: "clientNoticedHeadline", label: "Rollout headline" },
  { key: "galleryEyebrow", label: "Gallery eyebrow" },
  { key: "galleryHeadline", label: "Gallery headline" },
  { key: "feedbackEyebrow", label: "Client feedback eyebrow" },
];

type CaseStudyEditorProps = {
  initialData: CaseStudyEditorData;
  services: ServiceOption[];
  canPublish?: boolean;
};

export function CaseStudyEditor({
  initialData,
  services,
  canPublish = false,
}: CaseStudyEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const slugManuallyEdited = useRef(Boolean(initialData.slug));
  const savingRef = useRef(false);
  const formRef = useRef<Record<string, unknown>>({});

  const [recordId, setRecordId] = useState(initialData.id);
  const [client, setClient] = useState(initialData.client);
  const [pageHeading, setPageHeading] = useState(initialData.pageHeading);
  const [slug, setSlug] = useState(initialData.slug);
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [industry, setIndustry] = useState(initialData.industry);
  const [website, setWebsite] = useState(initialData.website);
  const [engagementType, setEngagementType] = useState(
    initialData.engagementType,
  );
  const [servicesProvided, setServicesProvided] = useState(
    initialData.servicesProvided,
  );
  const [location, setLocation] = useState(initialData.location);
  const [platformStack, setPlatformStack] = useState(
    initialData.platformStack,
  );
  const [infoHeadlineLabel, setInfoHeadlineLabel] = useState(
    initialData.infoHeadlineLabel,
  );
  const [infoHeadlineValue, setInfoHeadlineValue] = useState(
    initialData.infoHeadlineValue,
  );
  const [challenge, setChallenge] = useState(initialData.challenge);
  const [challengeMedia, setChallengeMedia] = useState(
    initialData.challengeMedia,
  );
  const [approach, setApproach] = useState(initialData.approach);
  const [approachMedia, setApproachMedia] = useState(initialData.approachMedia);
  const [solution, setSolution] = useState(initialData.solution);
  const [solutionMedia, setSolutionMedia] = useState(initialData.solutionMedia);
  const [clientNoticed, setClientNoticed] = useState(initialData.clientNoticed);
  const [clientNoticedMedia, setClientNoticedMedia] = useState(
    initialData.clientNoticedMedia,
  );
  const [sectionLabels, setSectionLabels] = useState<CaseStudySectionLabels>(
    initialData.sectionLabels,
  );
  const [gallery, setGallery] = useState<GalleryItem[]>(initialData.gallery);
  const [clientQuote, setClientQuote] = useState<ClientQuote>(
    initialData.clientQuote,
  );
  const [serviceSlugs, setServiceSlugs] = useState<string[]>(
    initialData.serviceSlugs,
  );
  const [metaTitle, setMetaTitle] = useState(initialData.metaTitle);
  const [metaDescription, setMetaDescription] = useState(
    initialData.metaDescription,
  );
  const [focusKeyword, setFocusKeyword] = useState(initialData.focusKeyword);
  const [schemaType, setSchemaType] = useState<PostSchemaType>(
    initialData.schemaType,
  );
  const [ogImage, setOgImage] = useState(initialData.ogImage);
  const [canonicalUrl, setCanonicalUrl] = useState(initialData.canonicalUrl);
  const [noIndex, setNoIndex] = useState(initialData.noIndex);
  const [sitemapInclude, setSitemapInclude] = useState(
    initialData.sitemapInclude,
  );
  const [sitemapPriority, setSitemapPriority] = useState(
    initialData.sitemapPriority,
  );
  const [status, setStatus] = useState<CaseStudyStatus>(
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
  const [tab, setTab] = useState<EditorTabId>("content");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [ogPickerOpen, setOgPickerOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<
    | "challenge"
    | "approach"
    | "solution"
    | "clientNoticed"
    | null
  >(null);

  const wasPublished =
    initialData.status === "published" || status === "published";

  const buildPayload = useCallback(
    (nextStatus: CaseStudyStatus) => {
      const scheduledIso =
        nextStatus === "scheduled"
          ? fromDatetimeLocalValue(scheduledForLocal) || null
          : null;

      const quote =
        clientQuote.quote.trim() && clientQuote.name.trim()
          ? {
              quote: clientQuote.quote.trim(),
              name: clientQuote.name.trim(),
              role: clientQuote.role.trim() || undefined,
              videoUrl: clientQuote.videoUrl.trim() || null,
            }
          : null;

      return {
        id: recordId,
        slug,
        client,
        pageHeading,
        industry,
        website,
        engagementType,
        servicesProvided,
        location,
        platformStack,
        infoHeadlineLabel,
        infoHeadlineValue,
        challenge,
        challengeMedia,
        approach,
        approachMedia,
        solution,
        solutionMedia,
        clientNoticed,
        clientNoticedMedia,
        sectionLabels,
        gallery,
        clientQuote: quote,
        serviceSlugs,
        metaTitle,
        metaDescription,
        focusKeyword,
        schemaType,
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
      recordId,
      slug,
      client,
      pageHeading,
      industry,
      website,
      engagementType,
      servicesProvided,
      location,
      platformStack,
      infoHeadlineLabel,
      infoHeadlineValue,
      challenge,
      challengeMedia,
      approach,
      approachMedia,
      solution,
      solutionMedia,
      clientNoticed,
      clientNoticedMedia,
      sectionLabels,
      gallery,
      clientQuote,
      serviceSlugs,
      metaTitle,
      metaDescription,
      focusKeyword,
      schemaType,
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
        const result = await checkCaseStudySlugAvailable(slug, recordId);
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
      if (
        !payload.client?.toString().trim() ||
        !payload.slug?.toString().trim()
      ) {
        return null;
      }
      return {
        ...payload,
        id: recordId,
        status: (payload.status as CaseStudyStatus) || status,
      };
    },
    save: async (payload) =>
      autosaveCaseStudy(payload as Parameters<typeof autosaveCaseStudy>[0]),
    onSuccess: () => setLastSavedAt(new Date()),
  });

  function handleClientChange(value: string) {
    setClient(value);
    if (!slugManuallyEdited.current) {
      setSlug(toSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    slugManuallyEdited.current = true;
    setSlug(toSlug(value));
  }

  function handleStatusChange(next: CaseStudyStatus) {
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

  function toggleService(slugValue: string) {
    setServiceSlugs((current) =>
      current.includes(slugValue)
        ? current.filter((item) => item !== slugValue)
        : [...current, slugValue],
    );
  }

  function setLabel(
    key: keyof typeof CASE_STUDY_LABEL_DEFAULTS,
    value: string,
  ) {
    setSectionLabels((current) => ({ ...current, [key]: value }));
  }

  function applyMediaSelection(url: string) {
    if (mediaTarget === "challenge") setChallengeMedia(url);
    if (mediaTarget === "approach") setApproachMedia(url);
    if (mediaTarget === "solution") setSolutionMedia(url);
    if (mediaTarget === "clientNoticed") setClientNoticedMedia(url);
    setMediaTarget(null);
  }

  async function handleSave(intent: "draft" | "publish") {
    let nextStatus: CaseStudyStatus = "draft";

    if (intent === "draft" || !canPublish) {
      nextStatus = "draft";
    } else if (!publishImmediately || status === "scheduled") {
      nextStatus = "scheduled";
    } else {
      nextStatus = "published";
    }

    setLoadingAction(intent === "draft" || !canPublish ? "draft" : "publish");
    setStatus(nextStatus);

    const result = await saveCaseStudy(buildPayload(nextStatus));
    setLoadingAction(null);

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
          ? "Case study updated"
          : "Case study published"
        : nextStatus === "scheduled"
          ? "Case study scheduled"
          : "Draft saved",
    );

    if (!initialData.id) {
      router.replace(`/admin/case-studies/${result.id}`);
    }

    router.refresh();
  }

  async function handleTrash() {
    if (!recordId) return;
    setLoadingAction("trash");
    const result = await trashCaseStudy(recordId);
    setLoadingAction(null);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    toast("Moved to trash");
    router.push("/admin/case-studies");
    router.refresh();
  }

  const showSchedulePicker = !publishImmediately || status === "scheduled";
  const fieldClassName =
    "w-full rounded-default border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const panelClassName =
    "space-y-3 rounded-default border border-border bg-surface p-4 shadow-soft";

  function MediaField({
    label,
    value,
    onChange,
    onClear,
    onPick,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onClear: () => void;
    onPick: () => void;
  }) {
    return (
      <div className={panelClassName}>
        <h2 className="font-display text-base font-semibold text-foreground">
          {label}
        </h2>
        <p className="text-sm text-muted">Optional. Enables a two-column layout.</p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onPick}
            className="inline-flex h-10 items-center justify-center rounded-default border border-border px-4 text-sm font-medium text-foreground"
          >
            {value ? "Change media" : "Choose media"}
          </button>
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt=""
                className="size-16 rounded-default border border-border object-cover"
              />
              <button
                type="button"
                onClick={onClear}
                className="text-sm text-danger hover:underline"
              >
                Remove
              </button>
            </>
          ) : null}
        </div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste an image / video URL"
          className={fieldClassName}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="font-display text-3xl font-semibold text-foreground">
          {(pageHeading.trim() || client.trim()) || "New case study"}
        </h1>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-1 rounded-default border border-border bg-background p-1">
            {editorTabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-[10px] px-3 py-2 text-sm font-medium transition-colors ${
                  tab === item.id
                    ? "bg-accent text-surface"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === "content" ? (
            <>
              <div className="space-y-2">
                <label
                  htmlFor="case-study-page-heading"
                  className="text-sm font-medium text-foreground"
                >
                  Page heading
                </label>
                <input
                  id="case-study-page-heading"
                  value={pageHeading}
                  onChange={(e) => setPageHeading(e.target.value)}
                  placeholder="Page heading"
                  className="w-full border-0 bg-transparent font-display text-4xl font-semibold text-foreground outline-none placeholder:text-muted"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="case-study-client"
                  className="text-sm font-medium text-foreground"
                >
                  Client name
                </label>
                <input
                  id="case-study-client"
                  value={client}
                  onChange={(e) => handleClientChange(e.target.value)}
                  placeholder="Client name"
                  className={fieldClassName}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="case-study-slug"
                  className="text-sm font-medium text-foreground"
                >
                  Slug
                </label>
                <input
                  id="case-study-slug"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className={fieldClassName}
                />
                {effectiveSlugStatus === "checking" ? (
                  <p className="font-mono text-xs text-muted">Checking slug…</p>
                ) : effectiveSlugStatus === "available" ? (
                  <p className="font-mono text-xs text-success">Slug available</p>
                ) : effectiveSlugStatus === "taken" ? (
                  <p className="font-mono text-xs text-danger">
                    Slug already taken
                  </p>
                ) : null}
              </div>

              <div className={panelClassName}>
                <h2 className="font-display text-base font-semibold text-foreground">
                  Client information card
                </h2>
                <p className="text-sm text-muted">
                  Optional. Only filled rows appear in the hero card. Client name
                  is shown in the card; page heading is the large title beside
                  it.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="case-study-industry"
                      className="text-sm font-medium text-foreground"
                    >
                      Industry
                    </label>
                    <input
                      id="case-study-industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className={fieldClassName}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="case-study-website"
                      className="text-sm font-medium text-foreground"
                    >
                      Website URL
                    </label>
                    <input
                      id="case-study-website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://"
                      className={fieldClassName}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label
                      htmlFor="case-study-services"
                      className="text-sm font-medium text-foreground"
                    >
                      Services provided
                    </label>
                    <input
                      id="case-study-services"
                      value={servicesProvided}
                      onChange={(e) => setServicesProvided(e.target.value)}
                      placeholder="Web design, SEO, ongoing support…"
                      className={fieldClassName}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="case-study-location"
                      className="text-sm font-medium text-foreground"
                    >
                      Location
                    </label>
                    <input
                      id="case-study-location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="United States"
                      className={fieldClassName}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="case-study-platform"
                      className="text-sm font-medium text-foreground"
                    >
                      Platform / Stack
                    </label>
                    <input
                      id="case-study-platform"
                      value={platformStack}
                      onChange={(e) => setPlatformStack(e.target.value)}
                      placeholder="WordPress, WooCommerce…"
                      className={fieldClassName}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label
                      htmlFor="case-study-engagement"
                      className="text-sm font-medium text-foreground"
                    >
                      Engagement type
                    </label>
                    <input
                      id="case-study-engagement"
                      value={engagementType}
                      onChange={(e) => setEngagementType(e.target.value)}
                      placeholder="Monthly Retainer, One-time Project…"
                      className={fieldClassName}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="case-study-info-label"
                      className="text-sm font-medium text-foreground"
                    >
                      Headline label
                    </label>
                    <input
                      id="case-study-info-label"
                      value={infoHeadlineLabel}
                      onChange={(e) => setInfoHeadlineLabel(e.target.value)}
                      placeholder="Conversion lift"
                      className={fieldClassName}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="case-study-info-value"
                      className="text-sm font-medium text-foreground"
                    >
                      Headline value
                    </label>
                    <input
                      id="case-study-info-value"
                      value={infoHeadlineValue}
                      onChange={(e) => setInfoHeadlineValue(e.target.value)}
                      placeholder="2.4×"
                      className={fieldClassName}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="case-study-challenge"
                  className="text-sm font-medium text-foreground"
                >
                  Challenge
                </label>
                <textarea
                  id="case-study-challenge"
                  value={challenge}
                  onChange={(e) => setChallenge(e.target.value)}
                  rows={4}
                  className={fieldClassName}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  How we approached it
                </label>
                <TiptapEditor content={approach} onChange={setApproach} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  What we did
                </label>
                <TiptapEditor content={solution} onChange={setSolution} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  What the client&apos;s team noticed
                </label>
                <TiptapEditor
                  content={clientNoticed}
                  onChange={setClientNoticed}
                />
              </div>

              <div className={panelClassName}>
                <h2 className="font-display text-base font-semibold text-foreground">
                  Client quote
                </h2>
                <div className="space-y-2">
                  <label
                    htmlFor="client-quote"
                    className="text-sm font-medium text-foreground"
                  >
                    Quote
                  </label>
                  <textarea
                    id="client-quote"
                    value={clientQuote.quote}
                    onChange={(e) =>
                      setClientQuote((q) => ({ ...q, quote: e.target.value }))
                    }
                    rows={3}
                    className={fieldClassName}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="client-quote-name"
                      className="text-sm font-medium text-foreground"
                    >
                      Name
                    </label>
                    <input
                      id="client-quote-name"
                      value={clientQuote.name}
                      onChange={(e) =>
                        setClientQuote((q) => ({ ...q, name: e.target.value }))
                      }
                      className={fieldClassName}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="client-quote-role"
                      className="text-sm font-medium text-foreground"
                    >
                      Role
                    </label>
                    <input
                      id="client-quote-role"
                      value={clientQuote.role}
                      onChange={(e) =>
                        setClientQuote((q) => ({ ...q, role: e.target.value }))
                      }
                      className={fieldClassName}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="client-quote-video"
                    className="text-sm font-medium text-foreground"
                  >
                    Video URL
                  </label>
                  <input
                    id="client-quote-video"
                    value={clientQuote.videoUrl}
                    onChange={(e) =>
                      setClientQuote((q) => ({
                        ...q,
                        videoUrl: e.target.value,
                      }))
                    }
                    className={fieldClassName}
                  />
                </div>
              </div>

              <div className={panelClassName}>
                <h2 className="font-display text-base font-semibold text-foreground">
                  Related services
                </h2>
                {services.length === 0 ? (
                  <p className="text-sm text-muted">No services available.</p>
                ) : (
                  <ul className="max-h-56 space-y-2 overflow-auto">
                    {services.map((service) => (
                      <li key={service.id}>
                        <label className="flex items-center gap-2 text-sm text-foreground">
                          <input
                            type="checkbox"
                            checked={serviceSlugs.includes(service.slug)}
                            onChange={() => toggleService(service.slug)}
                            className="size-4 rounded border-border text-accent focus:ring-accent"
                          />
                          {service.name}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : null}

          {tab === "media" ? (
            <>
              <div className={panelClassName}>
                <h2 className="font-display text-base font-semibold text-foreground">
                  Featured image / thumbnail
                </h2>
                <p className="text-sm text-muted">
                  Used on the work index card and as the Open Graph image when no
                  custom SEO image is set.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOgPickerOpen(true)}
                    className="inline-flex h-10 items-center justify-center rounded-default border border-border px-4 text-sm font-medium text-foreground"
                  >
                    {ogImage ? "Change image" : "Choose image"}
                  </button>
                  {ogImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ogImage}
                        alt=""
                        className="size-16 rounded-default border border-border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setOgImage("")}
                        className="text-sm text-danger hover:underline"
                      >
                        Remove
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              <MediaField
                label="Challenge media"
                value={challengeMedia}
                onChange={setChallengeMedia}
                onClear={() => setChallengeMedia("")}
                onPick={() => setMediaTarget("challenge")}
              />
              <MediaField
                label="Approach media"
                value={approachMedia}
                onChange={setApproachMedia}
                onClear={() => setApproachMedia("")}
                onPick={() => setMediaTarget("approach")}
              />
              <MediaField
                label="Delivery media"
                value={solutionMedia}
                onChange={setSolutionMedia}
                onClear={() => setSolutionMedia("")}
                onPick={() => setMediaTarget("solution")}
              />
              <MediaField
                label="Rollout media"
                value={clientNoticedMedia}
                onChange={setClientNoticedMedia}
                onClear={() => setClientNoticedMedia("")}
                onPick={() => setMediaTarget("clientNoticed")}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Gallery ({gallery.length})
                </label>
                <button
                  type="button"
                  onClick={() => setGalleryOpen(true)}
                  className="inline-flex h-10 items-center justify-center rounded-default border border-border px-4 text-sm font-medium text-foreground"
                >
                  Manage gallery
                </button>
              </div>
            </>
          ) : null}

          {tab === "labels" ? (
            <div className={panelClassName}>
              <h2 className="font-display text-base font-semibold text-foreground">
                Section labels
              </h2>
              <p className="text-sm text-muted">
                Leave blank to keep the current template defaults. Changes apply
                only to this case study.
              </p>
              <div className="grid gap-3">
                {LABEL_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label
                      htmlFor={`label-${field.key}`}
                      className="text-sm font-medium text-foreground"
                    >
                      {field.label}
                    </label>
                    <input
                      id={`label-${field.key}`}
                      value={sectionLabels[field.key] ?? ""}
                      onChange={(e) => setLabel(field.key, e.target.value)}
                      placeholder={CASE_STUDY_LABEL_DEFAULTS[field.key]}
                      className={fieldClassName}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "seo" ? (
            <SeoPanel
              title={client}
              slug={slug}
              previewPath={`/work/${slug || "slug"}`}
              metaTitle={metaTitle}
              metaDescription={metaDescription}
              focusKeyword={focusKeyword}
              schemaType={schemaType}
              ogImage={ogImage}
              canonicalUrl={canonicalUrl}
              noIndex={noIndex}
              sitemapInclude={sitemapInclude}
              sitemapPriority={sitemapPriority}
              onMetaTitleChange={setMetaTitle}
              onMetaDescriptionChange={setMetaDescription}
              onFocusKeywordChange={setFocusKeyword}
              onSchemaTypeChange={setSchemaType}
              onOgImageChange={setOgImage}
              onCanonicalUrlChange={setCanonicalUrl}
              onNoIndexChange={setNoIndex}
              onSitemapIncludeChange={setSitemapInclude}
              onSitemapPriorityChange={setSitemapPriority}
            />
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className={panelClassName}>
            <h2 className="font-display text-base font-semibold text-foreground">
              {canPublish ? "Publish" : "Save"}
            </h2>

            {canPublish ? (
              <>
                <div className="space-y-2">
                  <label
                    htmlFor="case-study-status"
                    className="text-sm font-medium text-foreground"
                  >
                    Status
                  </label>
                  <select
                    id="case-study-status"
                    value={status === "trashed" ? "draft" : status}
                    onChange={(e) =>
                      handleStatusChange(e.target.value as CaseStudyStatus)
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
                    onChange={(e) =>
                      handlePublishImmediatelyChange(e.target.checked)
                    }
                    className="size-4 rounded border-border text-accent focus:ring-accent"
                  />
                </label>

                {showSchedulePicker ? (
                  <div className="space-y-2">
                    <label
                      htmlFor="case-study-scheduled-for"
                      className="text-sm font-medium text-foreground"
                    >
                      Schedule for
                    </label>
                    <input
                      id="case-study-scheduled-for"
                      type="datetime-local"
                      value={scheduledForLocal}
                      onChange={(e) => {
                        setScheduledForLocal(e.target.value);
                        setStatus("scheduled");
                        setPublishImmediately(false);
                      }}
                      className={`${fieldClassName} h-11`}
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted">
                Authors can save drafts only. An editor or admin publishes.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loadingAction !== null}
                onClick={() => void handleSave("draft")}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-default border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingAction === "draft" ? "Saving…" : "Save Draft"}
              </button>
              {canPublish ? (
                <button
                  type="button"
                  disabled={loadingAction !== null}
                  onClick={() => void handleSave("publish")}
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
              ) : null}
            </div>

            {recordId ? (
              <button
                type="button"
                disabled={loadingAction !== null}
                onClick={() => {
                  void (async () => {
                    setLoadingAction("preview");
                    const result = await openPreviewFromAction(() =>
                      createPreviewLink({
                        type: "case_study",
                        id: recordId,
                      }),
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

            {recordId ? (
              <button
                type="button"
                disabled={loadingAction !== null}
                onClick={() => void handleTrash()}
                className="text-sm text-danger hover:underline disabled:opacity-60"
              >
                {loadingAction === "trash" ? "Moving…" : "Move to Trash"}
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

          {recordId ? (
            <CaseStudyRevisionsPanel
              caseStudyId={recordId}
              currentClient={client}
              currentSolution={solution}
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
        open={mediaTarget !== null}
        onClose={() => setMediaTarget(null)}
        onSelect={applyMediaSelection}
      />
      <MediaGalleryPicker
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        selected={gallery}
        onChange={setGallery}
      />
    </div>
  );
}
