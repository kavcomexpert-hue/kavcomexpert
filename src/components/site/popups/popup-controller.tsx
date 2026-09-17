"use client";

import { SafeImage } from "@/components/site/safe-image";

import { submitLeadCapture } from "@/actions/lead-capture";
import {
  HoneypotFields,
  useFormStartedAt,
} from "@/components/site/form-spam-fields";
import { motionEase } from "@/components/site/motion/reveal";
import {
  TurnstileWidget,
  type TurnstileHandle,
} from "@/components/site/turnstile-widget";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { PublicPopup } from "@/lib/queries/popups";
import {
  isTurnstileClientEnabled,
  TURNSTILE_FAILURE_MESSAGE,
} from "@/lib/security/turnstile-config";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

function storageKey(id: string) {
  return `kavcom-popup-${id}`;
}

function matchesPage(pathname: string, patterns: string[] | undefined): boolean {
  if (!patterns || patterns.length === 0) return true;

  return patterns.some((pattern) => {
    const normalized = pattern.trim();
    if (!normalized) return false;
    if (normalized.endsWith("*")) {
      const prefix = normalized.slice(0, -1);
      const exactPrefix = prefix.replace(/\/$/, "");
      return pathname === exactPrefix || pathname.startsWith(prefix);
    }
    return pathname === normalized;
  });
}

function isDesktopDevice(): boolean {
  return window.matchMedia("(min-width: 768px) and (pointer: fine)").matches;
}

function matchesDevice(
  devices: "all" | "desktop" | "mobile" | undefined,
): boolean {
  if (!devices || devices === "all") return true;
  const desktop = isDesktopDevice();
  return devices === "desktop" ? desktop : !desktop;
}

function hasSeenPopup(id: string, frequency: string): boolean {
  if (frequency === "every-visit" || frequency === "always") return false;
  const key = storageKey(id);
  if (
    frequency === "once-per-visitor-30d" ||
    frequency === "once-per-visitor"
  ) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      if (raw === "1") return true;
      const parsed = JSON.parse(raw) as { expiresAt?: number };
      if (typeof parsed.expiresAt === "number") {
        if (parsed.expiresAt < Date.now()) {
          localStorage.removeItem(key);
          return false;
        }
        return true;
      }
      return true;
    } catch {
      return localStorage.getItem(key) === "1";
    }
  }
  return sessionStorage.getItem(key) === "1";
}

function markSeen(id: string, frequency: string) {
  if (frequency === "every-visit" || frequency === "always") return;
  const key = storageKey(id);
  if (
    frequency === "once-per-visitor-30d" ||
    frequency === "once-per-visitor"
  ) {
    localStorage.setItem(
      key,
      JSON.stringify({ expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 }),
    );
    return;
  }
  sessionStorage.setItem(key, "1");
}

function isModalType(type: string) {
  return type === "exit-intent" || type === "timed";
}

function readPreviewId(): string | null {
  try {
    return new URLSearchParams(window.location.search).get("popupPreview");
  } catch {
    return null;
  }
}

function armTrigger(
  popup: PublicPopup,
  show: (popup: PublicPopup) => void,
): () => void {
  const type = popup.type;
  const delaySeconds = popup.trigger.delaySeconds ?? 5;
  const scrollPercent = popup.trigger.scrollPercent ?? 60;

  if (type === "exit-intent") {
    const handleMouseLeave = (event: MouseEvent) => {
      if (!isDesktopDevice()) return;
      if (event.clientY <= 0) {
        show(popup);
      }
    };
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }

  const useTimed =
    type === "timed" ||
    (type === "slide-in" &&
      popup.trigger.delaySeconds != null &&
      popup.trigger.scrollPercent == null);

  if (useTimed) {
    const timer = window.setTimeout(
      () => show(popup),
      Math.max(0, delaySeconds) * 1000,
    );
    return () => window.clearTimeout(timer);
  }

  // scroll-percentage, slide-in (scroll), or any remaining type with scroll
  const threshold = Math.min(100, Math.max(0, scrollPercent)) / 100;
  const handleScroll = () => {
    const scrollable =
      document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) {
      show(popup);
      return;
    }
    if (window.scrollY / scrollable >= threshold) {
      show(popup);
    }
  };
  handleScroll();
  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}

type PopupControllerProps = {
  popups: PublicPopup[];
  turnstileSiteKey?: string;
};

