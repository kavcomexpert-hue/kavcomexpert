"use client";

import {
  autosavePost,
  checkSlugAvailable,
  createCategoryInline,
  savePost,
  trashPost,
} from "@/actions/posts";
import { createPreviewLink } from "@/actions/preview";
import { openPreviewFromAction } from "@/lib/preview/open-client";
import { MediaPicker } from "@/components/admin/media-picker";
import { AdminMediaImage } from "@/components/admin/admin-media-image";
import { PostRevisionsPanel } from "@/components/admin/post-revisions-panel";
import { SeoPanel } from "@/components/admin/seo-panel";
import {
  TiptapEditor,
  type TiptapEditorHandle,
} from "@/components/admin/tiptap-editor";
import { toPlainTiptapJson } from "@/lib/tiptap/serialize";
import { useToast } from "@/components/ui/toast";
import type { PostFaq } from "@/lib/posts/aeo";
import { type PostSchemaType } from "@/lib/posts/constants";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatSavedAt,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  toSlug,
} from "@/lib/admin/editor-format";
import { useEditorAutosave } from "@/hooks/use-editor-autosave";

export type PostEditorInitialData = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  categories?: string[];
  tags: string[];
  coverImage: string;
  content: unknown;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords?: string;
  schemaType: PostSchemaType;
  schemaJson?: string;
  ogImage: string;
  canonicalUrl: string;
  noIndex: boolean;
  socialTitle: string;
  socialDescription: string;
  noFollow: boolean;
  noArchive: boolean;
  sitemapInclude?: boolean;
  sitemapPriority?: string;
  status: "draft" | "published" | "scheduled" | "trashed";
  scheduledFor?: string;
  tldr: string;
  keyTakeaways: string[];
  postFaqs: PostFaq[];
};

type TaxonomyOption = {
  id: string;
  name: string;
  slug: string;
};

type PostEditorProps = {
  initialData: PostEditorInitialData;
  categories: TaxonomyOption[];
  tags: TaxonomyOption[];
  revisions?: unknown;
  /** Authors cannot publish; UI hides publish controls. */
  canPublish?: boolean;
};

type PostStatus = "draft" | "published" | "scheduled" | "trashed";

