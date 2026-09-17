"use client";

import { deleteJob, saveJob } from "@/actions/jobs";
import { createPreviewLink } from "@/actions/preview";
import { MediaPicker } from "@/components/admin/media-picker";
import { SeoPanel } from "@/components/admin/seo-panel";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { useToast } from "@/components/ui/toast";
import { openPreviewFromAction } from "@/lib/preview/open-client";
import type { PostSchemaType } from "@/lib/posts/constants";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export type JobEditorData = {
  id?: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  employmentType: "full-time" | "part-time" | "contract" | "remote";
  description: unknown;
  requirements: string;
  salaryRange: string;
  status: "draft" | "published";
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  canonicalUrl: string;
  noIndex: boolean;
};

const fieldClassName =
  "w-full rounded-default border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const EMPLOYMENT_TYPES = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "remote", label: "Remote" },
] as const;

export function JobEditor({ initialData }: { initialData: JobEditorData }) {
  const router = useRouter();
  const { toast } = useToast();
  const editorRef = useRef<{ insertImage: (url: string) => void } | null>(null);

  const [recordId, setRecordId] = useState(initialData.id);
  const [slug, setSlug] = useState(initialData.slug);
  const [title, setTitle] = useState(initialData.title);
  const [department, setDepartment] = useState(initialData.department);
  const [location, setLocation] = useState(initialData.location);
  const [employmentType, setEmploymentType] = useState(
    initialData.employmentType,
  );
  const [description, setDescription] = useState<unknown>(
    initialData.description,
  );
  const [requirements, setRequirements] = useState(initialData.requirements);
  const [salaryRange, setSalaryRange] = useState(initialData.salaryRange);
  const [status, setStatus] = useState<"draft" | "published">(
    initialData.status,
  );
  const [metaTitle, setMetaTitle] = useState(initialData.metaTitle);
  const [metaDescription, setMetaDescription] = useState(
    initialData.metaDescription,
  );
  const [ogImage, setOgImage] = useState(initialData.ogImage);
  const [canonicalUrl, setCanonicalUrl] = useState(initialData.canonicalUrl);
  const [noIndex, setNoIndex] = useState(initialData.noIndex);
  // SeoPanel requires these; jobs do not persist focus keyword / schema.
  const [focusKeyword, setFocusKeyword] = useState("");
  const [schemaType, setSchemaType] = useState<PostSchemaType>("WebPage");
  const [loading, setLoading] = useState<
    "draft" | "publish" | "delete" | "preview" | null
  >(null);
  const [showDelete, setShowDelete] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [ogPickerOpen, setOgPickerOpen] = useState(false);

  function slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!recordId) {
      setSlug(slugify(value));
    }
  }

  function buildPayload(nextStatus: "draft" | "published") {
    return {
      id: recordId,
      slug,
      title,
      department,
      location,
      employmentType,
      description,
      requirements,
      salaryRange,
      status: nextStatus,
      metaTitle,
      metaDescription,
      ogImage,
      canonicalUrl,
      noIndex,
    };
  }

  async function handleSave(nextStatus: "draft" | "published") {
    setLoading(nextStatus === "draft" ? "draft" : "publish");
    const result = await saveJob(buildPayload(nextStatus));
    setLoading(null);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    setRecordId(result.id);
    setStatus(nextStatus);
    toast(nextStatus === "published" ? "Job published" : "Draft saved");

    if (!initialData.id) {
      router.replace(`/admin/jobs/${result.id}`);
    }
    router.refresh();
  }

  async function handlePreview() {
    if (!slug.trim()) {
      toast("Add a slug first", "error");
      return;
    }

    setLoading("preview");
    // Flush current edits so Preview matches the editor (keep published if already live).
    const previewStatus = status === "published" ? "published" : "draft";
    const saveResult = await saveJob(buildPayload(previewStatus));
    if (!saveResult.success) {
      setLoading(null);
      toast(saveResult.error, "error");
      return;
    }

    setRecordId(saveResult.id);
    if (!initialData.id) {
      router.replace(`/admin/jobs/${saveResult.id}`);
    }

    const result = await openPreviewFromAction(() =>
      createPreviewLink({ type: "job", id: saveResult.id }),
    );
    setLoading(null);
    if (!result.success) {
      toast(result.error, "error");
    }
  }

  async function handleDelete() {
    if (!recordId) return;
    setLoading("delete");
    const result = await deleteJob(recordId);
    setLoading(null);
    setShowDelete(false);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    toast("Job deleted");
    router.push("/admin/jobs");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-semibold text-foreground">
          {title.trim() || "New job"}
        </h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void handleSave("draft")}
            className="inline-flex h-11 items-center justify-center rounded-default border border-border px-5 text-sm font-medium text-foreground"
          >
            {loading === "draft" ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void handlePreview()}
            className="inline-flex h-11 items-center justify-center rounded-default border border-border px-5 text-sm font-medium text-foreground"
          >
            {loading === "preview" ? "Opening…" : "Preview"}
          </button>
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void handleSave("published")}
            className="inline-flex h-11 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface"
          >
            {loading === "publish"
              ? "Saving…"
              : status === "published"
                ? "Update"
                : "Publish"}
          </button>
          {recordId ? (
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="inline-flex h-11 items-center justify-center rounded-default border border-danger/30 px-5 text-sm font-medium text-danger"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-5 rounded-default border border-border bg-surface p-6 shadow-soft dark:shadow-glow">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Job title
          </label>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Senior Frontend Developer"
            className={fieldClassName}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. senior-frontend-developer"
            className={fieldClassName}
          />
          <p className="text-xs text-muted">
            Public URL:{" "}
            <span className="font-mono">
              /careers/{slug || "your-slug"}
            </span>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Department
            </label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Engineering"
              className={fieldClassName}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Location
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Remote / New York, NY"
              className={fieldClassName}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Employment type
            </label>
            <select
              value={employmentType}
              onChange={(e) =>
                setEmploymentType(
                  e.target.value as typeof employmentType,
                )
              }
              className={`${fieldClassName} h-11`}
            >
              {EMPLOYMENT_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Salary range
            </label>
            <input
              value={salaryRange}
              onChange={(e) => setSalaryRange(e.target.value)}
              placeholder="e.g. $80k – $120k / year"
              className={fieldClassName}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Requirements
          </label>
          <p className="text-xs text-muted">
            Shown as the card excerpt on the careers listing. Plain text.
          </p>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={4}
            placeholder="Key skills and experience required…"
            className={fieldClassName}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Job description
        </label>
        <p className="text-xs text-muted">
          Full job description shown on the detail page.
        </p>
        <TiptapEditor
          ref={editorRef}
          content={description}
          onChange={setDescription}
          onPickImage={() => setPickerOpen(true)}
        />
      </div>

      <SeoPanel
        title={title}
        slug={slug}
        previewPath={`kavcomexpert.com/careers/${slug || "slug"}`}
        metaTitle={metaTitle}
        metaDescription={metaDescription}
        focusKeyword={focusKeyword}
        schemaType={schemaType}
        ogImage={ogImage}
        canonicalUrl={canonicalUrl}
        noIndex={noIndex}
        schemaOptions={["WebPage"]}
        auditType="page"
        onMetaTitleChange={setMetaTitle}
        onMetaDescriptionChange={setMetaDescription}
        onFocusKeywordChange={setFocusKeyword}
        onSchemaTypeChange={setSchemaType}
        onOgImageChange={setOgImage}
        onChooseOgImage={() => setOgPickerOpen(true)}
        onCanonicalUrlChange={setCanonicalUrl}
        onNoIndexChange={setNoIndex}
      />

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          editorRef.current?.insertImage(url);
          setPickerOpen(false);
        }}
      />

      <MediaPicker
        open={ogPickerOpen}
        onClose={() => setOgPickerOpen(false)}
        onSelect={(url) => {
          setOgImage(url);
          setOgPickerOpen(false);
        }}
      />

      {showDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 px-4">
          <div className="w-full max-w-md rounded-default border border-border bg-surface p-6">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Delete job?
            </h2>
            <p className="mt-2 text-sm text-muted">
              This will permanently delete the job posting and all associated
              applications.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                className="h-10 rounded-default border border-border px-4 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading === "delete"}
                onClick={() => void handleDelete()}
                className="h-10 rounded-default bg-danger px-4 text-sm text-surface"
              >
                {loading === "delete" ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
