"use client";

import { deleteTestimonial, saveTestimonial } from "@/actions/testimonials";
import { MediaPicker } from "@/components/admin/media-picker";
import { StarRatingPicker } from "@/components/admin/star-rating-picker";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type TestimonialEditorData = {
  id?: string;
  clientName: string;
  company: string;
  role: string;
  quote: string;
  rating: number;
  headshot: string;
  videoUrl: string;
  featured: boolean;
  status: "draft" | "published";
};

const fieldClassName =
  "w-full rounded-default border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function TestimonialEditor({ initialData }: { initialData: TestimonialEditorData }) {
  const router = useRouter();
  const { toast } = useToast();
  const [recordId, setRecordId] = useState(initialData.id);
  const [clientName, setClientName] = useState(initialData.clientName);
  const [company, setCompany] = useState(initialData.company);
  const [role, setRole] = useState(initialData.role);
  const [quote, setQuote] = useState(initialData.quote);
  const [rating, setRating] = useState(initialData.rating);
  const [headshot, setHeadshot] = useState(initialData.headshot);
  const [videoUrl, setVideoUrl] = useState(initialData.videoUrl);
  const [featured, setFeatured] = useState(initialData.featured);
  const [status, setStatus] = useState<"draft" | "published">(initialData.status);
  const [loading, setLoading] = useState<"draft" | "publish" | "delete" | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function handleSave(nextStatus: "draft" | "published") {
    setLoading(nextStatus === "draft" ? "draft" : "publish");
    const result = await saveTestimonial({
      id: recordId,
      clientName,
      company,
      role,
      quote,
      rating,
      headshot,
      videoUrl,
      featured,
      status: nextStatus,
    });
    setLoading(null);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    setRecordId(result.id);
    setStatus(nextStatus);
    toast(nextStatus === "published" ? "Testimonial published" : "Draft saved");

    if (!initialData.id) {
      router.replace(`/admin/testimonials/${result.id}`);
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!recordId) return;
    setLoading("delete");
    const result = await deleteTestimonial(recordId);
    setLoading(null);
    setShowDelete(false);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    toast("Testimonial deleted");
    router.push("/admin/testimonials");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-semibold text-foreground">
          {clientName.trim() || "New testimonial"}
        </h1>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={loading !== null} onClick={() => void handleSave("draft")} className="inline-flex h-11 items-center justify-center rounded-default border border-border px-5 text-sm font-medium text-foreground">
            {loading === "draft" ? "Saving…" : "Save draft"}
          </button>
          <button type="button" disabled={loading !== null} onClick={() => void handleSave("published")} className="inline-flex h-11 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface">
            {loading === "publish" ? "Saving…" : status === "published" ? "Update" : "Publish"}
          </button>
          {recordId ? (
            <button type="button" onClick={() => setShowDelete(true)} className="inline-flex h-11 items-center justify-center rounded-default border border-danger/30 px-5 text-sm font-medium text-danger">
              Delete
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-5 rounded-default border border-border bg-surface p-6 shadow-soft dark:shadow-glow">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Client name</label>
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} className={fieldClassName} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Company</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} className={fieldClassName} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Role</label>
          <input value={role} onChange={(e) => setRole(e.target.value)} className={fieldClassName} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Quote{" "}
            <span className="font-normal text-muted">(optional — text review cards)</span>
          </label>
          <p className="text-xs text-muted">
            Fill this to show a written review card. Leave empty for a video-only
            testimonial.
          </p>
          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            rows={5}
            className={fieldClassName}
            placeholder="What the client said…"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Rating</label>
          <StarRatingPicker value={rating} onChange={setRating} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Client photo</label>
          <p className="text-xs text-muted">
            Shown as a circle on the About Us review slider. If empty, initials are used.
          </p>
          <input value={headshot} onChange={(e) => setHeadshot(e.target.value)} className={fieldClassName} placeholder="Image URL from media library" />
          <button type="button" onClick={() => setPickerOpen(true)} className="inline-flex h-10 items-center justify-center rounded-default border border-border px-4 text-sm font-medium text-foreground">
            Choose from library
          </button>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Video URL{" "}
            <span className="font-normal text-muted">(optional — video section)</span>
          </label>
          <p className="text-xs text-muted">
            YouTube or hosted video link. With only a video URL (no quote), the
            entry appears only in the video testimonials section.
          </p>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className={fieldClassName}
            placeholder="https://..."
          />
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-default border border-border bg-background px-4 py-3">
          <input
            type="checkbox"
            checked={featured}
            onChange={(event) => setFeatured(event.target.checked)}
            className="size-4 rounded border-border text-accent focus:ring-accent"
          />
          <span>
            <span className="block text-sm font-medium text-foreground">Featured</span>
            <span className="block text-xs text-muted">
              Highlight this review where featured testimonials are used.
            </span>
          </span>
        </label>
      </div>

      {pickerOpen ? (
        <MediaPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(url) => {
            setHeadshot(url);
            setPickerOpen(false);
          }}
        />
      ) : null}

      {showDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4">
          <div className="w-full max-w-md rounded-default border border-border bg-surface p-6">
            <p className="font-display text-lg font-semibold text-foreground">Delete testimonial?</p>
            <p className="mt-2 text-sm text-muted">This cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowDelete(false)} className="h-10 rounded-default border border-border px-4 text-sm">
                Cancel
              </button>
              <button type="button" onClick={() => void handleDelete()} className="h-10 rounded-default bg-danger px-4 text-sm text-surface">
                {loading === "delete" ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
