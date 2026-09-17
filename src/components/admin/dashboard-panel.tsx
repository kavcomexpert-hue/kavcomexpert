"use client";

import { ChevronDown } from "lucide-react";
import { useState, useSyncExternalStore, type ReactNode } from "react";

type DashboardPanelProps = {
  title: string;
  children: ReactNode;
  /** Start expanded (default true). */
  defaultOpen?: boolean;
  storageKey?: string;
};

function readStoredOpen(storageKey: string | undefined, fallback: boolean) {
  if (!storageKey || typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(`admin-dash-${storageKey}`);
    if (stored === "0") return false;
    if (stored === "1") return true;
  } catch {
    /* ignore */
  }
  return fallback;
}

function subscribeToStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export function DashboardPanel({
  title,
  children,
  defaultOpen = true,
  storageKey,
}: DashboardPanelProps) {
  const storedOpen = useSyncExternalStore(
    subscribeToStorage,
    () => readStoredOpen(storageKey, defaultOpen),
    () => defaultOpen,
  );
  const [override, setOverride] = useState<boolean | null>(null);
  const open = override ?? storedOpen;

  function toggle() {
    const next = !open;
    setOverride(next);
    if (storageKey) {
      try {
        localStorage.setItem(`admin-dash-${storageKey}`, next ? "1" : "0");
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <section className="border border-border bg-surface">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 border-b border-border px-4 py-2.5 text-left transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
      >
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <ChevronDown
          className={`size-4 shrink-0 text-muted transition-transform ${
            open ? "rotate-0" : "-rotate-90"
          }`}
          aria-hidden="true"
        />
      </button>
      {open ? <div className="p-4">{children}</div> : null}
    </section>
  );
}
