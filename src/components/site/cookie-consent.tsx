"use client";

import { Analytics } from "@/components/analytics";
import type { ConsentConfig } from "@/lib/consent/defaults";
import Link from "next/link";
import { useCallback, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "kavcom-cookie-consent-v1";
const OPEN_EVENT = "kavcom:open-cookie-preferences";

type ConsentChoice = "accepted" | "declined";

type StoredConsent = {
  choice: ConsentChoice;
  expiresAt: number;
};

function ttlMs(days: number) {
  return Math.max(1, days) * 24 * 60 * 60 * 1000;
}

function readConsent(): ConsentChoice | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (
      !parsed ||
      (parsed.choice !== "accepted" && parsed.choice !== "declined") ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }
    if (parsed.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.choice;
  } catch {
    return null;
  }
}

function writeConsent(choice: ConsentChoice, days: number) {
  const payload: StoredConsent = {
    choice,
    expiresAt: Date.now() + ttlMs(days),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function subscribeConsent(onStoreChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY || event.key === null) {
      onStoreChange();
    }
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener(OPEN_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(OPEN_EVENT, onStoreChange);
  };
}

let preferencesRequested = false;
const preferencesListeners = new Set<() => void>();

function subscribePreferences(onStoreChange: () => void) {
  preferencesListeners.add(onStoreChange);
  window.addEventListener(OPEN_EVENT, onStoreChange);
  return () => {
    preferencesListeners.delete(onStoreChange);
    window.removeEventListener(OPEN_EVENT, onStoreChange);
  };
}

function getPreferencesRequested() {
  return preferencesRequested;
}

export function openCookiePreferences() {
  preferencesRequested = true;
  window.dispatchEvent(new Event(OPEN_EVENT));
  for (const listener of preferencesListeners) {
    listener();
  }
}

export function CookieConsent({
  ga4Id,
  clarityId,
  consent,
}: {
  ga4Id?: string | null;
  clarityId?: string | null;
  consent: ConsentConfig;
}) {
  const storedChoice = useSyncExternalStore(
    subscribeConsent,
    readConsent,
    () => null,
  );
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const preferencesOpen = useSyncExternalStore(
    subscribePreferences,
    getPreferencesRequested,
    () => false,
  );
  const [localChoice, setLocalChoice] = useState<ConsentChoice | null>(null);

  const choice = localChoice ?? storedChoice;

  const decide = useCallback(
    (next: ConsentChoice) => {
      writeConsent(next, consent.reshowAfterDays);
      preferencesRequested = false;
      setLocalChoice(next);
      for (const listener of preferencesListeners) {
        listener();
      }
    },
    [consent.reshowAfterDays],
  );

  // Analytics always load for every visitor. Banner is optional UI only.
  if (!consent.enabled) {
    return <Analytics ga4Id={ga4Id} clarityId={clarityId} />;
  }

  const showBanner = ready && (preferencesOpen || choice === null);

  const shellClass =
    consent.position === "bottom-left"
      ? "fixed bottom-4 left-4 z-[70] w-[min(100vw-2rem,24rem)] rounded-default border border-border bg-surface/95 p-4 shadow-soft backdrop-blur-md"
      : "fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-surface/95 px-4 py-3 shadow-soft backdrop-blur-md";

  const innerClass =
    consent.position === "bottom-left"
      ? "flex flex-col gap-3"
      : "mx-auto flex max-w-[1120px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between";

  return (
    <>
      <Analytics ga4Id={ga4Id} clarityId={clarityId} />

      {showBanner ? (
        <div
          role="dialog"
          aria-label="Cookie preferences"
          className={shellClass}
        >
          <div className={innerClass}>
            <div className="space-y-1">
              <p className="text-sm text-muted">{consent.bannerText}</p>
              {consent.policyLinkHref ? (
                <Link
                  href={consent.policyLinkHref}
                  className="text-xs font-medium text-accent underline-offset-2 hover:underline"
                >
                  {consent.policyLinkLabel}
                </Link>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => decide("declined")}
                className="inline-flex h-9 items-center justify-center rounded-default border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:border-accent/40"
              >
                {consent.declineLabel}
              </button>
              <button
                type="button"
                onClick={() => decide("accepted")}
                className="inline-flex h-9 items-center justify-center rounded-default bg-accent px-4 text-sm font-medium text-surface transition-opacity hover:opacity-90"
              >
                {consent.acceptLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
