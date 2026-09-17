"use client";

import { deletePopup, savePopup } from "@/actions/popups";
import { MediaPicker } from "@/components/admin/media-picker";
import { useToast } from "@/components/ui/toast";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type PopupEditorData = {
  id?: string;
  name: string;
  status: "active" | "paused";
  type: "exit-intent" | "timed" | "scroll-percentage" | "slide-in";
  delaySeconds: number;
  scrollPercent: number;
  pagesText: string;
  devices: "all" | "desktop" | "mobile";
  frequency: "once-per-session" | "once-per-visitor-30d" | "every-visit";
  priority: number;
  heading: string;
  body: string;
  imageUrl: string;
  ctaLabel: string;
  ctaHref: string;
  formEnabled: boolean;
  formSource: string;
  displayFrom: string;
  displayUntil: string;
};

const fieldClassName =
  "w-full rounded-default border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function isModalType(type: PopupEditorData["type"]) {
  return type === "exit-intent" || type === "timed";
}

function previewHref(id: string | undefined, pagesText: string) {
  if (!id) return null;
  const pages = pagesText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const prefersBlog = pages.some(
    (page) => page === "/blog" || page.startsWith("/blog/"),
  );
  const path = prefersBlog ? "/blog" : "/";
  return `${path}?popupPreview=${id}`;
}

