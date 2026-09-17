"use client";

import { useEffect, useState } from "react";

/**
 * Delays mounting heavy client chrome until the browser is idle
 * (or after a timeout / first interaction). Keeps FCP/LCP/TBT green.
 */
export function useIdleReady(options?: {
  timeoutMs?: number;
  /** Also unlock on first pointer/scroll so UX stays snappy. */
  unlockOnInteraction?: boolean;
}) {
  const timeoutMs = options?.timeoutMs ?? 3500;
  const unlockOnInteraction = options?.unlockOnInteraction ?? true;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;

    let cancelled = false;
    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    function enable() {
      if (cancelled || ready) return;
      setReady(true);
    }

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(() => enable(), {
        timeout: timeoutMs,
      });
    } else {
      timerId = setTimeout(enable, Math.min(timeoutMs, 2500));
    }

    function onInteract() {
      enable();
    }

    if (unlockOnInteraction) {
      window.addEventListener("pointerdown", onInteract, {
        once: true,
        passive: true,
      });
      window.addEventListener("keydown", onInteract, { once: true });
      window.addEventListener("scroll", onInteract, {
        once: true,
        passive: true,
      });
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timerId !== undefined) clearTimeout(timerId);
      if (unlockOnInteraction) {
        window.removeEventListener("pointerdown", onInteract);
        window.removeEventListener("keydown", onInteract);
        window.removeEventListener("scroll", onInteract);
      }
    };
  }, [ready, timeoutMs, unlockOnInteraction]);

  return ready;
}
