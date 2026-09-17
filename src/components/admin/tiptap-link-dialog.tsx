"use client";

import { adminGlobalSearch } from "@/actions/admin-search";
import { openAdminHref } from "@/lib/admin/open-href";
import {
  caseStudyPath,
  pagePath,
  postPath,
  servicePath,
} from "@/lib/paths";
import { useEffect, useId, useState } from "react";

type LinkMode = "external" | "internal";

export type LinkDialogResult = {
  href: string;
} | null;

type TiptapLinkDialogProps = {
  open: boolean;
  initialHref?: string;
  onClose: () => void;
  onSubmit: (href: string) => void;
  onRemove?: () => void;
};

function publicPathFromAdminHref(
  type: string,
  meta: string | undefined,
): string | null {
  if (!meta) return null;
  if (type === "posts") return postPath(meta);
  if (type === "services") {
    // meta is either a bare slug or a nested path like "parent/slug"
    // (or a full /services/... path from admin-search).
    if (meta.startsWith("/")) return meta;
    const parts = meta.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return servicePath({
        slug: parts[parts.length - 1]!,
        parentSlug: parts[parts.length - 2],
      });
    }
    return servicePath({ slug: parts[0] ?? meta });
  }
  if (type === "caseStudies") return caseStudyPath(meta);
  if (type === "pages") return pagePath(meta);
  return null;
}

export function TiptapLinkDialog({
  open,
  initialHref = "",
  onClose,
  onSubmit,
  onRemove,
}: TiptapLinkDialogProps) {
  const titleId = useId();
  const looksInternal =
    initialHref.startsWith("/") && !initialHref.startsWith("//");
  const [mode, setMode] = useState<LinkMode>(
    looksInternal ? "internal" : "external",
  );
  const [externalUrl, setExternalUrl] = useState(
    looksInternal ? "https://" : initialHref || "https://",
  );
  const [query, setQuery] = useState("");
  const [selectedPath, setSelectedPath] = useState(
    looksInternal ? initialHref : "",
  );
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<
    {
      type: string;
      label: string;
      items: { id: string; title: string; href: string; meta?: string; path: string }[];
    }[]
  >([]);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const internal =
        initialHref.startsWith("/") && !initialHref.startsWith("//");
      setMode(internal ? "internal" : "external");
      setExternalUrl(internal ? "https://" : initialHref || "https://");
      setSelectedPath(internal ? initialHref : "");
      setQuery("");
      setGroups([]);
    }
  }

  useEffect(() => {
    if (!open || mode !== "internal") return;
    const q = query.trim();
    if (q.length < 2) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        const result = await adminGlobalSearch(q, { publishedOnly: true });
        if (cancelled) return;
        setLoading(false);
        if (!result.success) {
          setGroups([]);
          return;
        }

        const next = result.groups
          .filter((group) =>
            ["posts", "pages", "services", "caseStudies"].includes(group.type),
          )
          .map((group) => ({
            type: group.type,
            label: group.label,
            items: group.items
              .map((item) => {
                const path = publicPathFromAdminHref(group.type, item.meta);
                if (!path) return null;
                return { ...item, path };
              })
              .filter(
                (
                  item,
                ): item is {
                  id: string;
                  title: string;
                  href: string;
                  meta?: string;
                  path: string;
                } => item !== null,
              ),
          }))
          .filter((group) => group.items.length > 0);

        setGroups(next);
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, mode, query]);

  const trimmedQuery = query.trim();
  const searchable = trimmedQuery.length >= 2;
  const visibleGroups = searchable ? groups : [];

  if (!open) return null;

  function handleApply() {
    if (mode === "external") {
      const href = externalUrl.trim();
      if (!href) return;
      onSubmit(href);
      return;
    }
    if (!selectedPath) return;
    onSubmit(selectedPath);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-default border border-border bg-surface p-5 shadow-soft"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id={titleId}
          className="font-display text-lg font-semibold text-foreground"
        >
          Add link
        </h2>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("external")}
            className={`inline-flex h-9 items-center rounded-full px-3 text-sm font-medium ${
              mode === "external"
                ? "bg-accent text-surface"
                : "border border-border bg-background text-foreground"
            }`}
          >
            External URL
          </button>
          <button
            type="button"
            onClick={() => setMode("internal")}
            className={`inline-flex h-9 items-center rounded-full px-3 text-sm font-medium ${
              mode === "internal"
                ? "bg-accent text-surface"
                : "border border-border bg-background text-foreground"
            }`}
          >
            Link to existing content
          </button>
        </div>

        {mode === "external" ? (
          <div className="mt-4 space-y-2">
            <label
              htmlFor="tiptap-external-url"
              className="text-sm font-medium text-foreground"
            >
              URL
            </label>
            <input
              id="tiptap-external-url"
              value={externalUrl}
              onChange={(event) => setExternalUrl(event.target.value)}
              className="h-10 w-full rounded-default border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
              placeholder="https://"
              autoFocus
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              <label
                htmlFor="tiptap-internal-search"
                className="text-sm font-medium text-foreground"
              >
                Search published content
              </label>
              <input
                id="tiptap-internal-search"
                value={query}
                onChange={(event) => {
                  const next = event.target.value;
                  setQuery(next);
                  if (next.trim().length < 2) {
                    setLoading(false);
                  }
                }}
                className="h-10 w-full rounded-default border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
                placeholder="Search posts, pages, services…"
                autoFocus
              />
            </div>
            {selectedPath ? (
              <p className="font-mono text-xs text-muted">
                Selected: {selectedPath}
              </p>
            ) : null}
            <div className="max-h-56 space-y-3 overflow-y-auto rounded-default border border-border bg-background p-2">
              {loading && searchable ? (
                <p className="px-2 py-3 text-sm text-muted">Searching…</p>
              ) : null}
              {!loading && searchable && visibleGroups.length === 0 ? (
                <p className="px-2 py-3 text-sm text-muted">No matches</p>
              ) : null}
              {visibleGroups.map((group) => (
                <div key={group.type}>
                  <p className="px-2 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                    {group.label}
                  </p>
                  <ul className="space-y-1">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedPath(item.path)}
                          className={`flex w-full flex-col items-start rounded-default px-2 py-2 text-left text-sm ${
                            selectedPath === item.path
                              ? "bg-accent/10 text-accent"
                              : "text-foreground hover:bg-surface"
                          }`}
                        >
                          <span className="font-medium">{item.title}</span>
                          <span className="font-mono text-xs text-muted">
                            {item.path}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            {onRemove && initialHref ? (
              <button
                type="button"
                onClick={onRemove}
                className="text-sm text-danger"
              >
                Remove link
              </button>
            ) : null}
            <button
              type="button"
              disabled={
                mode === "external" ? !externalUrl.trim() : !selectedPath
              }
              onClick={() =>
                openAdminHref(
                  mode === "external" ? externalUrl : selectedPath,
                )
              }
              className="text-sm font-medium text-accent disabled:opacity-50"
            >
              Open link
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-default border border-border px-4 text-sm text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={
                mode === "external" ? !externalUrl.trim() : !selectedPath
              }
              className="inline-flex h-10 items-center rounded-default bg-accent px-4 text-sm font-medium text-surface disabled:opacity-60"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