export function PopupController({
  popups,
  turnstileSiteKey,
}: PopupControllerProps) {
  const reducedMotion = useReducedMotion();
  const titleId = useId();
  const { markStarted, getStartedAt } = useFormStartedAt();
  const [active, setActive] = useState<PublicPopup | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const claimedRef = useRef(false);
  const turnstileRef = useRef<TurnstileHandle>(null);

  useEffect(() => {
    if (popups.length === 0) return;

    const previewId = readPreviewId();
    const pathname = window.location.pathname;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    function show(popup: PublicPopup, isPreview: boolean) {
      if (cancelled || claimedRef.current) return;
      claimedRef.current = true;
      if (!isPreview) {
        markSeen(popup.id, popup.frequency);
      }
      markStarted();
      setActive(popup);
      cleanup?.();
      cleanup = undefined;
    }

    if (previewId) {
      const previewPopup = popups.find((popup) => popup.id === previewId);
      if (previewPopup) {
        show(previewPopup, true);
        return () => {
          cancelled = true;
        };
      }
    }

    const candidate = popups.find(
      (popup) =>
        matchesPage(pathname, popup.audience.pages) &&
        matchesDevice(popup.audience.devices) &&
        !hasSeenPopup(popup.id, popup.frequency),
    );

    if (candidate) {
      cleanup = armTrigger(candidate, (popup) => show(popup, false));
    }

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [popups, markStarted]);

  useEffect(() => {
    if (!active) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(null);
        setError(null);
        setSubmitted(false);
        setEmail("");
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active]);

  function dismiss() {
    setActive(null);
    setError(null);
    setSubmitted(false);
    setEmail("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active) return;

    setLoading(true);
    setError(null);

    const form = event.currentTarget;
    const honeypot = new FormData(form).get("website");
    const source =
      active.content.formSource?.trim() || `popup:${active.name}`;

    let turnstileToken: string | undefined;
    if (isTurnstileClientEnabled(turnstileSiteKey)) {
      const token = await turnstileRef.current?.getTokenForSubmit();
      if (!token) {
        turnstileRef.current?.reset();
        setLoading(false);
        setError(TURNSTILE_FAILURE_MESSAGE);
        return;
      }
      turnstileToken = token;
    }

    const result = await submitLeadCapture({
      email,
      source,
      message: `Popup: ${active.content.heading}`,
      website: typeof honeypot === "string" ? honeypot : "",
      formStartedAt: getStartedAt(),
      turnstileToken,
    });

    setLoading(false);
    turnstileRef.current?.reset();

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSubmitted(true);
    window.setTimeout(() => dismiss(), 2200);
  }

  const content = active?.content;
  const modal = active ? isModalType(active.type) : true;
  const ctaLabel =
    content?.ctaLabel || (content?.formEnabled ? "Submit" : "Learn more");

  const inner =
    active && content ? (
      submitted ? (
        <div role="status" className="pr-8">
          <p className="font-display text-xl font-semibold tracking-tight text-foreground">
            Thanks
          </p>
          <p className="mt-2 text-sm text-muted">We will be in touch shortly.</p>
        </div>
      ) : (
        <>
          {content.imageUrl ? (
            <div
              className={`relative mb-3 overflow-hidden rounded-default border border-border ${
                modal ? "aspect-[16/9]" : "aspect-[4/3]"
              }`}
            >
              <SafeImage
                src={content.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes={modal ? "28rem" : "18rem"}
              />
            </div>
          ) : null}

          {modal ? (
            <p className="font-mono text-xs uppercase tracking-wider text-muted">
              Offer
            </p>
          ) : null}

          <h2
            id={titleId}
            className={`pr-8 font-display font-semibold tracking-tight text-foreground ${
              modal ? "mt-2 text-2xl" : "text-base"
            }`}
          >
            {content.heading}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{content.body}</p>

          {content.formEnabled ? (
            <form onSubmit={handleSubmit} className="relative mt-4 space-y-3">
              <HoneypotFields />
              <div className="space-y-2">
                <label
                  htmlFor={`${titleId}-email`}
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <input
                  id={`${titleId}-email`}
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 w-full rounded-default border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  autoComplete="email"
                />
              </div>
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <TurnstileWidget ref={turnstileRef} siteKey={turnstileSiteKey} />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending…" : ctaLabel}
              </button>
            </form>
          ) : content.ctaHref ? (
            <Link
              href={content.ctaHref}
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full bg-accent px-4 text-sm font-medium text-surface transition-opacity hover:opacity-90"
              onClick={dismiss}
            >
              {ctaLabel}
            </Link>
          ) : null}
        </>
      )
    ) : null;

  return (
    <AnimatePresence>
      {active && content && modal ? (
        <motion.div
          key={`modal-${active.id}`}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.25, ease: motionEase }}
          role="presentation"
        >
          <button
            type="button"
            aria-label="Dismiss offer"
            className="absolute inset-0 bg-background/70 backdrop-blur-[2px]"
            onClick={dismiss}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-md rounded-default border border-border bg-surface p-6 shadow-soft dark:shadow-glow"
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: 8 }}
            transition={{
              duration: reducedMotion ? 0 : 0.35,
              ease: motionEase,
            }}
          >
            <button
              type="button"
              onClick={dismiss}
              className="absolute right-4 top-4 text-sm text-muted transition-colors hover:text-foreground"
              aria-label="Close"
            >
              ✕
            </button>
            {inner}
          </motion.div>
        </motion.div>
      ) : null}

      {active && content && !modal ? (
        <motion.aside
          key={`slide-${active.id}`}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className="fixed bottom-5 right-5 z-40 w-[min(100vw-2.5rem,18rem)] rounded-default border border-border bg-surface p-4 shadow-soft dark:shadow-glow"
          initial={reducedMotion ? false : { opacity: 0, y: 16, x: 8 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: 8 }}
          transition={{ duration: reducedMotion ? 0 : 0.4, ease: motionEase }}
        >
          <button
            type="button"
            onClick={dismiss}
            className="absolute right-3 top-3 text-xs text-muted transition-colors hover:text-foreground"
            aria-label="Dismiss"
          >
            ✕
          </button>
          {inner}
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
