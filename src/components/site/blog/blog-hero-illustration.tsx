"use client";

import { motionEase } from "@/components/site/motion/reveal";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motion } from "motion/react";

const loop = { repeat: Infinity, repeatType: "loop" as const };

export function BlogHeroIllustration() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden rounded-default border border-border bg-surface p-6 shadow-soft dark:shadow-none"
    >
      <svg
        viewBox="0 0 320 240"
        className="mx-auto w-full max-w-[280px] text-muted"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Page frame */}
        <rect
          x="40"
          y="24"
          width="240"
          height="192"
          rx="8"
          className="stroke-border"
          strokeWidth="1.5"
          fill="var(--background)"
        />

        {/* Browser chrome dots */}
        <circle cx="56" cy="40" r="4" className="fill-accent/40" />
        <circle cx="72" cy="40" r="4" className="fill-accent-lime/50" />
        <circle cx="88" cy="40" r="4" className="fill-muted/30" />

        {/* Header block */}
        <motion.rect
          x="56"
          y="56"
          width="120"
          height="12"
          rx="3"
          className="fill-accent"
          initial={reducedMotion ? false : { opacity: 0, scaleX: 0 }}
          animate={{ opacity: 0.85, scaleX: 1 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 0.6, ease: motionEase, delay: 0.2 }
          }
          style={{ transformOrigin: "56px 62px" }}
        />

        {/* Text lines assembling */}
        {[0, 1, 2].map((index) => (
          <motion.rect
            key={`line-${index}`}
            x="56"
            y={80 + index * 18}
            width={index === 2 ? 140 : 168}
            height="6"
            rx="2"
            className="fill-foreground/15"
            initial={reducedMotion ? false : { opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : {
                    duration: 0.5,
                    ease: motionEase,
                    delay: 0.35 + index * 0.12,
                  }
            }
            style={{ transformOrigin: "56px center" }}
          />
        ))}

        {/* Image placeholder block */}
        <motion.rect
          x="56"
          y="142"
          width="96"
          height="58"
          rx="4"
          className="stroke-border fill-accent/10"
          strokeWidth="1"
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 0.55, ease: motionEase, delay: 0.7 }
          }
        />

        {/* Side content block */}
        <motion.rect
          x="164"
          y="142"
          width="96"
          height="28"
          rx="4"
          className="fill-foreground/10"
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 0.55, ease: motionEase, delay: 0.82 }
          }
        />
        <motion.rect
          x="164"
          y="178"
          width="96"
          height="22"
          rx="4"
          className="fill-foreground/10"
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 0.55, ease: motionEase, delay: 0.94 }
          }
        />

        {/* Gentle chart line drawing */}
        <motion.path
          d="M 200 100 L 230 88 L 252 94 L 272 72"
          className="stroke-accent"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.9 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 1.2, ease: motionEase, delay: 1.1 }
          }
        />

        {/* Chart dots */}
        {[
          [200, 100],
          [230, 88],
          [252, 94],
          [272, 72],
        ].map(([cx, cy], index) => (
          <motion.circle
            key={`dot-${index}`}
            cx={cx}
            cy={cy}
            r="3.5"
            className="fill-accent"
            initial={reducedMotion ? false : { opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : {
                    duration: 0.3,
                    ease: motionEase,
                    delay: 1.1 + index * 0.15,
                  }
            }
          />
        ))}

        {/* Subtle pulse on accent bar */}
        {!reducedMotion ? (
          <motion.rect
            x="56"
            y="56"
            width="120"
            height="12"
            rx="3"
            className="fill-accent"
            animate={{ opacity: [0.85, 0.55, 0.85] }}
            transition={{ ...loop, duration: 3.5, ease: "easeInOut", delay: 2 }}
          />
        ) : null}
      </svg>

      <p className="mt-4 text-center text-xs text-muted">
        Guides built from real client work
      </p>
    </div>
  );
}
