"use client";

import { useIdleReady } from "@/hooks/use-idle-ready";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useEffect, useRef, useState } from "react";
import type { AnimationItem } from "lottie-web";

type ServiceHeroLottieProps = {
  /** Same-origin URL serving the Lottie JSON (see /api/lottie). */
  src: string;
  label: string;
};

/**
 * Client Lottie player. Fetches the JSON from a same-origin proxy and
 * renders with the lottie_light build (SVG only, no expressions engine),
 * keeping the animation payload out of the server-rendered document.
 */
export function ServiceHeroLottie({ src, label }: ServiceHeroLottieProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();
  // Building the SVG DOM for large animations blocks the main thread for
  // hundreds of ms; wait for idle so hydration and input stay responsive.
  const idleReady = useIdleReady();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!idleReady) return;
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let animation: AnimationItem | null = null;

    void (async () => {
      try {
        const [{ default: lottie }, res] = await Promise.all([
          import("lottie-web/build/player/lottie_light"),
          fetch(src, { headers: { Accept: "application/json" } }),
        ]);
        if (!res.ok) throw new Error(`Lottie fetch failed (${res.status})`);
        const animationData: unknown = await res.json();
        if (cancelled) return;

        animation = lottie.loadAnimation({
          container,
          renderer: "svg",
          loop: !reducedMotion,
          autoplay: !reducedMotion,
          animationData: animationData as object,
          rendererSettings: {
            preserveAspectRatio: "xMidYMid meet",
          },
        });
      } catch (error) {
        console.warn("[service-hero-lottie]", src, error);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      animation?.destroy();
    };
  }, [src, reducedMotion, idleReady]);

  if (failed) {
    return (
      <div className="relative flex aspect-square w-full items-center justify-center">
        <p className="text-sm text-muted">Unable to load animation</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full bg-transparent">
      <div
        ref={containerRef}
        className="size-full bg-transparent"
        style={{ background: "transparent", width: "100%", height: "100%" }}
        aria-label={label}
        role="img"
      />
    </div>
  );
}
