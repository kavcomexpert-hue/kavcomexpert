"use client";

import { ServiceHeroIllustration } from "@/components/site/service-page/service-hero-illustration";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useIdleReady } from "@/hooks/use-idle-ready";
import dynamic from "next/dynamic";
import { Component, type ReactNode, useState } from "react";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => <SplinePlaceholder />,
});

type ServiceHeroSplineProps = {
  scene: string;
  slug: string;
  platformLabel: string;
  tags: readonly string[];
};

function SplinePlaceholder() {
  return (
    <div
      className="absolute inset-0 animate-pulse bg-surface"
      aria-hidden="true"
      style={{
        backgroundImage:
          "radial-gradient(circle at 30% 20%, var(--accent) 0%, transparent 42%), radial-gradient(circle at 80% 70%, var(--accent-lime) 0%, transparent 36%)",
        opacity: 0.35,
      }}
    />
  );
}

class SplineErrorBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/**
 * Replaces the service hero card with a Spline scene in the same footprint.
 * Falls back to the illustration when motion is reduced or the scene fails.
 */
export function ServiceHeroSpline({
  scene,
  slug,
  platformLabel,
  tags,
}: ServiceHeroSplineProps) {
  const reducedMotion = useReducedMotion();
  const ready = useIdleReady({ timeoutMs: 2000, unlockOnInteraction: true });
  const [failed, setFailed] = useState(false);

  if (reducedMotion || failed) {
    return (
      <ServiceHeroIllustration
        slug={slug}
        platformLabel={platformLabel}
        tags={tags}
      />
    );
  }

  return (
    <div className="relative aspect-square overflow-hidden bg-transparent">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, var(--accent) 0%, transparent 42%), radial-gradient(circle at 80% 70%, var(--accent-lime) 0%, transparent 36%)",
        }}
      />
      {!ready ? (
        <SplinePlaceholder />
      ) : (
        <SplineErrorBoundary onError={() => setFailed(true)}>
          <Spline
            scene={scene}
            className="absolute inset-0 size-full"
            style={{ width: "100%", height: "100%" }}
            renderOnDemand
          />
        </SplineErrorBoundary>
      )}
      <span className="sr-only">
        Interactive 3D illustration for {platformLabel}
      </span>
    </div>
  );
}