function PreviewPane({ data }: { data: PopupEditorData }) {
  const modal = isModalType(data.type);

  const body = (
    <>
      {data.imageUrl ? (
        <div
          className={`relative mb-3 overflow-hidden rounded-default border border-border ${
            modal ? "aspect-[16/9]" : "aspect-[4/3]"
          }`}
        >
          <Image
            src={data.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes={modal ? "28rem" : "18rem"}
          />
        </div>
      ) : null}
      <p className="font-display text-base font-semibold tracking-tight text-foreground sm:text-xl">
        {data.heading || "Popup heading"}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {data.body || "Popup body copy appears here."}
      </p>
      {data.formEnabled ? (
        <div className="mt-4 space-y-2">
          <div className="h-10 rounded-default border border-border bg-background px-3 text-sm leading-10 text-muted">
            email@example.com
          </div>
          <div className="inline-flex h-10 w-full items-center justify-center rounded-full bg-accent px-4 text-sm font-medium text-surface">
            {data.ctaLabel || "Submit"}
          </div>
        </div>
      ) : data.ctaLabel ? (
        <div className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full bg-accent px-4 text-sm font-medium text-surface">
          {data.ctaLabel}
        </div>
      ) : null}
    </>
  );

  if (modal) {
    return (
      <div className="rounded-default border border-border bg-background p-4">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted">
          Modal preview
        </p>
        <div className="relative rounded-default border border-border bg-surface p-6 shadow-soft dark:shadow-glow">
          {body}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-default border border-border bg-background p-4">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted">
        Slide-in preview
      </p>
      <div className="ml-auto w-full max-w-[18rem] rounded-default border border-border bg-surface p-4 shadow-soft dark:shadow-glow">
        {body}
      </div>
    </div>
  );
}

export function PopupEditor({ initialData }: { initialData: PopupEditorData }) {
  const router = useRouter();
  const { toast } = useToast();
  const [recordId, setRecordId] = useState(initialData.id);
  const [name, setName] = useState(initialData.name);
  const [status, setStatus] = useState<"active" | "paused">(initialData.status);
  const [type, setType] = useState(initialData.type);
  const [delaySeconds, setDelaySeconds] = useState(initialData.delaySeconds);
  const [scrollPercent, setScrollPercent] = useState(initialData.scrollPercent);
  const [pagesText, setPagesText] = useState(initialData.pagesText);
  const [devices, setDevices] = useState(initialData.devices);
  const [frequency, setFrequency] = useState(initialData.frequency);
  const [priority, setPriority] = useState(initialData.priority);
  const [heading, setHeading] = useState(initialData.heading);
  const [body, setBody] = useState(initialData.body);
  const [imageUrl, setImageUrl] = useState(initialData.imageUrl);
  const [ctaLabel, setCtaLabel] = useState(initialData.ctaLabel);
  const [ctaHref, setCtaHref] = useState(initialData.ctaHref);
  const [formEnabled, setFormEnabled] = useState(initialData.formEnabled);
  const [formSource, setFormSource] = useState(initialData.formSource);
  const [displayFrom, setDisplayFrom] = useState(initialData.displayFrom);
  const [displayUntil, setDisplayUntil] = useState(initialData.displayUntil);
  const [loading, setLoading] = useState<"save" | "delete" | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const previewData: PopupEditorData = {
    id: recordId,
    name,
    status,
    type,
    delaySeconds,
    scrollPercent,
    pagesText,
    devices,
    frequency,
    priority,
    heading,
    body,
    imageUrl,
    ctaLabel,
    ctaHref,
    formEnabled,
    formSource,
    displayFrom,
    displayUntil,
  };

  const testLink = previewHref(recordId, pagesText);
  const showDelay =
    type === "timed" || type === "slide-in";
  const showScroll =
    type === "scroll-percentage" || type === "slide-in";

  async function handleSave() {
    setLoading("save");
    const pages = pagesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const result = await savePopup({
      id: recordId,
      name,
      status,
      type,
      delaySeconds: showDelay ? delaySeconds : undefined,
      scrollPercent: showScroll ? scrollPercent : undefined,
      pages,
      devices,
      frequency,
      priority,
      heading,
      body,
      imageUrl,
      ctaLabel,
      ctaHref,
      formEnabled,
      formSource,
      displayFrom: displayFrom || null,
      displayUntil: displayUntil || null,
    });
    setLoading(null);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    setRecordId(result.id);
    toast(status === "active" ? "Popup saved and active" : "Popup saved");

    if (!initialData.id) {
      router.replace(`/admin/popups/${result.id}`);
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!recordId) return;
    setLoading("delete");
    const result = await deletePopup(recordId);
    setLoading(null);
    setShowDelete(false);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    toast("Popup deleted");
    router.push("/admin/popups");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-semibold text-foreground">
          {name.trim() || "New popup"}
        </h1>
        <div className="flex flex-wrap gap-2">
          {testLink ? (
            <a
              href={testLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-default border border-border px-5 text-sm font-medium text-foreground"
            >
              Test on site
            </a>
          ) : null}
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void handleSave()}
            className="inline-flex h-11 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface"
          >
            {loading === "save" ? "Saving…" : "Save"}
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
        <div className="space-y-5 rounded-default border border-border bg-surface p-6 shadow-soft dark:shadow-glow">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-foreground">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClassName}
                placeholder="Blog exit-intent checklist"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "active" | "paused")
                }
                className={fieldClassName}
              >
                <option value="paused">Paused</option>
                <option value="active">Active</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Type</label>
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as PopupEditorData["type"])
                }
                className={fieldClassName}
              >
                <option value="exit-intent">Exit intent</option>
                <option value="timed">Timed</option>
                <option value="scroll-percentage">Scroll percentage</option>
                <option value="slide-in">Slide-in</option>
              </select>
            </div>
            {showDelay ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Delay (seconds)
                </label>
                <input
                  type="number"
                  min={0}
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(Number(e.target.value) || 0)}
                  className={fieldClassName}
                />
              </div>
            ) : null}
            {showScroll ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Scroll percent
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={scrollPercent}
                  onChange={(e) =>
                    setScrollPercent(Number(e.target.value) || 0)
                  }
                  className={fieldClassName}
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Devices
              </label>
              <select
                value={devices}
                onChange={(e) =>
                  setDevices(e.target.value as PopupEditorData["devices"])
                }
                className={fieldClassName}
              >
                <option value="all">All</option>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) =>
                  setFrequency(
                    e.target.value as PopupEditorData["frequency"],
                  )
                }
                className={fieldClassName}
              >
                <option value="once-per-session">Once per session</option>
                <option value="once-per-visitor-30d">
                  Once per visitor (30 days)
                </option>
                <option value="every-visit">Every visit</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Priority
              </label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value) || 0)}
                className={fieldClassName}
              />
              <p className="text-xs text-muted">
                Higher priority wins when multiple popups match.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Audience pages
            </label>
            <textarea
              value={pagesText}
              onChange={(e) => setPagesText(e.target.value)}
              rows={4}
              className={fieldClassName}
              placeholder={"/blog/*\n/work/*"}
            />
            <p className="text-xs text-muted">
              One path pattern per line. Use a trailing * for prefix matches
              (for example /blog/*). Leave empty to match all pages.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Display from
              </label>
              <input
                type="datetime-local"
                value={displayFrom}
                onChange={(e) => setDisplayFrom(e.target.value)}
                className={fieldClassName}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Display until
              </label>
              <input
                type="datetime-local"
                value={displayUntil}
                onChange={(e) => setDisplayUntil(e.target.value)}
                className={fieldClassName}
              />
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Content
            </h2>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Heading
                </label>
                <input
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  className={fieldClassName}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className={fieldClassName}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Image
                </label>
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className={fieldClassName}
                  placeholder="Image URL from media library"
                />
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="inline-flex h-10 items-center justify-center rounded-default border border-border px-4 text-sm font-medium text-foreground"
                >
                  Choose from library
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    CTA label
                  </label>
                  <input
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    className={fieldClassName}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    CTA href
                  </label>
                  <input
                    value={ctaHref}
                    onChange={(e) => setCtaHref(e.target.value)}
                    className={fieldClassName}
                    placeholder="/contact-us"
                    disabled={formEnabled}
                  />
                </div>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={formEnabled}
                  onChange={(e) => setFormEnabled(e.target.checked)}
                  className="size-4 rounded border-border text-accent focus:ring-accent"
                />
                <span className="text-sm text-foreground">
                  Enable email capture form
                </span>
              </label>
              {formEnabled ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Form source
                  </label>
                  <input
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className={fieldClassName}
                    placeholder={`popup:${name || "Name"}`}
                  />
                  <p className="text-xs text-muted">
                    Stored on the lead record. Defaults to popup:Name when empty.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <PreviewPane data={previewData} />
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          setImageUrl(url);
          setPickerOpen(false);
        }}
      />

      {showDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-popup-title"
            className="w-full max-w-md rounded-default border border-border bg-surface p-6 shadow-soft"
          >
            <h2
              id="delete-popup-title"
              className="font-display text-xl font-semibold text-foreground"
            >
              Delete this popup?
            </h2>
            <p className="mt-2 text-sm text-muted">
              This cannot be undone. The popup will stop appearing on the site
              immediately.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                className="inline-flex h-10 items-center justify-center rounded-default border border-border px-4 text-sm font-medium text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading === "delete"}
                onClick={() => void handleDelete()}
                className="inline-flex h-10 items-center justify-center rounded-default bg-danger px-4 text-sm font-medium text-surface"
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
