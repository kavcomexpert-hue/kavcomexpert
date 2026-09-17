"use client";

import {
  bulkUpdateServices,
  deleteServicePermanently,
  duplicateService,
  reorderServices,
  restoreService,
  trashService,
} from "@/actions/services";
import { useDragReorder } from "@/hooks/use-drag-reorder";
import { useToast } from "@/components/ui/toast";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ServiceRow = {
  id: string;
  name: string;
  slug: string;
  status: string | null;
  publishedAt: Date | null;
  scheduledFor: Date | null;
  parentId: string | null;
};

type StatusFilter = "all" | "published" | "draft" | "scheduled" | "trashed";

export function ServicesTable({ items }: { items: ServiceRow[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [busy, setBusy] = useState(false);
  const dateFmt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const parentNameById = new Map(
    items.map((item) => [item.id, item.name] as const),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const status = item.status ?? "draft";
      if (filter === "trashed") {
        if (status !== "trashed") return false;
      } else {
        if (status === "trashed") return false;
        if (filter !== "all" && status !== filter) return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q)
      );
    });
  }, [items, filter, query]);

  const {
    orderedItems,
    draggingId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useDragReorder(filtered, async (orderedIds) => {
    if (filter !== "all" || query.trim()) {
      toast("Clear search/filter before reordering", "error");
      return;
    }
    const result = await reorderServices(orderedIds);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast("Order updated");
    router.refresh();
  });

  const allVisibleSelected =
    orderedItems.length > 0 &&
    orderedItems.every((item) => selected.has(item.id));

  function toggleAll(checked: boolean) {
    if (!checked) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(orderedItems.map((item) => item.id)));
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function runBulk() {
    if (!bulkAction || selected.size === 0) return;
    setBusy(true);
    const result = await bulkUpdateServices({
      ids: [...selected],
      action: bulkAction as "publish" | "trash" | "restore" | "delete",
    });
    setBusy(false);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast(`Updated ${result.count} service(s)`);
    setSelected(new Set());
    setBulkAction("");
    router.refresh();
  }

  async function handleTrash(id: string) {
    setBusy(true);
    const result = await trashService(id);
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
    const result = await restoreService(id);
    setBusy(false);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast("Restored as draft");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this service permanently?")) return;
    setBusy(true);
    const result = await deleteServicePermanently(id);
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
    const result = await duplicateService(id);
    setBusy(false);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast("Duplicated as draft");
    router.push(`/admin/services/${result.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["all", "All"],
            ["published", "Published"],
            ["draft", "Draft"],
            ["scheduled", "Scheduled"],
            ["trashed", "Trash"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setFilter(value);
              setSelected(new Set());
            }}
            className={`inline-flex h-8 items-center rounded-default px-3 text-xs font-medium ${
              filter === value
                ? "bg-accent text-surface"
                : "border border-border bg-background text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search services…"
          className="ml-auto h-8 min-w-[12rem] rounded-default border border-border bg-background px-3 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>

      {filter === "trashed" ? (
        <p className="text-xs text-muted">
          Items in Trash are automatically deleted after 30 days.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={bulkAction}
          onChange={(e) => setBulkAction(e.target.value)}
          className="h-10 rounded-default border border-border bg-surface px-3 text-sm"
        >
          <option value="">Bulk actions</option>
          {filter === "trashed" ? (
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

      <div className="overflow-hidden border border-border bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                  aria-label="Select all"
                  className="size-3.5"
                />
              </th>
              <th className="w-10 px-3 py-2.5" />
              <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted">
                Name
              </th>
              <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted">
                Parent
              </th>
              <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted">
                Slug
              </th>
              <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted">
                Date
              </th>
              <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted">
                Status
              </th>
              <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {orderedItems.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-sm text-muted"
                >
                  No services match this filter.
                </td>
              </tr>
            ) : null}
            {orderedItems.map((item) => {
              const parentSlug = item.parentId
                ? items.find((row) => row.id === item.parentId)?.slug
                : null;
              const dateLabel =
                item.status === "published" && item.publishedAt
                  ? `Published ${dateFmt.format(item.publishedAt)}`
                  : item.status === "scheduled" && item.scheduledFor
                    ? `Scheduled ${dateFmt.format(item.scheduledFor)}`
                    : "-";
              return (
                <tr
                  key={item.id}
                  draggable={filter === "all" && !query.trim()}
                  onDragStart={() => handleDragStart(item.id)}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  onDragEnd={() => void handleDragEnd()}
                  className={`border-b border-border last:border-b-0 ${
                    draggingId === item.id ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={(e) => toggleOne(item.id, e.target.checked)}
                      aria-label={`Select ${item.name}`}
                      className="size-3.5"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-muted">
                    <GripVertical className="size-4 cursor-grab" />
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/admin/services/${item.id}`}
                      className="font-medium text-foreground hover:text-accent"
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted">
                    {item.parentId
                      ? (parentNameById.get(item.parentId) ?? "—")
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted">
                    {parentSlug
                      ? `/services/${parentSlug}/${item.slug}`
                      : `/services/${item.slug}`}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted">{dateLabel}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium ${
                        item.status === "published"
                          ? "bg-accent/10 text-accent"
                          : item.status === "scheduled"
                            ? "bg-warning/10 text-warning"
                            : item.status === "trashed"
                              ? "bg-danger/10 text-danger"
                              : "bg-background text-muted"
                      }`}
                    >
                      {item.status === "published"
                        ? "Published"
                        : item.status === "scheduled"
                          ? "Scheduled"
                          : item.status === "trashed"
                            ? "Trashed"
                            : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-2 text-xs font-medium text-muted">
                      {item.status === "trashed" ? (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleRestore(item.id)}
                            className="hover:text-accent disabled:opacity-50"
                          >
                            Restore
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleDelete(item.id)}
                            className="hover:text-danger disabled:opacity-50"
                          >
                            Delete Permanently
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            href={`/admin/services/${item.id}`}
                            className="hover:text-accent"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleDuplicate(item.id)}
                            className="hover:text-accent disabled:opacity-50"
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleTrash(item.id)}
                            className="hover:text-danger disabled:opacity-50"
                          >
                            Trash
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
