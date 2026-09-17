"use client";

import {
  deleteMedia,
  findMediaUsages,
  updateMediaAlt,
  type MediaUsage,
} from "@/actions/media";
import { AdminMediaImage } from "@/components/admin/admin-media-image";
import { useToast } from "@/components/ui/toast";
import { uploadMediaViaApi } from "@/lib/media/upload-client";
import {
  Check,
  Copy,
  FileText,
  Film,
  Music,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type MediaItem = {
  id: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  mimeType?: string | null;
  filename?: string | null;
  sizeBytes?: number | null;
  folder?: string | null;
  createdAt: Date | null;
};

type QueueItem = {
  id: string;
  file: File;
  alt: string;
  previewUrl: string | null;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
};

type MediaLibraryProps = {
  initialItems: MediaItem[];
};

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml,image/heic,image/heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/json,text/plain,text/csv,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/ogg,audio/webm,.json";

function isImageMime(mime: string | null | undefined, url: string) {
  if (mime?.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|avif|gif|svg)(\?|$)/i.test(url);
}

function MediaThumb({ item }: { item: MediaItem }) {
  if (isImageMime(item.mimeType, item.url)) {
    return (
      <AdminMediaImage
        src={item.url}
        alt={item.alt}
        fill
        className="object-cover transition-opacity group-hover:opacity-90"
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
      <Icon className="size-8 text-muted" aria-hidden="true" />
      <p className="line-clamp-2 font-mono text-[0.65rem] text-muted">
        {item.filename || item.mimeType || "File"}
      </p>
    </div>
  );
}

export function MediaLibrary({ initialItems }: MediaLibraryProps) {
  const { toast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [search, setSearch] = useState("");
  const [folderFilter, setFolderFilter] = useState("all");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [editAlt, setEditAlt] = useState("");
  const [savingAlt, setSavingAlt] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [usages, setUsages] = useState<MediaUsage[] | null>(null);
  const [usagesLoading, setUsagesLoading] = useState(false);
  const [usagesError, setUsagesError] = useState<string | null>(null);

  const folders = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      set.add(item.folder?.trim() || "uploads");
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const folder = item.folder?.trim() || "uploads";
      if (folderFilter !== "all" && folder !== folderFilter) {
        return false;
      }
      if (!query) return true;
      const filename = (item.filename ?? "").toLowerCase();
      const alt = item.alt.toLowerCase();
      return filename.includes(query) || alt.includes(query);
    });
  }, [items, search, folderFilter]);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setQueue((current) => [
      ...current,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim(),
        previewUrl: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
        status: "pending" as const,
        progress: 0,
      })),
    ]);
  }, []);

  const removeQueueItem = useCallback((id: string) => {
    setQueue((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  }, []);

  const updateQueueAlt = useCallback((id: string, alt: string) => {
    setQueue((current) =>
      current.map((item) => (item.id === id ? { ...item, alt } : item)),
    );
  }, []);

  async function uploadQueueItem(item: QueueItem) {
    if (!item.alt.trim()) {
      toast("Alt text is required before uploading", "error");
      return;
    }

    setQueue((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              status: "uploading",
              progress: 0,
              error: undefined,
            }
          : entry,
      ),
    );

    try {
      const result = await uploadMediaViaApi(item.file, item.alt.trim(), {
        folder: "uploads",
        onProgress: (percent) => {
          setQueue((current) =>
            current.map((entry) =>
              entry.id === item.id
                ? { ...entry, progress: percent }
                : entry,
            ),
          );
        },
      });

      setItems((current) => [
        {
          id: result.id,
          url: result.url,
          alt: result.alt,
          width: result.width,
          height: result.height,
          mimeType: result.mimeType,
          filename: result.filename,
          sizeBytes: result.sizeBytes ?? null,
          folder: result.folder ?? "uploads",
          createdAt: new Date(),
        },
        ...current,
      ]);

      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }

      setQueue((current) => current.filter((entry) => entry.id !== item.id));
      toast("File uploaded");
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
      toast(message, "error");
    }
  }

  async function uploadAllReady() {
    const ready = queue.filter(
      (item) => item.status === "pending" && item.alt.trim(),
    );
    if (ready.length === 0) {
      toast("Add alt text for each file before uploading", "error");
      return;
    }

    for (const item of ready) {
      await uploadQueueItem(item);
    }
  }

  function openDetails(item: MediaItem) {
    setSelected(item);
    setEditAlt(item.alt);
    setUsages(null);
    setUsagesError(null);
  }

  function closeDetails() {
    setSelected(null);
    setEditAlt("");
    setUsages(null);
    setUsagesError(null);
  }

  const selectedUrl = selected?.url ?? null;

  useEffect(() => {
    if (!selectedUrl) return;

    let cancelled = false;
    setUsagesLoading(true);
    setUsagesError(null);

    void (async () => {
      const result = await findMediaUsages(selectedUrl);
      if (cancelled) return;
      setUsagesLoading(false);
      if (!result.success) {
        setUsagesError(result.error);
        setUsages([]);
        return;
      }
      setUsages(result.usages);
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedUrl]);

  async function handleSaveAlt() {
    if (!selected) return;

    const nextAlt = editAlt.trim();
    if (!nextAlt) {
      toast("Alt text is required", "error");
      return;
    }

    setSavingAlt(true);
    const result = await updateMediaAlt(selected.id, nextAlt);
    setSavingAlt(false);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === selected.id ? { ...item, alt: result.alt } : item,
      ),
    );
    setSelected((current) =>
      current ? { ...current, alt: result.alt } : current,
    );
    toast("Alt text saved");
  }

  async function handleCopyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    toast("URL copied to clipboard");
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    setDeleting(true);
    const result = await deleteMedia(deleteTarget.id);
    setDeleting(false);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    setItems((current) =>
      current.filter((item) => item.id !== deleteTarget.id),
    );
    if (selected?.id === deleteTarget.id) {
      closeDetails();
    }
    setDeleteTarget(null);
    toast("Media deleted");
  }

  return (
    <div className="space-y-8">
      <section className="rounded-default border border-border bg-surface p-5 shadow-soft dark:shadow-glow">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            if (event.dataTransfer.files?.length) {
              addFiles(event.dataTransfer.files);
            }
          }}
          className={`rounded-default border border-dashed px-6 py-10 text-center transition-colors ${
            dragActive
              ? "border-accent bg-accent/10"
              : "border-border bg-background"
          }`}
        >
          <Upload className="mx-auto size-8 text-muted" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-foreground">
            Drag and drop files to upload
          </p>
          <p className="mt-1 text-sm text-muted">
            Images, PDF/docs, Lottie JSON, audio, or video — up to 150MB each. Alt text
            required per file. Select multiple files at once.
          </p>
          <label className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-default border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background">
            Browse files
            <input
              type="file"
              accept={ACCEPT}
              multiple
              className="sr-only"
              onChange={(event) => {
                if (event.target.files?.length) {
                  addFiles(event.target.files);
                }
                event.target.value = "";
              }}
            />
          </label>
        </div>

        {queue.length > 0 ? (
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                Upload queue ({queue.length})
              </p>
              <button
                type="button"
                onClick={uploadAllReady}
                className="inline-flex h-9 items-center justify-center rounded-default bg-accent px-3 text-sm font-medium text-surface"
              >
                Upload all with alt
              </button>
            </div>

            <ul className="space-y-3">
              {queue.map((item) => (
                <li
                  key={item.id}
                  className="rounded-default border border-border bg-background p-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-default border border-border bg-surface">
                      {item.previewUrl ? (
                        <Image
                          src={item.previewUrl}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <FileText className="size-6 text-muted" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {item.file.name}
                          </p>
                          <p className="text-xs text-muted">
                            {(item.file.size / 1024 / 1024).toFixed(2)} MB
                            {item.status === "uploading"
                              ? ` · Uploading ${item.progress}%`
                              : ""}
                            {item.status === "error" && item.error
                              ? ` · ${item.error}`
                              : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQueueItem(item.id)}
                          disabled={item.status === "uploading"}
                          className="inline-flex size-8 items-center justify-center rounded-default border border-border text-muted disabled:opacity-50"
                          aria-label={`Remove ${item.file.name}`}
                        >
                          <X className="size-4" />
                        </button>
                      </div>

                      {item.status === "uploading" ? (
                        <div
                          className="h-1.5 overflow-hidden rounded-full bg-border"
                          role="progressbar"
                          aria-valuenow={item.progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="h-full bg-accent transition-[width] duration-150"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      ) : null}

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          value={item.alt}
                          onChange={(event) =>
                            updateQueueAlt(item.id, event.target.value)
                          }
                          disabled={item.status === "uploading"}
                          placeholder="Alt text / label (required)"
                          className="h-10 w-full flex-1 rounded-default border border-border bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
                        />
                        <button
                          type="button"
                          disabled={
                            !item.alt.trim() || item.status === "uploading"
                          }
                          onClick={() => void uploadQueueItem(item)}
                          className="inline-flex h-10 shrink-0 items-center justify-center rounded-default bg-accent px-4 text-sm font-medium text-surface disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {item.status === "uploading"
                            ? `${item.progress}%`
                            : item.status === "error"
                              ? "Retry"
                              : "Upload"}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Library
          </h2>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <label className="relative block sm:w-64">
              <span className="sr-only">Search media</span>
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search filename or alt"
                className="h-10 w-full rounded-default border border-border bg-surface py-2 pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
            </label>
            <label className="block sm:w-44">
              <span className="sr-only">Filter by folder</span>
              <select
                value={folderFilter}
                onChange={(event) => setFolderFilter(event.target.value)}
                className="h-10 w-full rounded-default border border-border bg-surface px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <option value="all">All folders</option>
                {folders.map((folder) => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            {items.length === 0
              ? "No media uploaded yet."
              : "No media matches your filters."}
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-default border border-border bg-surface shadow-soft dark:shadow-glow"
              >
                <button
                  type="button"
                  onClick={() => openDetails(item)}
                  className="group relative block aspect-[4/3] w-full bg-background"
                >
                  <MediaThumb item={item} />
                </button>
                <div className="space-y-1 px-3 py-3">
                  <p className="line-clamp-2 text-sm text-foreground">
                    {item.alt}
                  </p>
                  <p className="font-mono text-xs text-muted">
                    {item.folder?.trim() || "uploads"}
                    {item.width && item.height
                      ? ` · ${item.width}×${item.height}`
                      : item.mimeType
                        ? ` · ${item.mimeType}`
                        : ""}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-foreground/20">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="media-details-title"
            className="flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-soft dark:shadow-glow"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2
                id="media-details-title"
                className="font-display text-lg font-semibold text-foreground"
              >
                Media details
              </h2>
              <button
                type="button"
                onClick={closeDetails}
                className="inline-flex size-9 items-center justify-center rounded-default border border-border text-foreground"
                aria-label="Close details"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="relative aspect-[4/3] overflow-hidden rounded-default border border-border bg-background">
                <MediaThumb item={selected} />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium tracking-wide text-muted uppercase">
                  Filename
                </p>
                <p className="break-all text-sm text-foreground">
                  {selected.filename || "Untitled"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium tracking-wide text-muted uppercase">
                  Folder
                </p>
                <p className="text-sm text-foreground">
                  {selected.folder?.trim() || "uploads"}
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="media-edit-alt"
                  className="text-sm font-medium text-foreground"
                >
                  Alt text
                </label>
                <textarea
                  id="media-edit-alt"
                  value={editAlt}
                  onChange={(event) => setEditAlt(event.target.value)}
                  rows={3}
                  className="w-full rounded-default border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                />
                <button
                  type="button"
                  disabled={savingAlt || editAlt.trim() === selected.alt}
                  onClick={handleSaveAlt}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-default bg-accent px-4 text-sm font-medium text-surface disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check className="size-4" aria-hidden="true" />
                  {savingAlt ? "Saving…" : "Save alt"}
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">URL</p>
                <p className="break-all font-mono text-xs text-muted">
                  {selected.url}
                </p>
                <button
                  type="button"
                  onClick={() => handleCopyUrl(selected.url)}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-default border border-border px-4 text-sm font-medium text-foreground"
                >
                  <Copy className="size-4" aria-hidden="true" />
                  Copy URL
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Where used</p>
                {usagesLoading ? (
                  <p className="text-sm text-muted">Scanning content…</p>
                ) : usagesError ? (
                  <p className="text-sm text-danger">{usagesError}</p>
                ) : usages && usages.length === 0 ? (
                  <p className="rounded-default border border-border bg-background px-3 py-2 text-sm text-muted">
                    No references found in posts, pages, services, or settings.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {(usages ?? []).map((usage) => (
                      <li key={`${usage.type}-${usage.id}`}>
                        {usage.href ? (
                          <Link
                            href={usage.href}
                            className="flex items-center justify-between gap-2 rounded-default border border-border bg-background px-3 py-2 text-sm transition-colors hover:border-accent/40"
                          >
                            <span className="min-w-0 truncate text-foreground">
                              {usage.title}
                            </span>
                            <span className="shrink-0 font-mono text-[11px] text-muted">
                              {usage.type}
                            </span>
                          </Link>
                        ) : (
                          <div className="flex items-center justify-between gap-2 rounded-default border border-border bg-background px-3 py-2 text-sm">
                            <span className="min-w-0 truncate text-foreground">
                              {usage.title}
                            </span>
                            <span className="shrink-0 font-mono text-[11px] text-muted">
                              {usage.type}
                            </span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                type="button"
                onClick={() => setDeleteTarget(selected)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-default border border-danger/30 px-4 text-sm font-medium text-danger"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/20 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-media-title"
            className="w-full max-w-md rounded-default border border-border bg-surface p-6 shadow-soft dark:shadow-glow"
          >
            <h2
              id="delete-media-title"
              className="font-display text-xl font-semibold text-foreground"
            >
              Delete this file?
            </h2>
            <p className="mt-2 text-sm text-muted">
              This removes the file from storage and the media library.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="inline-flex h-10 items-center justify-center rounded-default border border-border px-4 text-sm font-medium text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="inline-flex h-10 items-center justify-center rounded-default bg-danger px-4 text-sm font-medium text-surface disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
