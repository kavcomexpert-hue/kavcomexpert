"use client";

import { motionEase } from "@/components/site/motion/reveal";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motion } from "motion/react";
import type { ComponentType } from "react";

export type ServiceIllustrationTheme =
  | "browser"
  | "storefront"
  | "chart"
  | "timeline"
  | "chat";

const loop = { repeat: Infinity, repeatType: "loop" as const };

export function resolveServiceIllustrationTheme(
  slug: string,
): ServiceIllustrationTheme {
  const s = slug.toLowerCase();

  if (s.includes("video")) return "timeline";
  if (s.includes("virtual") || s.includes("-va")) return "chat";

  if (
    s.includes("marketing") ||
    s.includes("seo") ||
    s.includes("ads") ||
    s.includes("social")
  ) {
    return "chart";
  }

  if (
    (s.includes("commerce") || s.includes("ecommerce") || s.includes("e-commerce")) &&
    !s.includes("woocommerce")
  ) {
    return "storefront";
  }

  if (
    s.includes("wordpress") ||
    s.includes("development") ||
    s.includes("magento") ||
    s.includes("shopify") ||
    s.includes("woocommerce") ||
    s.includes("full-stack") ||
    s.includes("migration") ||
    s.includes("ios-app") ||
    s.includes("android-app")
  ) {
    return "browser";
  }

  return "browser";
}

function BrowserIllustration({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <rect
        x="48"
        y="32"
        width="224"
        height="176"
        rx="10"
        className="stroke-border fill-background"
        strokeWidth="1.5"
      />
      <circle cx="68" cy="50" r="4" className="fill-accent/40" />
      <circle cx="84" cy="50" r="4" className="fill-accent-lime/50" />
      <circle cx="100" cy="50" r="4" className="fill-muted/30" />
      {[0, 1, 2].map((index) => (
        <motion.rect
          key={index}
          x="68"
          y={68 + index * 22}
          width={index === 0 ? 120 : 160}
          height="8"
          rx="2"
          className={index === 0 ? "fill-accent" : "fill-foreground/12"}
          initial={reducedMotion ? false : { opacity: 0, scaleX: 0 }}
          animate={{ opacity: index === 0 ? 0.85 : 1, scaleX: 1 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 0.5, ease: motionEase, delay: 0.15 + index * 0.1 }
          }
          style={{ transformOrigin: "68px center" }}
        />
      ))}
      <motion.rect
        x="68"
        y="138"
        width="80"
        height="52"
        rx="4"
        className="stroke-border fill-accent/10"
        strokeWidth="1"
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 0.5, ease: motionEase, delay: 0.5 }
        }
      />
      <motion.rect
        x="160"
        y="138"
        width="88"
        height="24"
        rx="4"
        className="fill-foreground/10"
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 0.5, ease: motionEase, delay: 0.62 }
        }
      />
      {!reducedMotion ? (
        <motion.rect
          x="68"
          y="68"
          width="120"
          height="8"
          rx="2"
          className="fill-accent"
          animate={{ opacity: [0.85, 0.5, 0.85] }}
          transition={{ ...loop, duration: 3, ease: "easeInOut", delay: 1.2 }}
        />
      ) : null}
    </>
  );
}

function StorefrontIllustration({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <rect
        x="72"
        y="88"
        width="176"
        height="112"
        rx="4"
        className="stroke-border fill-background"
        strokeWidth="1.5"
      />
      <motion.path
        d="M 72 88 L 160 56 L 248 88 Z"
        className="fill-accent/20 stroke-accent"
        strokeWidth="1.5"
        strokeLinejoin="round"
        initial={reducedMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 0.55, ease: motionEase, delay: 0.1 }
        }
      />
      <motion.rect
        x="108"
        y="130"
        width="48"
        height="70"
        rx="2"
        className="fill-accent/30 stroke-accent"
        strokeWidth="1"
        initial={reducedMotion ? false : { opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 0.5, ease: motionEase, delay: 0.35 }
        }
        style={{ transformOrigin: "132px 200px" }}
      />
      <motion.rect
        x="176"
        y="118"
        width="52"
        height="40"
        rx="2"
        className="stroke-border fill-accent-lime/15"
        strokeWidth="1"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 0.45, ease: motionEase, delay: 0.5 }
        }
      />
      {!reducedMotion ? (
        <motion.circle
          cx="132"
          cy="165"
          r="4"
          className="fill-accent"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ ...loop, duration: 2.5, ease: "easeInOut" }}
        />
      ) : null}
    </>
  );
}

