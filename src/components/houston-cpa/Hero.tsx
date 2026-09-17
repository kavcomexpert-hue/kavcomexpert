"use client";

import { BOOKING_URL } from "@/components/houston-cpa/constants";
import { HeroReveal, motionEase } from "@/components/site/motion/reveal";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef, type MouseEvent } from "react";

const bars = [
  { label: "CPA firm Houston", width: 78 },
  { label: "Tax accountant near me", width: 64 },
  { label: "Bookkeeping Houston", width: 91 },
  { label: "Franchise tax Texas", width: 52 },
];

export function Hero() {
  return (
    <section
      aria-labelledby="houston-cpa-hero-heading"
      className="relative overflow-hidden border-b border-border"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_50%)]" />
        <div className="absolute -right-24 top-10 size-[420px] rounded-full bg-accent-lime/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-[280px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-[1120px] items-center gap-12 px-6 pb-16 pt-12 md:grid-cols-[1.05fr_0.95fr] md:gap-14 md:pb-24 md:pt-16">
        <div>
          <HeroReveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
              Houston CPA firms
            </p>
          </HeroReveal>

          <HeroReveal delay={0.08}>
            <h1
              id="houston-cpa-hero-heading"
              className="mt-5 max-w-[18ch] font-display text-[2.35rem] font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-[3.35rem]"
            >
              Marketing and Back Office Support for Houston CPA Firms
            </h1>
          </HeroReveal>

          <HeroReveal delay={0.16}>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
              We handle the website, the search visibility, the social content and
              the admin overhead so Houston accountants can bill more hours instead
              of managing five vendors.
            </p>
          </HeroReveal>

          <HeroReveal delay={0.22}>
            <p className="mt-6 max-w-lg border-l-2 border-accent pl-4 text-sm leading-relaxed text-foreground">
              Built for Houston CPA and accounting firms. Websites, local SEO, AEO,
              social, video, email, and VA support. Packages from $850 per month.
              Free 20 minute fit call before you pay anything.
            </p>
          </HeroReveal>

          <HeroReveal delay={0.3}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <motion.a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.25, ease: motionEase }}
                className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-7 text-sm font-medium text-surface shadow-soft transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:shadow-glow"
                data-track="book_fit_call_hero"
              >
                Book a Free 20 Minute Fit Call
              </motion.a>
              <motion.a
                href="#pricing"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.25, ease: motionEase }}
                className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-surface/80 px-7 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                See Pricing
              </motion.a>
            </div>
            <p className="mt-4 font-mono text-[11px] leading-relaxed tracking-wide text-muted">
              No contracts. Cancel anytime. Talk to a strategist before you pay a
              rupee or a dollar.
            </p>
          </HeroReveal>
        </div>

        <HeroReveal delay={0.18} className="relative">
          <InteractivePanel />
        </HeroReveal>
      </div>
    </section>
  );
}

function InteractivePanel() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), {
    stiffness: 160,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), {
    stiffness: 160,
    damping: 22,
  });

  function onMove(event: MouseEvent<HTMLDivElement>) {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mx.set((event.clientX - rect.left) / rect.width - 0.5);
    my.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative mx-auto w-full max-w-md perspective-[1200px] md:max-w-none"
    >
      <motion.div
        aria-hidden="true"
        style={
          reduced
            ? undefined
            : { rotateX, rotateY, transformStyle: "preserve-3d" }
        }
        className="relative overflow-hidden rounded-[22px] border border-border bg-surface shadow-soft dark:shadow-glow"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-accent" />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              Houston visibility desk
            </span>
          </div>
          <span className="rounded-full bg-accent/10 px-2.5 py-1 font-mono text-[10px] text-accent">
            Live
          </span>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Local SEO", value: "Active" },
              { label: "GBP", value: "Weekly" },
              { label: "VA hours", value: "40 / mo" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.35 + index * 0.08,
                  duration: 0.45,
                  ease: motionEase,
                }}
                className="rounded-xl border border-border bg-background px-3 py-3"
              >
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted">
                  {stat.label}
                </p>
                <p className="mt-1 font-display text-sm font-semibold text-foreground">
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Houston keyword coverage
              </p>
              <p className="font-mono text-[10px] text-accent">Tracking</p>
            </div>
            <div className="mt-4 space-y-3">
              {bars.map((bar, index) => (
                <div key={bar.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-foreground">
                      {bar.label}
                    </span>
                    <span className="font-mono text-[10px] text-muted">
                      {bar.width}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-border">
                    <motion.div
                      className="h-full rounded-full bg-accent"
                      initial={reduced ? { width: `${bar.width}%` } : { width: 0 }}
                      animate={{ width: `${bar.width}%` }}
                      transition={{
                        delay: 0.5 + index * 0.1,
                        duration: 0.9,
                        ease: motionEase,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <motion.div
              whileHover={reduced ? undefined : { y: -3 }}
              className="rounded-xl border border-border bg-background p-3.5"
            >
              <p className="font-mono text-[10px] text-muted">Intake</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                Documents chased
              </p>
            </motion.div>
            <motion.div
              whileHover={reduced ? undefined : { y: -3 }}
              className="rounded-xl border border-accent/30 bg-accent/10 p-3.5"
            >
              <p className="font-mono text-[10px] text-accent">This week</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                Content shipped
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <motion.div
        aria-hidden="true"
        initial={reduced ? false : { opacity: 0, x: 16, y: 8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5, ease: motionEase }}
        className="absolute -bottom-4 -left-3 hidden rounded-xl border border-border bg-surface/95 px-3.5 py-2.5 shadow-soft backdrop-blur-md sm:block dark:shadow-glow"
      >
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
          Central Time
        </p>
        <p className="mt-0.5 text-xs font-medium text-foreground">
          Daily overlap with Houston
        </p>
      </motion.div>
    </div>
  );
}