export function PostEditor({
  initialData,
  categories: initialCategories,
  tags: tagOptions,
  canPublish = false,
}: PostEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const slugManuallyEdited = useRef(Boolean(initialData.slug));
  const tiptapRef = useRef<TiptapEditorHandle>(null);
  const savingRef = useRef(false);
  const formRef = useRef<Record<string, unknown>>({});

  const [postId, setPostId] = useState(initialData.id);
  const [title, setTitle] = useState(initialData.title);
  const [slug, setSlug] = useState(initialData.slug);
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [excerpt, setExcerpt] = useState(initialData.excerpt);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (initialData.categories?.length) return initialData.categories;
    return initialData.category ? [initialData.category] : [];
  });
  const [categoryList, setCategoryList] = useState(initialCategories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData.tags);
  const [tagDraft, setTagDraft] = useState("");
  const [coverImage, setCoverImage] = useState(initialData.coverImage);
  const [content, setContent] = useState(initialData.content);
  const [metaTitle, setMetaTitle] = useState(initialData.metaTitle);
  const [metaDescription, setMetaDescription] = useState(
    initialData.metaDescription,
  );
  const [focusKeyword, setFocusKeyword] = useState(initialData.focusKeyword);
  const [secondaryKeywords, setSecondaryKeywords] = useState(
    initialData.secondaryKeywords ?? "",
  );
  const [schemaType, setSchemaType] = useState<PostSchemaType>(
    initialData.schemaType,
  );
  const [schemaJson, setSchemaJson] = useState(initialData.schemaJson ?? "");
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
    initialData.sitemapInclude ?? true,
  );
  const [sitemapPriority, setSitemapPriority] = useState(
    initialData.sitemapPriority ?? "0.7",
  );
  const [status, setStatus] = useState<PostStatus>(
    initialData.status === "trashed" ? "draft" : initialData.status,
  );
  const [scheduledForLocal, setScheduledForLocal] = useState(
    toDatetimeLocalValue(initialData.scheduledFor),
  );
  const [publishImmediately, setPublishImmediately] = useState(
    initialData.status !== "scheduled",
  );
  const [tldr, setTldr] = useState(initialData.tldr);
  const [keyTakeaways, setKeyTakeaways] = useState(() => {
    const rows = initialData.keyTakeaways.filter(Boolean);
    if (rows.length >= 3) return initialData.keyTakeaways;
    return [...initialData.keyTakeaways, ...Array(Math.max(0, 3 - initialData.keyTakeaways.length)).fill("")].slice(0, 5);
  });
  const [postFaqs, setPostFaqs] = useState(initialData.postFaqs);
  const [loadingAction, setLoadingAction] = useState<
    "draft" | "publish" | "trash" | "preview" | null
  >(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<
    "cover" | "og" | "content"
  >("cover");

  const wasPublished =
    initialData.status === "published" || status === "published";

  const buildPayload = useCallback(
    (nextStatus: PostStatus) => {
      const scheduledIso =
        nextStatus === "scheduled"
          ? fromDatetimeLocalValue(scheduledForLocal) || null
          : null;

      return {
        id: postId,
        title,
        slug,
        excerpt,
        category: selectedCategories[0] || undefined,
        categories: selectedCategories,
        tags: selectedTags,
        coverImage,
        content: toPlainTiptapJson(content),
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
        tldr,
        keyTakeaways,
        postFaqs,
        status: nextStatus,
        scheduledFor: scheduledIso,
      };
    },
    [
      postId,
      title,
      slug,
      excerpt,
      selectedCategories,
      selectedTags,
      coverImage,
      content,
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
      tldr,
      keyTakeaways,
      postFaqs,
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
        const result = await checkSlugAvailable(slug, postId);
        setSlugStatus(result.available ? "available" : "taken");
      })();
    }, 400);

    return () => window.clearTimeout(handle);
  }, [slug, postId]);

  const effectiveSlugStatus = !slug.trim() ? "idle" : slugStatus;

  const { markSaved } = useEditorAutosave({
    enabled: Boolean(postId),
    isBusy: () => savingRef.current,
    getPayload: () => {
      const payload = formRef.current as ReturnType<typeof buildPayload>;
      if (!payload.title?.toString().trim() || !payload.slug?.toString().trim()) {
        return null;
      }
      return {
        ...payload,
        id: postId,
        status: (payload.status as PostStatus) || status,
      };
    },
    save: async (payload) =>
      autosavePost(payload as Parameters<typeof autosavePost>[0]),
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

  function handleStatusChange(next: PostStatus) {
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

  function openMediaPicker(target: "cover" | "og" | "content") {
    setMediaPickerTarget(target);
    setMediaPickerOpen(true);
  }

  function handleMediaSelect(url: string) {
    if (mediaPickerTarget === "cover") {
      setCoverImage(url);
      return;
    }
    if (mediaPickerTarget === "og") {
      setOgImage(url);
      return;
    }
    tiptapRef.current?.insertImage(url);
  }

  function addTag(value: string) {
    const next = value.trim();
    if (!next) return;
    setSelectedTags((current) =>
      current.includes(next) ? current : [...current, next],
    );
    setTagDraft("");
  }

  async function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setAddingCategory(true);
    const result = await createCategoryInline(name);
    setAddingCategory(false);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    const nextSlug = toSlug(result.name);
    setCategoryList((current) => {
      if (current.some((item) => item.slug === nextSlug)) {
        return current;
      }
      return [
        ...current,
        {
          id: `local-${nextSlug}`,
          name: result.name,
          slug: nextSlug,
        },
      ];
    });
    setSelectedCategories((current) =>
      current.includes(nextSlug) ? current : [...current, nextSlug],
    );
    setNewCategoryName("");
    setShowAddCategory(false);
    toast("Category added");
  }

  async function handleSave(intent: "draft" | "publish") {
    let nextStatus: PostStatus = "draft";

    if (intent === "draft" || !canPublish) {
      nextStatus = "draft";
    } else if (!publishImmediately || status === "scheduled") {
      nextStatus = "scheduled";
    } else {
      nextStatus = "published";
    }

    setLoadingAction(intent === "draft" || !canPublish ? "draft" : "publish");
    setStatus(nextStatus);

    const result = await savePost(buildPayload(nextStatus));
    setLoadingAction(null);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    setPostId(result.id);
    setLastSavedAt(new Date());
    markSaved({
      ...buildPayload(nextStatus),
      id: result.id,
      status: nextStatus,
    });
    toast(
      nextStatus === "published"
        ? wasPublished
          ? "Post updated"
          : "Post published"
        : nextStatus === "scheduled"
          ? "Post scheduled"
          : "Draft saved",
    );

    if (!initialData.id) {
      router.push(`/admin/posts/${result.id}`);
    }

    router.refresh();
  }

  async function handleTrash() {
    if (!postId) return;
    setLoadingAction("trash");
    const result = await trashPost(postId);
    setLoadingAction(null);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    toast("Moved to trash");
    router.push("/admin/posts");
    router.refresh();
  }

  const showSchedulePicker = !publishImmediately || status === "scheduled";
  const fieldClassName =
    "w-full rounded-default border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const panelClassName =
    "space-y-3 rounded-default border border-border bg-surface p-4 shadow-soft";

  const tagSuggestions = tagOptions.filter(
    (item) =>
      tagDraft.trim() &&
      item.name.toLowerCase().includes(tagDraft.trim().toLowerCase()) &&
      !selectedTags.includes(item.name),
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-wider text-muted">
          {postId ? "Edit post" : "New post"}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">
          {title.trim() || "Untitled post"}
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
              Permalink
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted">/blog/</span>
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
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Content</label>
            <TiptapEditor
              ref={tiptapRef}
              content={content}
              onChange={setContent}
              onPickImage={() => openMediaPicker("content")}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="excerpt" className="text-sm font-medium text-foreground">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              rows={3}
              className={fieldClassName}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tldr" className="text-sm font-medium text-foreground">
              TL;DR
            </label>
            <p className="text-sm text-muted">2 to 3 sentence direct answer</p>
            <textarea
              id="tldr"
              value={tldr}
              onChange={(event) => setTldr(event.target.value)}
              rows={4}
              className={fieldClassName}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-foreground">
                Key takeaways
              </label>
              <button
                type="button"
                disabled={keyTakeaways.length >= 5}
                onClick={() =>
                  setKeyTakeaways((rows) =>
                    rows.length >= 5 ? rows : [...rows, ""],
                  )
                }
                className="text-sm font-medium text-accent disabled:opacity-50"
              >
                Add takeaway
              </button>
            </div>
            <p className="text-sm text-muted">Add 3 to 5 concise bullets.</p>
            {keyTakeaways.map((item, index) => (
              <div key={`takeaway-${index}`} className="flex gap-2">
                <input
                  value={item}
                  onChange={(event) =>
                    setKeyTakeaways((rows) =>
                      rows.map((row, rowIndex) =>
                        rowIndex === index ? event.target.value : row,
                      ),
                    )
                  }
                  placeholder={`Takeaway ${index + 1}`}
                  className={fieldClassName}
                />
                <button
                  type="button"
                  disabled={keyTakeaways.length <= 3}
                  onClick={() =>
                    setKeyTakeaways((rows) =>
                      rows.filter((_, rowIndex) => rowIndex !== index),
                    )
                  }
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-default border border-border px-3 text-sm text-muted disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-foreground">FAQs</label>
              <button
                type="button"
                onClick={() =>
                  setPostFaqs((rows) => [...rows, { q: "", a: "" }])
                }
                className="text-sm font-medium text-accent"
              >
                Add FAQ
              </button>
            </div>
            {postFaqs.map((faq, index) => (
              <div
                key={`faq-${index}`}
                className="space-y-2 rounded-default border border-border bg-surface p-4"
              >
                <input
                  placeholder="Question"
                  value={faq.q}
                  onChange={(event) =>
                    setPostFaqs((rows) =>
                      rows.map((item, rowIndex) =>
                        rowIndex === index
                          ? { ...item, q: event.target.value }
                          : item,
                      ),
                    )
                  }
                  className={fieldClassName}
                />
                <textarea
                  placeholder="Answer"
                  value={faq.a}
                  onChange={(event) =>
                    setPostFaqs((rows) =>
                      rows.map((item, rowIndex) =>
                        rowIndex === index
                          ? { ...item, a: event.target.value }
                          : item,
                      ),
                    )
                  }
                  rows={3}
                  className={fieldClassName}
                />
                <button
                  type="button"
                  onClick={() =>
                    setPostFaqs((rows) =>
                      rows.filter((_, rowIndex) => rowIndex !== index),
                    )
                  }
                  className="text-sm text-muted"
                >
                  Remove FAQ
                </button>
              </div>
            ))}
          </div>
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
                htmlFor="post-status"
                className="text-sm font-medium text-foreground"
              >
                Status
              </label>
              <select
                id="post-status"
                value={status === "trashed" ? "draft" : status}
                onChange={(event) =>
                  handleStatusChange(event.target.value as PostStatus)
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
                onClick={() => handleSave("draft")}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-default border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingAction === "draft" ? "Saving…" : "Save Draft"}
              </button>
              {canPublish ? (
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
              ) : null}
            </div>

            {postId ? (
              <button
                type="button"
                disabled={loadingAction !== null}
                onClick={() => {
                  void (async () => {
                    setLoadingAction("preview");
                    const result = await openPreviewFromAction(() =>
                      createPreviewLink({ type: "post", id: postId }),
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

            {postId ? (
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
                : postId
                  ? "Autosave every 30s"
                  : "Save once to enable autosave"}
            </p>
          </div>

          <div className={panelClassName}>
            <h2 className="font-display text-base font-semibold text-foreground">
              Categories
            </h2>
            <ul className="max-h-48 space-y-2 overflow-auto">
              {categoryList.map((item) => {
                const checked =
                  selectedCategories.includes(item.slug) ||
                  selectedCategories.includes(item.name);
                return (
                  <li key={item.id}>
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          setSelectedCategories((current) => {
                            if (event.target.checked) {
                              if (current.includes(item.slug)) return current;
                              return [...current, item.slug];
                            }
                            return current.filter(
                              (entry) =>
                                entry !== item.slug && entry !== item.name,
                            );
                          });
                        }}
                        className="size-4 rounded border-border text-accent focus:ring-accent"
                      />
                      {item.name}
                    </label>
                  </li>
                );
              })}
            </ul>
            {showAddCategory ? (
              <div className="flex gap-2">
                <input
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleAddCategory();
                    }
                  }}
                  placeholder="New category"
                  className={`${fieldClassName} h-10`}
                />
                <button
                  type="button"
                  disabled={addingCategory}
                  onClick={() => void handleAddCategory()}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-default bg-accent px-3 text-sm font-medium text-surface disabled:opacity-60"
                >
                  {addingCategory ? "…" : "Add"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddCategory(true)}
                className="text-sm font-medium text-accent"
              >
                Add new
              </button>
            )}
          </div>

          <div className={panelClassName}>
            <h2 className="font-display text-base font-semibold text-foreground">
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setSelectedTags((current) =>
                      current.filter((item) => item !== tag),
                    )
                  }
                  className="inline-flex h-8 items-center gap-2 rounded-default border border-border bg-background px-3 text-xs text-foreground hover:border-danger hover:text-danger"
                >
                  {tag}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                value={tagDraft}
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  addTag(tagDraft);
                }}
                placeholder="Add tag and press Enter"
                className={`${fieldClassName} h-10`}
              />
              {tagSuggestions.length > 0 ? (
                <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-default border border-border bg-surface shadow-soft">
                  {tagSuggestions.slice(0, 8).map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => addTag(item.name)}
                        className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-background"
                      >
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          <div className={panelClassName}>
            <h2 className="font-display text-base font-semibold text-foreground">
              Featured image
            </h2>
            {coverImage ? (
              <div className="relative aspect-video overflow-hidden rounded-default border border-border">
                <AdminMediaImage
                  src={coverImage}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 320px"
                />
              </div>
            ) : (
              <p className="text-sm text-muted">No image selected</p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openMediaPicker("cover")}
                className="inline-flex h-10 items-center justify-center rounded-default border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-surface"
              >
                {coverImage ? "Replace" : "Set featured image"}
              </button>
              {coverImage ? (
                <button
                  type="button"
                  onClick={() => setCoverImage("")}
                  className="inline-flex h-10 items-center justify-center rounded-default border border-border px-4 text-sm text-muted"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>

          {postId ? (
            <PostRevisionsPanel
              postId={postId}
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
            socialTitle={socialTitle}
            socialDescription={socialDescription}
            noFollow={noFollow}
            noArchive={noArchive}
            sitemapInclude={sitemapInclude}
            sitemapPriority={sitemapPriority}
            liveAudit={{
              content,
              coverImage,
              tldr,
              keyTakeaways,
              postFaqs,
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
            onSocialTitleChange={setSocialTitle}
            onSocialDescriptionChange={setSocialDescription}
            onNoFollowChange={setNoFollow}
            onNoArchiveChange={setNoArchive}
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
    </div>
  );
}
