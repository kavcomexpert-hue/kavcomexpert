"use client";

import {
  bulkUpdateLandingPages,
  deleteLandingPagePermanently,
  duplicateLandingPage,
  quickEditLandingPage,
  restoreLandingPage,
  trashLandingPage,
} from "@/actions/landing-pages";
import { useToast } from "@/components/ui/toast";
import type { AdminLandingPageListItem } from "@/lib/queries/admin-landing-pages";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type TabId = "all" | "published" | "draft" | "scheduled" | "trashed";

type LandingPagesTableProps = {
  pages: AdminLandingPageListItem[];
  authors: { id: string; name: string; email: string }[];
};

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function seoReady(page: AdminLandingPageListItem) {
  return Boolean(page.metaTitle?.trim() && page.metaDescription?.trim());
}

function statusSuffix(status: string | null) {
  if (status === "draft") return " - Draft";
  if (status === "scheduled") return " - Scheduled";
  if (status === "trashed") return " - Trash";
  return null;
}

export function LandingPagesTable({ pages, authors }: LandingPagesTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("all");
  const [search, setSearch] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [busy, setBusy] = useState(false);
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [qe, setQe] = useState({
    title: "",
    slug: "",
    status: "draft" as "draft" | "published" | "scheduled",
  });

  const counts = useMemo(() => {
    const c = {
      all: 0,
      published: 0,
      draft: 0,
      scheduled: 0,
      trashed: 0,
    };
    for (const p of pages) {
      if (p.status === "trashed") {
        c.trashed += 1;
        continue;
      }
      c.all += 1;
      if (p.status === "published") c.published += 1;
      else if (p.status === "scheduled") c.scheduled += 1;
      else c.draft += 1;
    }
    return c;
  }, [pages]);

  const filtered = useMemo(() => {
    return pages.filter((p) => {
      if (tab === "trashed") {
        if (p.status !== "trashed") return false;
      } else {
        if (p.status === "trashed") return false;
        if (tab === "published" && p.status !== "published") return false;
        if (tab === "draft" && p.status !== "draft") return false;
        if (tab === "scheduled" && p.status !== "scheduled") return false;
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !p.slug.includes(q)) {
          return false;
        }
      }

      if (authorFilter && p.authorId !== authorFilter) return false;

      return true;
    });
  }, [pages, tab, search, authorFilter]);

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  function toggleAll() {
    if (allVisibleSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(filtered.map((p) => p.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openQuickEdit(page: AdminLandingPageListItem) {
    setQuickEditId(page.id);
    setQe({
      title: page.title,
      slug: page.slug,
      status:
        page.status === "published" || page.status === "scheduled"
          ? page.status
          : "draft",
    });
  }

  async function runBulk() {
    if (!bulkAction || selected.size === 0) return;
    setBusy(true);
    const result = await bulkUpdateLandingPages({
      ids: [...selected],
      action: bulkAction as "publish" | "trash" | "restore" | "delete",
    });
    setBusy(false);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast(`Updated ${result.count} landing page(s)`);
    setSelected(new Set());
    setBulkAction("");
    router.refresh();
  }

  async function handleTrash(id: string) {
    setBusy(true);
    const result = await trashLandingPage(id);
    setBusy(false);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast("Moved to trash");
    router.refresh();
  }

  async function handleRestore(id: string) {
    setBusy(true);
    const result = await restoreLandingPage(id);
    setBusy(false);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast("Restored as draft");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this landing page permanently?")) return;
    setBusy(true);
    const result = await deleteLandingPagePermanently(id);
    setBusy(false);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast("Deleted permanently");
    router.refresh();
  }

  async function handleDuplicate(id: string) {
    setBusy(true);
    const result = await duplicateLandingPage(id);
    setBusy(false);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast("Duplicated as draft");
    router.push(`/admin/landing-pages/${result.id}`);
    router.refresh();
  }

  async function saveQuickEdit() {
    if (!quickEditId) return;
    setBusy(true);
    const result = await quickEditLandingPage({ id: quickEditId, ...qe });
    setBusy(false);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast("Updated");
    setQuickEditId(null);
    router.refresh();
  }

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "published", label: "Published", count: counts.published },
    { id: "draft", label: "Draft", count: counts.draft },
    { id: "scheduled", label: "Scheduled", count: counts.scheduled },
    { id: "trashed", label: "Trash", count: counts.trashed },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3 text-sm">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setSelected(new Set());
            }}
            className={`px-1 ${
              tab === t.id
                ? "font-semibold text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t.label}{" "}
            <span className="font-mono text-xs">({t.count})</span>
            {i < tabs.length - 1 ? (
              <span className="ml-2 text-border">|</span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "trashed" ? (
        <p className="text-xs text-muted">
          Items in Trash are automatically deleted after 30 days.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search landing pages…"
          className="h-10 min-w-[200px] flex-1 rounded-default border border-border bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
        />
        <select
          value={authorFilter}
          onChange={(e) => setAuthorFilter(e.target.value)}
          className="h-10 rounded-default border border-border bg-surface px-3 text-sm text-foreground"
        >
          <option value="">All authors</option>
          {authors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name || a.email}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={bulkAction}
          onChange={(e) => setBulkAction(e.target.value)}
          className="h-10 rounded-default border border-border bg-surface px-3 text-sm"
        >
          <option value="">Bulk actions</option>
          {tab === "trashed" ? (
            <>
              <option value="restore">Restore</option>
              <option value="delete">Delete permanently</option>
            </>
          ) : (
            <>
              <option value="publish">Publish</option>
              <option value="trash">Move to Trash</option>
            </>
          )}
        </select>
        <button
          type="button"
          disabled={busy || !bulkAction || selected.size === 0}
          onClick={() => void runBulk()}
          className="inline-flex h-10 items-center rounded-default border border-border px-3 text-sm font-medium text-foreground disabled:opacity-50"
        >
          Apply
        </button>
        {selected.size > 0 ? (
          <span className="text-xs text-muted">{selected.size} selected</span>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-default border border-border bg-surface shadow-soft dark:shadow-glow">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-3 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                  Title
                </th>
                <th className="px-3 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                  Author
                </th>
                <th className="px-3 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                  SEO
                </th>
                <th className="px-3 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    No landing pages found.
                  </td>
                </tr>
              ) : (
                filtered.map((page) => {
                  const suffix = statusSuffix(page.status);
                  const dateLabel =
                    page.status === "published" && page.publishedAt
                      ? `Published ${dateFmt.format(page.publishedAt)}`
                      : page.status === "scheduled" && page.scheduledFor
                        ? `Scheduled ${dateFmt.format(page.scheduledFor)}`
                        : page.updatedAt
                          ? `Modified ${dateFmt.format(page.updatedAt)}`
                          : "-";

                  return (
                    <tr
                      key={page.id}
                      className="group border-b border-border last:border-b-0 hover:bg-background/60"
                    >
                      <td className="px-3 py-3 align-top">
                        <input
                          type="checkbox"
                          checked={selected.has(page.id)}
                          onChange={() => toggleOne(page.id)}
                          aria-label={`Select ${page.title}`}
                        />
                      </td>
                      <td className="px-3 py-3 align-top">
                        {quickEditId === page.id ? (
                          <div className="space-y-2">
                            <input
                              value={qe.title}
                              onChange={(e) =>
                                setQe((s) => ({ ...s, title: e.target.value }))
                              }
                              className="h-9 w-full rounded-default border border-border bg-background px-2 text-sm"
                            />
                            <input
                              value={qe.slug}
                              onChange={(e) =>
                                setQe((s) => ({ ...s, slug: e.target.value }))
                              }
                              className="h-9 w-full rounded-default border border-border bg-background px-2 font-mono text-xs"
                            />
                            <select
                              value={qe.status}
                              onChange={(e) =>
                                setQe((s) => ({
                                  ...s,
                                  status: e.target.value as typeof qe.status,
                                }))
                              }
                              className="h-9 w-full rounded-default border border-border bg-background px-2 text-sm"
                            >
                              <option value="draft">Draft</option>
                              <option value="published">Published</option>
                              <option value="scheduled">Scheduled</option>
                            </select>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void saveQuickEdit()}
                                className="text-xs font-medium text-accent"
                              >
                                Update
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuickEditId(null)}
                                className="text-xs text-muted"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Link
                              href={`/admin/landing-pages/${page.id}`}
                              className="font-medium text-foreground hover:text-accent"
                            >
                              {page.title}
                              {suffix ? (
                                <span className="ml-1 font-normal text-muted">
                                  {suffix}
                                </span>
                              ) : null}
                            </Link>
                            <p className="mt-0.5 font-mono text-xs text-muted">
                              {page.path || `/${page.slug}`}
                              {page.layoutKind === "custom" ? (
                                <span className="ml-2 text-muted">· custom</span>
                              ) : null}
                            </p>
                            <div className="mt-1 hidden gap-2 text-xs text-muted group-hover:flex">
                              {page.status === "trashed" ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void handleRestore(page.id)}
                                    className="hover:text-accent"
                                  >
                                    Restore
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void handleDelete(page.id)}
                                    className="hover:text-danger"
                                  >
                                    Delete Permanently
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Link
                                    href={`/admin/landing-pages/${page.id}`}
                                    className="hover:text-accent"
                                  >
                                    Edit
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => openQuickEdit(page)}
                                    className="hover:text-accent"
                                  >
                                    Quick Edit
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() =>
                                      void handleDuplicate(page.id)
                                    }
                                    className="hover:text-accent"
                                  >
                                    Duplicate
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void handleTrash(page.id)}
                                    className="hover:text-danger"
                                  >
                                    Trash
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top text-muted">
                        {page.authorName ?? page.authorEmail ?? "-"}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span
                          className={`inline-block size-2.5 rounded-full ${
                            seoReady(page) ? "bg-success" : "bg-danger"
                          }`}
                          title={
                            seoReady(page)
                              ? "SEO fields look valid"
                              : "Meta title or description missing"
                          }
                        />
                      </td>
                      <td className="px-3 py-3 align-top text-xs text-muted">
                        {dateLabel}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
