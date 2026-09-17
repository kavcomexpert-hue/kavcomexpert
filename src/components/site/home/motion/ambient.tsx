"use client";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

type AmbientProps = {
  /** Mirror the layout horizontally so adjacent sections don't repeat. */
  flip?: boolean;
};

/**
 * Slow-drifting decorative layer placed behind section content.
 * Parent section must be `relative overflow-clip`.
 * Animations only run while the section is near the viewport.
 */
export function Ambient({ flip = false }: AmbientProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "20% 0px 20% 0px" });

  if (reducedMotion) {
    return null;
  }

  if (!inView) {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      />
    );
  }

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${
        flip ? "-scale-x-100" : ""
      }`}
    >
      {/* Drifting color blobs */}
      <motion.div
        className="absolute -left-28 top-12 size-72 rounded-full bg-accent/[0.05] blur-3xl"
        animate={{ y: [0, 48, 0], x: [0, 28, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-24 bottom-8 size-80 rounded-full bg-accent-lime/[0.06] blur-3xl"
        animate={{ y: [0, -44, 0], x: [0, -20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-[38%] top-[55%] size-56 rounded-full bg-accent/[0.04] blur-3xl"
        animate={{ y: [0, 32, 0], x: [0, -36, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Rotating dashed ring with an orbiting dot */}
      <motion.div
        className="absolute right-[10%] top-[14%] size-44 rounded-full border border-dashed border-border"
        animate={{ rotate: 360 }}
        transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
      >
        <span className="absolute left-1/2 top-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/40" />
      </motion.div>

      {/* Small counter-rotating ring */}
      <motion.div
        className="absolute bottom-[24%] left-[16%] size-20 rounded-full border border-border"
        animate={{ rotate: -360, y: [0, -14, 0] }}
        transition={{
          rotate: { duration: 40, repeat: Infinity, ease: "linear" },
          y: { duration: 12, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <span className="absolute left-1/2 top-0 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-lime/50" />
      </motion.div>

      {/* Floating plus glyphs */}
      <motion.div
        className="absolute bottom-[18%] left-[6%] text-2xl font-light text-accent/20"
        animate={{ y: [0, -18, 0], rotate: [0, 90, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      >
        +
      </motion.div>
      <motion.div
        className="absolute right-[30%] top-[8%] text-lg font-light text-accent-lime/35"
        animate={{ y: [0, 14, 0], rotate: [0, -90, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      >
        +
      </motion.div>

      {/* Drifting dots */}
      <motion.span
        className="absolute left-[52%] top-[18%] size-2 rounded-full bg-accent/25"
        animate={{ y: [0, 22, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute bottom-[10%] right-[8%] size-1.5 rounded-full bg-accent-lime/40"
        animate={{ y: [0, -16, 0], x: [0, 10, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
