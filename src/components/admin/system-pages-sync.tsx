"use client";

import { syncSystemPagesAction } from "@/actions/sync-system-pages";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SyncSummary = {
  created: number;
  published: number;
};

export function SystemPagesSyncControls({
  autoSyncResult,
}: {
  /** Non-null when auto-seed on load created or published something. */
  autoSyncResult?: SyncSummary | null;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const showBanner =
    !dismissed &&
    autoSyncResult != null &&
    (autoSyncResult.created > 0 || autoSyncResult.published > 0);

  async function handleSync() {
    if (
      !window.confirm(
        "Sync system pages? This creates any missing core pages (Home, About, Contact, etc.) and publishes draft system pages. Existing titles and content are not overwritten.",
      )
    ) {
      return;
    }

    setBusy(true);
    const result = await syncSystemPagesAction();
    setBusy(false);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    if (result.created === 0 && result.published === 0) {
      toast("System pages already up to date");
    } else {
      const parts: string[] = [];
      if (result.created > 0) parts.push(`${result.created} created`);
      if (result.published > 0) parts.push(`${result.published} published`);
      toast(`System pages synced (${parts.join(", ")})`);
    }
    router.refresh();
  }

  return (
    <div className="mb-4 space-y-3">
      {showBanner ? (
        <div className="flex flex-col gap-2 rounded-default border border-accent/30 bg-accent/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground">
            System pages synced
            {autoSyncResult
              ? ` — ${autoSyncResult.created} created, ${autoSyncResult.published} published`
              : ""}
            .
          </p>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-sm font-medium text-muted hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      ) : null}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleSync()}
          className="inline-flex h-9 items-center justify-center rounded-default border border-border bg-background px-4 text-sm font-medium text-foreground disabled:opacity-50"
        >
          {busy ? "Syncing…" : "Sync system pages"}
        </button>
      </div>
    </div>
  );
}
