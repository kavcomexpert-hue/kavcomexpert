"use client";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motion } from "motion/react";
import type { ReactNode } from "react";

type LiquidBlobProps = {
  className?: string;
  variant?: "accent" | "lime" | "muted";
  size?: number;
  delay?: number;
};

const variants = {
  accent: "bg-accent/20 dark:bg-accent/15",
  lime: "bg-accent-lime/25 dark:bg-accent-lime/15",
  muted: "bg-border/40",
};

export function LiquidBlob({
  className = "",
  variant = "accent",
  size = 280,
  delay = 0,
}: LiquidBlobProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      className={`liquid-blob-shape absolute blur-2xl ${variants[variant]} ${className}`}
      style={{ width: size, height: size }}
      animate={
        reducedMotion
          ? undefined
          : {
              scale: [1, 1.08, 0.96, 1],
              rotate: [0, 8, -6, 0],
            }
      }
      transition={{
        duration: 10,
        ease: "easeInOut",
        repeat: Infinity,
        delay,
      }}
    />
  );
}

type LiquidIconProps = {
  children: ReactNode;
  className?: string;
};

export function LiquidIcon({ children, className = "" }: LiquidIconProps) {
  return (
    <div
      className={`relative size-14 shrink-0 overflow-hidden rounded-[1.125rem] border border-border bg-surface ${className}`}
    >
      <div
        aria-hidden="true"
        className="absolute -inset-1 bg-accent/15 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
        style={{ borderRadius: "40% 60% 55% 45% / 55% 45% 60% 40%" }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-[58%] translate-y-full rounded-t-[50%] bg-accent-lime/35 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
      />
      <div className="relative z-10 flex size-full items-center justify-center text-accent">
        {children}
      </div>
    </div>
  );
}

export const blobPathA =
  "M120,20 C200,10 260,60 280,130 C300,200 250,260 170,280 C90,300 30,240 20,160 C10,80 50,30 120,20 Z";

export const blobPathB =
  "M130,25 C210,5 270,70 285,145 C300,220 230,275 150,285 C70,295 15,230 25,150 C35,70 70,40 130,25 Z";

export const blobPathC =
  "M115,30 C195,15 255,75 275,150 C295,225 240,270 160,278 C80,286 25,220 30,140 C35,60 55,40 115,30 Z";
