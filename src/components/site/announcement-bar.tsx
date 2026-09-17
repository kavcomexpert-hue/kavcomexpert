"use client";

import { X } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "kavcom-announcement-dismissed";

type AnnouncementBarProps = {
  text: string;
};

function getDismissedSnapshot() {
  return sessionStorage.getItem(STORAGE_KEY) === "1";
}

function getServerDismissedSnapshot() {
  return false;
}

function subscribe() {
  return () => {};
}

export function AnnouncementBar({ text }: AnnouncementBarProps) {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const storedDismissed = useSyncExternalStore(
    subscribe,
    getDismissedSnapshot,
    getServerDismissedSnapshot,
  );

  const [dismissedNow, setDismissedNow] = useState(false);
  const dismissed = storedDismissed || dismissedNow;

  // Render on SSR so first paint reserves height (avoids CLS). Hide after
  // hydrate only when the visitor already dismissed this session.
  if (mounted && dismissed) {
    return null;
  }

  function handleDismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setDismissedNow(true);
  }

  return (
    <div className="relative bg-accent px-6 py-2.5 text-center text-sm text-surface">
      <p className="mx-auto max-w-[1120px] pr-8 leading-snug">{text}</p>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        className="absolute right-4 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-surface/80 transition-colors hover:bg-surface/10 hover:text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface/50"
      >
            <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  );
}
