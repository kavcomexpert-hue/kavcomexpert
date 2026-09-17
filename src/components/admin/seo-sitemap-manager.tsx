"use client";

import {
  saveSitemapExcludedPaths,
  setContentSitemapInclude,
  setContentSitemapPriority,
  setStaticPathSitemapExcluded,
} from "@/actions/seo-sitemap";
import type { SitemapAdminRow } from "@/lib/seo/sitemap-data";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const sourceLabels: Record<SitemapAdminRow["source"], string> = {
  static: "Static",
  post: "Post",
  page: "Page",
  "landing-page": "Landing page",
  service: "Service",
  "case-study": "Case study",
  job: "Job",
  category: "Category",
  tag: "Tag",
};

type SeoSitemapManagerProps = {
  rows: SitemapAdminRow[];
  excludedPaths: string[];
};

export function SeoSitemapManager({
  rows,
  excludedPaths: initialExcluded,
}: SeoSitemapManagerProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [excludedPaths, setExcludedPaths] = useState(initialExcluded);
  const [newPath, setNewPath] = useState("");
  const [priorityDrafts, setPriorityDrafts] = useState<Record<string, string>>(
    {},
  );

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function toggleRow(row: SitemapAdminRow, include: boolean) {
    if (
      row.source === "static" ||
      row.source === "job" ||
      row.source === "category" ||
      row.source === "tag"
    ) {
      const result = await setStaticPathSitemapExcluded({
        path: row.path,
        excluded: !include,
      });
      if (!result.success) {
        toast(result.error, "error");
        return;
      }
      toast(include ? "Included in sitemap" : "Excluded from sitemap");
      refresh();
      return;
    }

    if (!row.entityId) return;

    if (row.noIndex && include) {
      toast("Clear noIndex on the content editor before including.", "error");
      return;
    }

    const result = await setContentSitemapInclude({
      source: row.source,
      id: row.entityId,
      include,
    });

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    toast(include ? "Included in sitemap" : "Excluded from sitemap");
    refresh();
  }

  async function savePriority(row: SitemapAdminRow) {
    if (
      !row.entityId ||
      row.source === "static" ||
      row.source === "job" ||
      row.source === "category" ||
      row.source === "tag"
    ) {
      return;
    }

    const key = `${row.source}:${row.entityId}`;
    const raw = priorityDrafts[key] ?? String(row.priority);
    const priority = Number.parseFloat(raw);

    if (Number.isNaN(priority) || priority < 0 || priority > 1) {
      toast("Priority must be between 0 and 1", "error");
      return;
    }

    const result = await setContentSitemapPriority({
      source: row.source,
      id: row.entityId,
      priority,
    });

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    toast("Priority saved");
    refresh();
  }

  async function addExcludedPath() {
    const path = newPath.trim().startsWith("/")
      ? newPath.trim()
      : `/${newPath.trim()}`;
    if (!path || path === "/") {
      toast("Enter a path like /blog/example", "error");
      return;
    }
    if (excludedPaths.includes(path)) {
      toast("Path already excluded", "error");
      return;
    }

    const next = [...excludedPaths, path];
    const result = await saveSitemapExcludedPaths(next);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    setExcludedPaths(next);
    setNewPath("");
    toast("Excluded path added");
    refresh();
  }

  async function removeExcludedPath(path: string) {
    const next = excludedPaths.filter((entry) => entry !== path);
    const result = await saveSitemapExcludedPaths(next);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    setExcludedPaths(next);
    toast("Excluded path removed");
    refresh();
  }

  const liveCount = rows.filter((row) => row.included).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {liveCount} of {rows.length} URLs currently included in the live
          sitemap.
        </p>
        <a
          href="/sitemap.xml"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
        >
          View live sitemap
        </a>
      </div>

      <section className="rounded-default border border-border bg-surface p-5 shadow-soft dark:shadow-glow">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
          Global excluded paths
        </h2>
        <p className="mt-1 text-sm text-muted">
          Paths listed here never appear in the sitemap, even when a row is
          marked include.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={newPath}
            onChange={(event) => setNewPath(event.target.value)}
            placeholder="/path-to-exclude"
            className="h-10 min-w-[220px] flex-1 rounded-default border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => void addExcludedPath()}
            className="h-10 rounded-full bg-accent px-4 text-sm font-medium text-surface disabled:opacity-50"
          >
            Add path
          </button>
        </div>
        {excludedPaths.length === 0 ? (
          <p className="mt-4 font-mono text-xs text-muted">No excluded paths</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {excludedPaths.map((path) => (
              <li
                key={path}
                className="flex items-center justify-between gap-3 rounded-default border border-border bg-background px-3 py-2"
              >
                <span className="font-mono text-sm text-foreground">{path}</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void removeExcludedPath(path)}
                  className="text-xs font-medium text-danger hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="overflow-hidden rounded-default border border-border bg-surface shadow-soft dark:shadow-glow">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                  URL
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                  Source
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                  Priority
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                  Include
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const priorityKey = row.entityId
                  ? `${row.source}:${row.entityId}`
                  : row.path;
                const canEditPriority =
                  Boolean(row.entityId) &&
                  row.source !== "static" &&
                  row.source !== "job" &&
                  row.source !== "category" &&
                  row.source !== "tag";

                return (
                  <tr
                    key={`${row.source}-${row.path}`}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <p className="font-mono text-sm text-foreground">
                        {row.path}
                      </p>
                      {row.noIndex ? (
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-danger">
                          noIndex
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {sourceLabels[row.source]}
                    </td>
                    <td className="px-4 py-3">
                      {canEditPriority ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={1}
                            step={0.1}
                            value={
                              priorityDrafts[priorityKey] ??
                              String(row.priority)
                            }
                            onChange={(event) =>
                              setPriorityDrafts((drafts) => ({
                                ...drafts,
                                [priorityKey]: event.target.value,
                              }))
                            }
                            className="h-9 w-20 rounded-default border border-border bg-background px-2 font-mono text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          />
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => void savePriority(row)}
                            className="text-xs font-medium text-accent hover:underline disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono text-sm text-muted">
                          {row.priority.toFixed(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <label className="inline-flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={row.included}
                          disabled={pending || (row.noIndex && !row.included)}
                          onChange={(event) =>
                            void toggleRow(row, event.target.checked)
                          }
                          className="size-4 rounded border-border accent-[var(--accent)]"
                        />
                        <span className="font-mono text-xs uppercase tracking-wider text-muted">
                          {row.included ? "On" : "Off"}
                        </span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
