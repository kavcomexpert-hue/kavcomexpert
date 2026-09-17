"use client";

import { honeypotFieldClassName } from "@/lib/security/form-spam";
import { useCallback, useRef } from "react";

/** Visually hidden honeypot — any filled value is treated as spam. */
export function HoneypotFields() {
  return (
    <div className={honeypotFieldClassName} aria-hidden="true">
      <label htmlFor="website">Website</label>
      <input
        id="website"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
}

/**
 * Tracks when the form became interactive. Call `markStarted` on open/focus;
 * call `getStartedAt` only from submit handlers (not during render).
 */
export function useFormStartedAt() {
  const startedAtRef = useRef<number | null>(null);

  const markStarted = useCallback(() => {
    if (startedAtRef.current == null) {
      startedAtRef.current = Date.now();
    }
  }, []);

  const getStartedAt = useCallback(() => {
    if (startedAtRef.current == null) {
      startedAtRef.current = Date.now();
    }
    return startedAtRef.current;
  }, []);

  return { markStarted, getStartedAt };
}
