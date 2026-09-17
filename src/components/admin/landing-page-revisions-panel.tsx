"use client";

import {
  getLandingPageRevisions,
  restoreLandingPageRevision,
} from "@/actions/landing-pages";
import { useToast } from "@/components/ui/toast";
import {
  readRevisionsCollapsed,
  writeRevisionsCollapsed,
} from "@/lib/admin/revisions-collapsed";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type RevisionRow = {
  id: string;
  createdAt: Date | string | null;
  authorId: string | null;
  authorName: string | null;
  authorEmail: string | null;
  snapshot: unknown;
};

type LandingPageRevisionsPanelProps = {
  landingPageId: string;
  currentTitle: string;
};

function formatRevisionTime(value: Date | string | null) {
  if (!value) return "Unknown time";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function LandingPageRevisionsPanel({
  landingPageId,
  currentTitle,
}: LandingPageRevisionsPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [revisions, setRevisions] = useState<RevisionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [selected, setSelected] = useState<RevisionRow | null>(null);
  const storageKey = `revisionsCollapsed:landing_page:${landingPageId}`;
  const [collapsed, setCollapsed] = useState(() =>
    readRevisionsCollapsed(storageKey),
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const rows = await getLandingPageRevisions(landingPageId);
        if (!cancelled) {
          setRevisions(rows as RevisionRow[]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [landingPageId]);

  async function handleRestore(revisionId: string) {
    setRestoringId(revisionId);
    const result = await restoreLandingPageRevision(landingPageId, revisionId);
    setRestoringId(null);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    toast("Revision restored");
    setSelected(null);
    router.refresh();
  }

  const snapshot =
    selected?.snapshot && typeof selected.snapshot === "object"
      ? (selected.snapshot as Record<string, unknown>)
      : null;
  const snapshotTitle =
    typeof snapshot?.title === "string" ? snapshot.title : "Untitled";

  return (
    <div className="space-y-3 rounded-default border border-border bg-surface p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            Revisions
          </h2>
          <p className="mt-1 text-xs text-muted">Last 15 saved versions</p>
        </div>
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center rounded-default border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          onClick={() =>
            setCollapsed((value) => {
              const next = !value;
              writeRevisionsCollapsed(storageKey, next);
              return next;
            })
          }
          aria-expanded={!collapsed}
        >
          {collapsed ? "Show" : "Hide"}
        </button>
      </div>

      {!collapsed ? (
        loading ? (
          <p className="text-sm text-muted">Loading revisions…</p>
        ) : revisions.length === 0 ? (
          <p className="text-sm text-muted">No revisions yet.</p>
        ) : (
          <ul className="space-y-2">
            {revisions.map((revision) => {
              const author =
                revision.authorName?.trim() ||
                revision.authorEmail?.trim() ||
                "Unknown author";

              return (
                <li key={revision.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(revision)}
                    className="w-full rounded-default border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-surface"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {author}
                    </p>
                    <p className="font-mono text-xs text-muted">
                      {formatRevisionTime(revision.createdAt)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )
      ) : null}

      {selected && snapshot ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/20 px-4 py-8">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="landing-revision-compare-title"
            className="flex max-h-[min(90vh,820px)] w-full max-w-4xl flex-col overflow-hidden rounded-default border border-border bg-surface shadow-soft"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3
                  id="landing-revision-compare-title"
                  className="font-display text-lg font-semibold text-foreground"
                >
                  Compare revision
                </h3>
                <p className="mt-1 font-mono text-xs text-muted">
                  {formatRevisionTime(selected.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="inline-flex h-9 items-center justify-center rounded-default border border-border px-3 text-sm text-foreground"
              >
                Close
              </button>
            </div>

            <div className="grid flex-1 gap-4 overflow-auto p-5 md:grid-cols-2">
              <div className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-wider text-muted">
                  Snapshot
                </p>
                <p className="font-display text-base font-semibold text-foreground">
                  {snapshotTitle}
                </p>
                <pre className="whitespace-pre-wrap rounded-default border border-border bg-background p-3 text-sm text-foreground">
                  {typeof snapshot.layoutKind === "string"
                    ? `Layout: ${snapshot.layoutKind}`
                    : "(sections snapshot)"}
                </pre>
              </div>
              <div className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-wider text-muted">
                  Current
                </p>
                <p className="font-display text-base font-semibold text-foreground">
                  {currentTitle.trim() || "Untitled"}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="inline-flex h-10 items-center justify-center rounded-default border border-border px-4 text-sm font-medium text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={restoringId === selected.id}
                onClick={() => handleRestore(selected.id)}
                className="inline-flex h-10 items-center justify-center rounded-default bg-accent px-4 text-sm font-medium text-surface disabled:opacity-60"
              >
                {restoringId === selected.id ? "Restoring…" : "Restore"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
