"use client";

import { useEffect, useRef } from "react";

/** Default: 60s, and only when payload actually changed (idle editors = zero requests). */
export const EDITOR_AUTOSAVE_INTERVAL_MS = 60_000;

type AutosaveResult = { success: boolean } | void;

type UseEditorAutosaveOptions = {
  enabled: boolean;
  /** Current form snapshot; return null to skip this tick. */
  getPayload: () => Record<string, unknown> | null;
  save: (payload: Record<string, unknown>) => Promise<AutosaveResult>;
  isBusy?: () => boolean;
  onSuccess?: () => void;
  intervalMs?: number;
};

/**
 * Interval autosave that skips when:
 * - the tab is hidden
 * - a manual save is in flight
 * - the payload is unchanged since the last successful save
 */
export function useEditorAutosave({
  enabled,
  getPayload,
  save,
  isBusy,
  onSuccess,
  intervalMs = EDITOR_AUTOSAVE_INTERVAL_MS,
}: UseEditorAutosaveOptions) {
  const lastSavedJson = useRef<string | null>(null);
  const getPayloadRef = useRef(getPayload);
  const saveRef = useRef(save);
  const isBusyRef = useRef(isBusy);
  const onSuccessRef = useRef(onSuccess);

  getPayloadRef.current = getPayload;
  saveRef.current = save;
  isBusyRef.current = isBusy;
  onSuccessRef.current = onSuccess;

  /** Call after a successful manual save so the next tick does not re-write. */
  function markSaved(payload?: Record<string, unknown> | null) {
    const next = payload ?? getPayloadRef.current();
    if (next) {
      lastSavedJson.current = stableStringify(next);
    }
  }

  useEffect(() => {
    if (!enabled) return;

    // Baseline = current form so an idle open editor never fires until edits.
    try {
      const initial = getPayloadRef.current();
      if (initial) {
        lastSavedJson.current = stableStringify(initial);
      }
    } catch {
      // Ignore baseline failures; first successful save will set the ref.
    }

    const id = window.setInterval(() => {
      void (async () => {
        if (typeof document !== "undefined" && document.visibilityState === "hidden") {
          return;
        }
        if (isBusyRef.current?.()) return;

        let payload: Record<string, unknown> | null;
        try {
          payload = getPayloadRef.current();
        } catch {
          return;
        }
        if (!payload) return;

        const json = stableStringify(payload);
        if (json === lastSavedJson.current) return;

        const result = await saveRef.current(payload);
        if (result && result.success === false) return;

        lastSavedJson.current = json;
        onSuccessRef.current?.();
      })();
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [enabled, intervalMs]);

  return { markSaved };
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value);
}
