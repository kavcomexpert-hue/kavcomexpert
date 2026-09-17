"use client";

import { motionEase } from "@/components/site/motion/reveal";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type BlurRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Extra px of upward travel. Defaults to 24. */
  y?: number;
  /** Play immediately on mount instead of when scrolled into view. */
  onMount?: boolean;
  as?: "div" | "li" | "article" | "span";
};

/**
 * Entrance reveal that paints fully visible on SSR / first paint.
 * Below-the-fold blocks still animate in after hydrate; in-view blocks
 * never flash to opacity 0.
 */
export function BlurReveal({
  children,
  className,
  delay = 0,
  y = 24,
  onMount = false,
  as = "div",
}: BlurRevealProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
  const [mode, setMode] = useState<"static" | "motion" | "pending">("pending");
  const Component = motion[as];

  useEffect(() => {
    // Decide in a frame callback (not synchronously in the effect) so React
    // doesn't cascade renders; visual result is identical.
    const frame = requestAnimationFrame(() => {
      if (reducedMotion) {
        setMode("static");
        return;
      }

      if (onMount) {
        setMode("motion");
        return;
      }

      const el = ref.current;
      if (!el) {
        setMode("static");
        return;
      }

      const rect = el.getBoundingClientRect();
      const alreadyVisible =
        rect.bottom > 0 && rect.top < window.innerHeight * 0.92;

      // Already on screen: keep painted, skip opacity:0 initial state.
      setMode(alreadyVisible ? "static" : "motion");
    });

    return () => cancelAnimationFrame(frame);
  }, [reducedMotion, onMount]);

  if (mode === "pending" || mode === "static" || reducedMotion) {
    return (
      <Component
        ref={ref as never}
        className={className}
      >
        {children}
      </Component>
    );
  }

  const hidden = { opacity: 0, y, filter: "blur(14px)" };
  const visible = { opacity: 1, y: 0, filter: "blur(0px)" };

  return (
    <Component
      ref={ref as never}
      className={className}
      initial={onMount ? hidden : hidden}
      {...(onMount
        ? { animate: visible }
        : {
            whileInView: visible,
            viewport: { once: true, margin: "-10% 0px" },
          })}
      transition={{ duration: 0.8, ease: motionEase, delay }}
    >
      {children}
    </Component>
  );
}
