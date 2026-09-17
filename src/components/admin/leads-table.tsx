"use client";

import {
  deleteLead,
  deleteLeads,
  exportLeadsCsv,
  updateLeadStatus,
} from "@/actions/leads";
import { useToast } from "@/components/ui/toast";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type LeadStatus = "new" | "contacted" | "closed";

type LeadRow = {
  id: string;
  name: string | null;
  email: string;
  company: string | null;
  source: string | null;
  path: string | null;
  message: string | null;
  status: string | null;
  createdAt: Date | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const fieldClassName =
  "h-10 w-full rounded-default border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

function normalizeStatus(value: string | null | undefined): LeadStatus {
  if (value === "contacted" || value === "closed") return value;
  return "new";
}

export function LeadsTable({
  leads,
  canExportCsv = false,
}: {
  leads: LeadRow[];
  canExportCsv?: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<Record<string, LeadStatus>>(() =>
    Object.fromEntries(
      leads.map((lead) => [lead.id, normalizeStatus(lead.status)]),
    ),
  );
  const [prevLeads, setPrevLeads] = useState(leads);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<
    { mode: "one"; id: string } | { mode: "many"; ids: string[] } | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  if (leads !== prevLeads) {
    setPrevLeads(leads);
    setStatuses(
      Object.fromEntries(
        leads.map((lead) => [lead.id, normalizeStatus(lead.status)]),
      ),
    );
    setSelectedIds((current) =>
      current.filter((id) => leads.some((lead) => lead.id === id)),
    );
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((lead) => {
      const haystack = [
        lead.name,
        lead.email,
        lead.company,
        lead.source,
        lead.path,
        lead.message,
        lead.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [leads, search]);

  const selected = selectedId
    ? (leads.find((lead) => lead.id === selectedId) ?? null)
    : null;

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((lead) => selectedIds.includes(lead.id));

  async function handleStatusChange(id: string, status: LeadStatus) {
    setStatuses((current) => ({ ...current, [id]: status }));
    setSavingId(id);
    const result = await updateLeadStatus(id, status);
    setSavingId(null);

    if (!result.success) {
      toast(result.error, "error");
      router.refresh();
      return;
    }

    toast("Status updated");
    router.refresh();
  }

  async function handleExport() {
    setExporting(true);
    const result = await exportLeadsCsv();
    setExporting(false);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.filename;
    link.click();
    URL.revokeObjectURL(url);
    toast("CSV exported");
  }

  function toggleOne(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  }

  function toggleAllFiltered() {
    if (allFilteredSelected) {
      const filteredSet = new Set(filtered.map((lead) => lead.id));
      setSelectedIds((current) => current.filter((id) => !filteredSet.has(id)));
      return;
    }
    setSelectedIds((current) => [
      ...new Set([...current, ...filtered.map((lead) => lead.id)]),
    ]);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    const result =
      deleteTarget.mode === "one"
        ? await deleteLead(deleteTarget.id)
        : await deleteLeads(deleteTarget.ids);

    setDeleting(false);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    const count =
      deleteTarget.mode === "one"
        ? 1
        : "count" in result
          ? result.count
          : deleteTarget.ids.length;

    toast(count === 1 ? "Lead deleted" : `${count} leads deleted`);
    setDeleteTarget(null);
    setSelectedId(null);
    setSelectedIds([]);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, source, path…"
          className={`${fieldClassName} sm:max-w-sm`}
        />
        <div className="flex flex-wrap gap-2">
          {selectedIds.length > 0 ? (
            <button
              type="button"
              onClick={() =>
                setDeleteTarget({ mode: "many", ids: selectedIds })
              }
              className="inline-flex h-11 items-center justify-center rounded-default border border-danger/40 px-5 text-sm font-medium text-danger"
            >
              Delete selected ({selectedIds.length})
            </button>
          ) : null}
          {canExportCsv ? (
            <button
              type="button"
              disabled={exporting}
              onClick={() => void handleExport()}
              className="inline-flex h-11 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface disabled:opacity-50"
            >
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-default border border-border bg-surface shadow-soft dark:shadow-glow">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1140px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAllFiltered}
                    aria-label="Select all visible leads"
                    className="size-4 rounded border-border text-accent focus:ring-accent"
                  />
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                  Name
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                  Email
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                  Source
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                  Path
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                  Status
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                  Date
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted">
                    No leads match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(lead.id)}
                        onChange={() => toggleOne(lead.id)}
                        aria-label={`Select ${lead.email}`}
                        className="size-4 rounded border-border text-accent focus:ring-accent"
                      />
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {lead.name ?? "N/A"}
                    </td>
                    <td className="px-4 py-3 text-foreground">{lead.email}</td>
                    <td className="px-4 py-3 text-muted">
                      {lead.source ?? "N/A"}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-muted">
                      {lead.path ?? "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={statuses[lead.id] ?? "new"}
                        disabled={savingId === lead.id}
                        onChange={(e) =>
                          void handleStatusChange(
                            lead.id,
                            e.target.value as LeadStatus,
                          )
                        }
                        className="h-9 rounded-default border border-border bg-background px-2 text-sm text-foreground"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {lead.createdAt
                        ? dateFormatter.format(lead.createdAt)
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedId(lead.id)}
                          className="text-sm font-medium text-accent"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({ mode: "one", id: lead.id })
                          }
                          className="text-sm font-medium text-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/70">
          <button
            type="button"
            aria-label="Close drawer"
            className="flex-1"
            onClick={() => setSelectedId(null)}
          />
          <aside className="flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-soft">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Lead details
              </h2>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="text-sm text-muted hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto px-5 py-5 text-sm">
              <Detail label="Name" value={selected.name ?? "N/A"} />
              <Detail label="Email" value={selected.email} />
              <Detail label="Company" value={selected.company ?? "N/A"} />
              <Detail label="Source" value={selected.source ?? "N/A"} />
              <Detail label="Path" value={selected.path ?? "N/A"} />
              <Detail
                label="Status"
                value={statuses[selected.id] ?? normalizeStatus(selected.status)}
              />
              <Detail
                label="Received"
                value={
                  selected.createdAt
                    ? dateFormatter.format(selected.createdAt)
                    : "N/A"
                }
              />
              <div className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-wider text-muted">
                  Message
                </p>
                <p className="whitespace-pre-wrap rounded-default border border-border bg-background p-3 text-foreground">
                  {selected.message?.trim() || "No message provided."}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget({ mode: "one", id: selected.id })
                }
                className="inline-flex h-10 items-center justify-center rounded-default border border-danger/40 px-4 text-sm font-medium text-danger"
              >
                Delete lead
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-lead-title"
            className="w-full max-w-md rounded-default border border-border bg-surface p-5 shadow-soft"
          >
            <h2
              id="delete-lead-title"
              className="font-display text-lg font-semibold text-foreground"
            >
              {deleteTarget.mode === "one"
                ? "Delete this lead?"
                : `Delete ${deleteTarget.ids.length} leads?`}
            </h2>
            <p className="mt-2 text-sm text-muted">
              This cannot be undone. The action is written to the audit log.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="inline-flex h-10 items-center rounded-default border border-border px-4 text-sm text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void confirmDelete()}
                className="inline-flex h-10 items-center rounded-default bg-danger px-4 text-sm font-medium text-surface disabled:opacity-60"
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="font-mono text-xs uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="text-foreground">{value}</p>
    </div>
  );
}
