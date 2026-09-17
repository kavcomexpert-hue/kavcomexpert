"use client";

import { disableDraftPreview } from "@/actions/preview";
import {
  clearClientMarkerCookie,
  DRAFT_MARKER_COOKIE,
} from "@/lib/auth/marker-cookies";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DraftPreviewBar() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [exited, setExited] = useState(false);

  function exitPreview() {
    setError(null);
    startTransition(async () => {
      try {
        clearClientMarkerCookie(DRAFT_MARKER_COOKIE);
        await disableDraftPreview();
        setExited(true);
        router.refresh();
      } catch {
        setError("Could not exit preview");
      }
    });
  }

  if (exited) return null;

  return (
    <div className="sticky top-[var(--admin-bar-offset,0px)] z-[60] border-b border-border bg-surface px-4 py-2 text-sm text-foreground shadow-soft">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3">
        <p className="font-medium">
          Previewing draft
          <span className="ml-2 font-normal text-muted">
            Visitors still see the published version.
          </span>
        </p>
        <div className="flex items-center gap-3">
          {error ? <span className="text-xs text-danger">{error}</span> : null}
          <button
            type="button"
            disabled={pending}
            onClick={exitPreview}
            className="inline-flex h-8 items-center justify-center rounded-default border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:border-accent/40 disabled:opacity-60"
          >
            {pending ? "Exiting…" : "Exit preview"}
          </button>
        </div>
      </div>
    </div>
  );
}
