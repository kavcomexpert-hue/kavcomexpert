"use client";

import { adminGlobalSearch } from "@/actions/admin-search";
import { openAdminHref } from "@/lib/admin/open-href";
import {
  caseStudyPath,
  pagePath,
  postPath,
  servicePath,
} from "@/lib/paths";
import type { LinkButton } from "@/lib/content/link-button";
import { useEffect, useId, useState } from "react";

const fieldClassName =
  "w-full rounded-default border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function publicPathFromAdminHref(
  type: string,
  meta: string | undefined,
): string | null {
  if (!meta) return null;
  if (type === "posts") return postPath(meta);
  if (type === "services") {
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

type LinkButtonFieldProps = {
  label?: string;
  value: LinkButton;
  onChange: (next: LinkButton) => void;
  className?: string;
};

export function LinkButtonField({
  label,
  value,
  onChange,
  className,
}: LinkButtonFieldProps) {
  const titleId = useId();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<
    {
      type: string;
      label: string;
      items: { title: string; path: string }[];
    }[]
  >([]);

  useEffect(() => {
    if (!pickerOpen) return;
    const q = query.trim();

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (q.length < 2) {
        setGroups([]);
        return;
      }
      void (async () => {
        setLoading(true);
        const result = await adminGlobalSearch(q, { publishedOnly: true });
        if (cancelled) return;
        setLoading(false);
        if (!result.success) {
          setGroups([]);
          return;
        }
        setGroups(
          result.groups
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
                  return { title: item.title, path };
                })
                .filter((item): item is { title: string; path: string } => !!item),
            }))
            .filter((group) => group.items.length > 0),
        );
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pickerOpen, query]);

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {label ? (
        <p className="text-sm font-medium text-foreground">{label}</p>
      ) : null}

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
          className="size-4 rounded border-border"
        />
        Enabled
      </label>

      <div className="space-y-1">
        <label className="text-xs text-muted">Label</label>
        <input
          type="text"
          value={value.label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          disabled={!value.enabled}
          className={fieldClassName}
          placeholder="Button text"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted">Destination</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={value.href}
            onChange={(e) => onChange({ ...value, href: e.target.value })}
            disabled={!value.enabled}
            className={fieldClassName}
            placeholder="/contact-us or https://…"
          />
          <button
            type="button"
            disabled={!value.enabled || !value.href.trim()}
            onClick={() => openAdminHref(value.href)}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-default border border-border bg-surface px-3 text-xs font-medium text-foreground disabled:opacity-50"
          >
            Open
          </button>
          <button
            type="button"
            disabled={!value.enabled}
            onClick={() => {
              setPickerOpen(true);
              setQuery("");
              setGroups([]);
            }}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-default border border-border bg-surface px-3 text-xs font-medium text-foreground disabled:opacity-50"
          >
            Browse
          </button>
        </div>
        <p className="text-[11px] text-muted">
          Paste a URL/path, or browse posts, pages, services, and case studies.
          Use Open to preview the destination.
        </p>
      </div>

      {pickerOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-default border border-border bg-background shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 id={titleId} className="text-sm font-medium text-foreground">
                Pick internal link
              </h3>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="text-xs text-muted hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 p-4">
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search published content…"
                className={fieldClassName}
              />
              {loading ? (
                <p className="text-sm text-muted">Searching…</p>
              ) : query.trim().length < 2 ? (
                <p className="text-sm text-muted">Type at least 2 characters.</p>
              ) : groups.length === 0 ? (
                <p className="text-sm text-muted">No matches.</p>
              ) : (
                <div className="max-h-72 space-y-4 overflow-y-auto">
                  {groups.map((group) => (
                    <div key={group.type}>
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                        {group.label}
                      </p>
                      <ul className="space-y-1">
                        {group.items.map((item) => (
                          <li key={item.path}>
                            <button
                              type="button"
                              className="flex w-full flex-col items-start rounded-default px-2 py-1.5 text-left hover:bg-surface"
                              onClick={() => {
                                onChange({ ...value, href: item.path });
                                setPickerOpen(false);
                              }}
                            >
                              <span className="text-sm text-foreground">
                                {item.title}
                              </span>
                              <span className="font-mono text-[10px] text-muted">
                                {item.path}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
