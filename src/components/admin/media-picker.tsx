"use client";

import { listMedia } from "@/actions/media";
import { AdminMediaImage } from "@/components/admin/admin-media-image";
import { uploadMediaViaApi } from "@/lib/media/upload-client";
import { Check, FileText, Film, Music, Search, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type MediaItem = {
  id: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  filename: string | null;
  folder: string | null;
};

type UploadQueueItem = {
  id: string;
  file: File;
  alt: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
};

export type MediaPickerProps = {
  open: boolean;
  onClose: () => void;
  mode?: "single" | "multi";
  onSelect?: (url: string) => void;
  onSelectMany?: (items: { url: string; alt: string }[]) => void;
  selectedUrls?: string[];
  /** Restrict library + file chooser. Default: all. */
  accept?: "all" | "image" | "image-video";
};

function isImageMime(mime: string | null | undefined, url: string) {
  if (mime?.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|avif|gif|svg)(\?|$)/i.test(url);
}

function defaultAlt(file: File) {
  return file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

function PickerThumb({ item }: { item: MediaItem }) {
  if (isImageMime(item.mimeType, item.url)) {
    return (
      <AdminMediaImage
        src={item.url}
        alt={item.alt}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 50vw, 25vw"
      />
    );
  }

  const Icon = item.mimeType?.startsWith("video/")
    ? Film
    : item.mimeType?.startsWith("audio/")
      ? Music
      : FileText;

  return (
    <div className="flex size-full flex-col items-center justify-center gap-2 bg-background px-3 text-center">
      <Icon className="size-7 text-muted" aria-hidden="true" />
      <p className="line-clamp-2 font-mono text-[0.65rem] text-muted">
        {item.filename || item.mimeType || "File"}
      </p>
    </div>
  );
}

export function MediaPicker({
  open,
  onClose,
  mode = "single",
  onSelect,
  onSelectMany,
  selectedUrls = [],
  accept = "all",
}: MediaPickerProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [draftUrls, setDraftUrls] = useState<string[]>(selectedUrls);
  const [wasOpen, setWasOpen] = useState(open);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSearch("");
      setDraftUrls(selectedUrls);
      setQueue([]);
      setDragOver(false);
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadMedia() {
      setLoading(true);

      try {
        const mediaItems = await listMedia();
        if (!cancelled) {
          setItems(mediaItems);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMedia();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (accept === "image") {
        if (!isImageMime(item.mimeType, item.url)) return false;
      } else if (accept === "image-video") {
        const ok =
          isImageMime(item.mimeType, item.url) ||
          Boolean(item.mimeType?.startsWith("video/")) ||
          item.mimeType === "application/json" ||
          item.mimeType === "text/json" ||
          /\.(mp4|webm|mov|json)(\?|$)/i.test(item.url);
        if (!ok) return false;
      }
      if (!query) return true;
      const filename = (item.filename ?? "").toLowerCase();
      const alt = item.alt.toLowerCase();
      return filename.includes(query) || alt.includes(query);
    });
  }, [items, search, accept]);

  const fileAccept =
    accept === "image"
      ? "image/png,image/jpeg,image/jpg,image/webp,image/avif,image/gif,image/svg+xml,.png,.jpg,.jpeg,.webp,.avif,.gif,.svg"
      : accept === "image-video"
        ? "image/png,image/jpeg,image/jpg,image/webp,image/avif,image/gif,image/svg+xml,video/mp4,video/webm,video/quicktime,application/json,.png,.jpg,.jpeg,.webp,.avif,.gif,.svg,.mp4,.webm,.mov,.json"
        : "image/png,image/jpeg,image/jpg,image/webp,image/avif,image/gif,image/svg+xml,video/mp4,video/webm,application/json,application/pdf,.png,.jpg,.jpeg,.webp,.avif,.gif,.svg,.mp4,.webm,.json,.pdf";

  const busy = queue.some((item) => item.status === "uploading");

  function toggleMulti(url: string) {
    setDraftUrls((current) =>
      current.includes(url)
        ? current.filter((entry) => entry !== url)
        : [...current, url],
    );
  }

  function enqueueFiles(fileList: FileList | File[] | null) {
    if (!fileList) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setQueue((current) => [
      ...current,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        alt: defaultAlt(file),
        status: "pending" as const,
        progress: 0,
      })),
    ]);
  }

  async function uploadQueueItem(item: UploadQueueItem) {
    if (!item.alt.trim() || item.status === "uploading") return;

    setQueue((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? { ...entry, status: "uploading", progress: 0, error: undefined }
          : entry,
      ),
    );

    try {
      const result = await uploadMediaViaApi(item.file, item.alt.trim(), {
        onProgress: (percent) => {
          setQueue((current) =>
            current.map((entry) =>
              entry.id === item.id ? { ...entry, progress: percent } : entry,
            ),
          );
        },
      });

      const newItem: MediaItem = {
        id: result.id,
        url: result.url,
        alt: result.alt,
        width: result.width,
        height: result.height,
        mimeType: result.mimeType,
        filename: result.filename,
        folder: result.folder ?? null,
      };

      setItems((current) => [newItem, ...current]);
      setQueue((current) => current.filter((entry) => entry.id !== item.id));

      if (mode === "multi") {
        setDraftUrls((current) =>
          current.includes(newItem.url) ? current : [...current, newItem.url],
        );
      } else {
        onSelect?.(newItem.url);
        onClose();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Upload failed. Try again.";
      setQueue((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, status: "error", error: message, progress: 0 }
            : entry,
        ),
      );
    }
  }

  async function uploadAllPending() {
    const pending = queue.filter(
      (item) =>
        (item.status === "pending" || item.status === "error") &&
        item.alt.trim(),
    );
    for (const item of pending) {
      await uploadQueueItem(item);
    }
  }

  function confirmMulti() {
    if (!onSelectMany) {
      onClose();
      return;
    }

    const selected = draftUrls
      .map((url) => {
        const match = items.find((item) => item.url === url);
        return match ? { url: match.url, alt: match.alt } : null;
      })
      .filter((entry): entry is { url: string; alt: string } => entry !== null);

    onSelectMany(selected);
    onClose();
  }

  if (!open) {
    return null;
  }

  const isMulti = mode === "multi";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/20 px-4 py-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-picker-title"
        className="flex max-h-[min(90vh,820px)] w-full max-w-4xl flex-col overflow-hidden rounded-default border border-border bg-surface shadow-soft dark:shadow-glow"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2
              id="media-picker-title"
              className="font-display text-xl font-semibold text-foreground"
            >
              {isMulti ? "Select media" : "Media library"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {isMulti
                ? `${draftUrls.length} selected`
                : "Choose a file from your uploaded media."}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-default border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-background"
            >
              {isMulti ? "Cancel" : "Close"}
            </button>
            {isMulti ? (
              <button
                type="button"
                onClick={confirmMulti}
                disabled={busy}
                className="inline-flex h-10 items-center justify-center rounded-default bg-accent px-4 text-sm font-medium text-surface disabled:opacity-60"
              >
                Confirm selection
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 border-b border-border px-5 py-3">
          <label className="relative block">
            <span className="sr-only">Search media</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search filename or alt"
              className="h-10 w-full rounded-default border border-border bg-background py-2 pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            />
          </label>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              enqueueFiles(event.dataTransfer.files);
            }}
            className={`rounded-default border border-dashed px-4 py-3 transition-colors ${
              dragOver ? "border-accent bg-accent/5" : "border-border"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={fileAccept}
              className="sr-only"
              onChange={(event) => {
                enqueueFiles(event.target.files);
                event.target.value = "";
              }}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                Drag files here or browse — PNG, JPEG, WebP, AVIF, GIF, SVG
                {accept === "image-video" || accept === "all"
                  ? ", MP4/WebM, Lottie JSON"
                  : ""}
                , up to 150MB each.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-default border border-border px-3 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                <Upload className="size-4" aria-hidden="true" />
                Upload new
              </button>
            </div>

            {queue.length > 0 ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">
                    Upload queue ({queue.length})
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void uploadAllPending()}
                    className="text-xs font-medium text-accent disabled:opacity-60"
                  >
                    Upload all
                  </button>
                </div>
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-default border border-border bg-background p-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 font-mono text-[0.7rem] text-muted">
                        {item.file.name} ·{" "}
                        {(item.file.size / 1024 / 1024).toFixed(1)} MB
                        {item.status === "uploading"
                          ? ` · ${item.progress}%`
                          : ""}
                      </p>
                      <button
                        type="button"
                        disabled={item.status === "uploading"}
                        onClick={() =>
                          setQueue((current) =>
                            current.filter((entry) => entry.id !== item.id),
                          )
                        }
                        aria-label="Remove from queue"
                        className="inline-flex size-7 shrink-0 items-center justify-center rounded-default border border-border text-muted disabled:opacity-50"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    {item.status === "uploading" ? (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full bg-accent transition-[width]"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <input
                        value={item.alt}
                        disabled={item.status === "uploading"}
                        onChange={(event) =>
                          setQueue((current) =>
                            current.map((entry) =>
                              entry.id === item.id
                                ? { ...entry, alt: event.target.value }
                                : entry,
                            ),
                          )
                        }
                        placeholder="Alt text (required)"
                        className="h-8 min-w-0 flex-1 rounded-default border border-border bg-surface px-2 text-xs text-foreground outline-none placeholder:text-muted disabled:opacity-60"
                      />
                      <button
                        type="button"
                        disabled={!item.alt.trim() || item.status === "uploading"}
                        onClick={() => void uploadQueueItem(item)}
                        className="inline-flex h-8 items-center justify-center rounded-default bg-accent px-3 text-xs font-medium text-surface disabled:opacity-60"
                      >
                        {item.status === "uploading"
                          ? `${item.progress}%`
                          : item.status === "error"
                            ? "Retry"
                            : isMulti
                              ? "Upload & add"
                              : "Upload & select"}
                      </button>
                    </div>
                    {item.error ? (
                      <p className="mt-1 text-xs text-danger" role="alert">
                        {item.error}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-sm text-muted">Loading media…</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-sm text-muted">
              {items.length === 0
                ? "No media yet. Upload files above to get started."
                : "No media matches your search."}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filteredItems.map((item) => {
                const active = isMulti && draftUrls.includes(item.url);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (isMulti) {
                        toggleMulti(item.url);
                        return;
                      }
                      onSelect?.(item.url);
                      onClose();
                    }}
                    className={`overflow-hidden rounded-default border bg-background text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                      active
                        ? "border-accent ring-2 ring-accent/30"
                        : "border-border hover:border-accent"
                    }`}
                  >
                    <div className="relative aspect-[4/3] bg-surface">
                      <PickerThumb item={item} />
                      {isMulti ? (
                        <span
                          className={`absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded-default border ${
                            active
                              ? "border-accent bg-accent text-surface"
                              : "border-border bg-surface text-transparent"
                          }`}
                          aria-hidden="true"
                        >
                          <Check className="size-3.5" />
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-1 px-3 py-3">
                      <p className="line-clamp-2 text-sm font-medium text-foreground">
                        {item.alt}
                      </p>
                      <p className="font-mono text-xs text-muted">
                        {item.width && item.height
                          ? `${item.width}×${item.height}`
                          : item.mimeType || "File"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
