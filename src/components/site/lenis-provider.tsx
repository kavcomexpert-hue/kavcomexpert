"use client";

import "lenis/dist/lenis.css";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

type LenisProviderProps = {
  children: React.ReactNode;
};

let lenisInstance: Lenis | null = null;
let scrollLockCount = 0;

/** Clears the sticky header when scrolling to in-page anchors. */
export const ANCHOR_OFFSET = -96;

/**
 * Scroll to an in-page hash (#section-id). Uses Lenis when available,
 * otherwise native scrollIntoView. Always updates the URL hash.
 */
export function scrollToAnchor(
  hash: string,
  options?: { replaceHistory?: boolean },
): boolean {
  const normalized = hash.startsWith("#") ? hash : `#${hash}`;
  if (!normalized || normalized === "#") return false;

  const target = document.querySelector(normalized);
  if (!target) return false;

  if (lenisInstance) {
    lenisInstance.scrollTo(normalized, {
      offset: ANCHOR_OFFSET,
      onComplete: () => {
        lenisInstance?.resize();
      },
    });
  } else if (target instanceof HTMLElement) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (options?.replaceHistory) {
    history.replaceState(null, "", normalized);
  } else {
    history.pushState(null, "", normalized);
  }

  return true;
}

/** Stop Lenis + lock native overflow (modals, mobile nav). Supports nested locks. */
export function lockPageScroll() {
  scrollLockCount += 1;
  document.body.style.overflow = "hidden";
  lenisInstance?.stop();
}

/** Resume Lenis when the last lock is released. */
export function unlockPageScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount > 0) {
    return;
  }

  document.body.style.overflow = "";
  lenisInstance?.start();
}

function shouldSkipLenis() {
  // Native scroll is smoother and cheaper on phones — big TBT/LCP win.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return true;
  }
  if (window.matchMedia("(max-width: 1023px)").matches) {
    return true;
  }
  if (window.matchMedia("(pointer: coarse)").matches) {
    return true;
  }
  return false;
}

export function LenisProvider({ children }: LenisProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (shouldSkipLenis()) {
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    let started = false;

    function startLenis() {
      if (cancelled || started || shouldSkipLenis()) return;
      started = true;

      const lenis = new Lenis({
        duration: 1.1,
        smoothWheel: true,
        allowNestedScroll: true,
        stopInertiaOnNavigate: true,
        anchors: false,
      });

      lenisInstance = lenis;

      if (scrollLockCount > 0) {
        lenis.stop();
      }

      let frameId = 0;

      function onFrame(time: number) {
        lenis.raf(time);
        frameId = requestAnimationFrame(onFrame);
      }

      frameId = requestAnimationFrame(onFrame);

      function scrollToHash(hash: string, replaceHistory = false) {
        scrollToAnchor(hash, { replaceHistory });
      }

      function onAnchorClick(event: MouseEvent) {
        const anchor = (event.target as Element | null)?.closest?.("a[href]");
        if (!(anchor instanceof HTMLAnchorElement)) {
          return;
        }

        let url: URL;
        try {
          url = new URL(anchor.href, window.location.href);
        } catch {
          return;
        }

        if (url.origin !== window.location.origin) {
          return;
        }
        if (url.pathname !== window.location.pathname) {
          return;
        }
        if (!url.hash || url.hash === "#") {
          return;
        }

        const target = document.querySelector(url.hash);
        if (!target) {
          return;
        }

        event.preventDefault();
        scrollToHash(url.hash);
      }

      document.addEventListener("click", onAnchorClick, true);

      if (window.location.hash) {
        const hash = window.location.hash;
        requestAnimationFrame(() => {
          lenis.resize();
          scrollToHash(hash, true);
        });
      }

      function onSkipLinkClick(event: Event) {
        const target = event.target as HTMLElement | null;
        if (!target?.closest?.('a[href="#main-content"]')) {
          return;
        }

        document.getElementById("main-content")?.focus({ preventScroll: true });
      }

      document.addEventListener("click", onSkipLinkClick);

      function onResize() {
        lenis.resize();
      }

      window.addEventListener("resize", onResize);
      window.addEventListener("load", onResize);

      const resizeObserver = new ResizeObserver(() => {
        lenis.resize();
      });
      resizeObserver.observe(document.documentElement);

      cleanup = () => {
        document.removeEventListener("click", onAnchorClick, true);
        document.removeEventListener("click", onSkipLinkClick);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("load", onResize);
        resizeObserver.disconnect();
        cancelAnimationFrame(frameId);
        lenis.destroy();
        if (lenisInstance === lenis) {
          lenisInstance = null;
        }
      };
    }

    // Defer Lenis so it never blocks first paint / LCP.
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(() => startLenis(), {
        timeout: 3000,
      });
    } else {
      timerId = setTimeout(startLenis, 2000);
    }

    function onEarlyInteract() {
      startLenis();
    }

    window.addEventListener("wheel", onEarlyInteract, {
      once: true,
      passive: true,
    });
    window.addEventListener("pointerdown", onEarlyInteract, {
      once: true,
      passive: true,
    });

    return () => {
      cancelled = true;
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timerId !== undefined) clearTimeout(timerId);
      window.removeEventListener("wheel", onEarlyInteract);
      window.removeEventListener("pointerdown", onEarlyInteract);
      cleanup?.();
    };
  }, []);

  useEffect(() => {
    if (!lenisInstance) {
      return;
    }

    const id = requestAnimationFrame(() => {
      lenisInstance?.resize();
    });

    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return children;
}