function ChartIllustration({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <line
        x1="56"
        y1="184"
        x2="264"
        y2="184"
        className="stroke-border"
        strokeWidth="1.5"
      />
      <line
        x1="56"
        y1="184"
        x2="56"
        y2="48"
        className="stroke-border"
        strokeWidth="1.5"
      />
      <motion.path
        d="M 56 160 L 100 140 L 148 148 L 196 108 L 244 72 L 264 56"
        className="stroke-accent"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 1.4, ease: motionEase, delay: 0.2 }
        }
      />
      <motion.path
        d="M 56 160 L 100 140 L 148 148 L 196 108 L 244 72 L 264 56 L 264 184 L 56 184 Z"
        className="fill-accent/10"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 0.6, ease: motionEase, delay: 1.2 }
        }
      />
      {!reducedMotion ? (
        <motion.circle
          cx="264"
          cy="56"
          r="5"
          className="fill-accent"
          animate={{ opacity: [1, 0.5, 1], scale: [1, 1.15, 1] }}
          transition={{ ...loop, duration: 2.2, ease: "easeInOut", delay: 1.4 }}
        />
      ) : (
        <circle cx="264" cy="56" r="5" className="fill-accent" />
      )}
    </>
  );
}

function TimelineIllustration({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <rect
        x="48"
        y="56"
        width="224"
        height="128"
        rx="8"
        className="stroke-border fill-background"
        strokeWidth="1.5"
      />
      <rect
        x="64"
        y="72"
        width="192"
        height="88"
        rx="4"
        className="fill-foreground/8"
      />
      <line
        x1="64"
        y1="178"
        x2="256"
        y2="178"
        className="stroke-border"
        strokeWidth="2"
      />
      {[80, 120, 168, 210].map((x) => (
        <rect
          key={x}
          x={x}
          y="174"
          width="3"
          height="10"
          rx="1"
          className="fill-muted/40"
        />
      ))}
      {!reducedMotion ? (
        <motion.rect
          x="64"
          y="174"
          width="4"
          height="14"
          rx="2"
          className="fill-accent"
          animate={{ x: [64, 200, 64] }}
          transition={{ ...loop, duration: 4, ease: "easeInOut" }}
        />
      ) : (
        <rect x="140" y="174" width="4" height="14" rx="2" className="fill-accent" />
      )}
      <motion.polygon
        points="148,108 148,92 162,100"
        className="fill-accent"
        initial={reducedMotion ? false : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.9, scale: 1 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 0.4, ease: motionEase, delay: 0.3 }
        }
      />
    </>
  );
}

function ChatIllustration({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <motion.rect
        x="56"
        y="48"
        width="120"
        height="36"
        rx="10"
        className="fill-accent/15 stroke-border"
        strokeWidth="1"
        initial={reducedMotion ? false : { opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 0.45, ease: motionEase, delay: 0.1 }
        }
      />
      <motion.rect
        x="144"
        y="96"
        width="120"
        height="36"
        rx="10"
        className="fill-accent/25 stroke-accent/30"
        strokeWidth="1"
        initial={reducedMotion ? false : { opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 0.45, ease: motionEase, delay: 0.35 }
        }
      />
      {[0, 1, 2].map((index) => (
        <motion.g
          key={index}
          initial={reducedMotion ? false : { opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 0.4, ease: motionEase, delay: 0.55 + index * 0.12 }
          }
        >
          <rect
            x="72"
            y={152 + index * 28}
            width="14"
            height="14"
            rx="3"
            className="stroke-border fill-background"
            strokeWidth="1"
          />
          {index < 2 ? (
            <path
              d={`M 76 ${158 + index * 28} L 80 ${162 + index * 28} L 84 ${156 + index * 28}`}
              className="stroke-accent"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ) : null}
          <rect
            x="96"
            y={154 + index * 28}
            width={120 - index * 20}
            height="6"
            rx="2"
            className="fill-foreground/12"
          />
        </motion.g>
      ))}
    </>
  );
}

const themeComponents: Record<
  ServiceIllustrationTheme,
  ComponentType<{ reducedMotion: boolean }>
> = {
  browser: BrowserIllustration,
  storefront: StorefrontIllustration,
  chart: ChartIllustration,
  timeline: TimelineIllustration,
  chat: ChatIllustration,
};

type ServiceHeroIllustrationProps = {
  slug: string;
  platformLabel: string;
  tags: readonly string[];
};

export function ServiceHeroIllustration({
  slug,
  platformLabel,
  tags,
}: ServiceHeroIllustrationProps) {
  const reducedMotion = useReducedMotion();
  const theme = resolveServiceIllustrationTheme(slug);
  const Illustration = themeComponents[theme];

  return (
    <div className="relative aspect-square overflow-hidden bg-transparent">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, var(--accent) 0%, transparent 42%), radial-gradient(circle at 80% 70%, var(--accent-lime) 0%, transparent 36%)",
          opacity: 0.12,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--muted) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center p-8">
        <svg
          viewBox="0 0 320 240"
          className="h-full w-full max-h-[220px] text-muted"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <Illustration reducedMotion={reducedMotion} />
        </svg>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-border bg-background/80 p-5 backdrop-blur-sm">
        <p className="text-sm font-semibold text-foreground">{platformLabel}</p>
        <p className="mt-1 text-xs text-muted">
          {tags.slice(0, 3).join(" · ")}
        </p>
      </div>
    </div>
  );
}
