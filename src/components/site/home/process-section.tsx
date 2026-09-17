"use client";

import { motionEase } from "@/components/site/motion/reveal";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { DEFAULT_PROCESS_STEPS } from "@/lib/services/page-sections";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";

export type ProcessStep = {
  number: string;
  name: string;
  description: string;
};

export type ProcessSectionProps = {
  eyebrow?: string;
  headline?: string;
  steps?: readonly ProcessStep[];
};

function useProcessContent(props: ProcessSectionProps) {
  const eyebrow = props.eyebrow?.trim() || "How it works";
  const headline =
    props.headline?.trim() || "Our proven process for achieving success";
  const steps =
    props.steps && props.steps.length > 0
      ? props.steps
      : [...DEFAULT_PROCESS_STEPS];
  return { eyebrow, headline, steps };
}

function ProcessStatic({
  eyebrow,
  headline,
  steps,
}: {
  eyebrow: string;
  headline: string;
  steps: readonly ProcessStep[];
}) {
  return (
    <section className="border-y border-border bg-surface py-20 md:py-32">
      <div className="mx-auto max-w-[1120px] px-6">
        <p className="text-sm font-medium text-accent">{eyebrow}</p>
        <h2 className="mt-4 max-w-2xl text-balance text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-foreground">
          {headline}
        </h2>

        <ol className="mt-14 space-y-12">
          {steps.map((step) => (
            <li
              key={`${step.number}-${step.name}`}
              className="grid gap-4 border-t border-border pt-8 md:grid-cols-[8rem_1fr]"
            >
              <p className="text-5xl font-semibold tracking-[-0.04em] text-muted/50">
                {step.number}
              </p>
              <div>
                <h3 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
                  {step.name}
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted md:text-base">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ProcessDesktop({
  eyebrow,
  headline,
  steps,
}: {
  eyebrow: string;
  headline: string;
  steps: readonly ProcessStep[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const railScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setCurrent(Math.min(steps.length - 1, Math.floor(value * steps.length)));
  });

  const step = steps[current] ?? steps[0];

  return (
    <section
      ref={containerRef}
      aria-label={eyebrow}
      className="relative hidden h-[300vh] border-y border-border bg-surface lg:block"
    >
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={step.number}
            aria-hidden="true"
            className="pointer-events-none absolute right-[-2vw] top-1/2 select-none text-[clamp(20rem,42vw,34rem)] font-semibold leading-none tracking-[-0.06em] text-accent/[0.06]"
            initial={{ opacity: 0, y: "-38%", filter: "blur(28px)", scale: 1.08 }}
            animate={{ opacity: 1, y: "-50%", filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, y: "-62%", filter: "blur(28px)", scale: 0.94 }}
            transition={{ duration: 0.7, ease: motionEase }}
          >
            {step.number}
          </motion.p>
        </AnimatePresence>

        <div className="relative mx-auto w-full max-w-[1120px] px-6">
          <div className="flex items-center gap-5">
            <p className="text-sm font-medium text-accent">{eyebrow}</p>
            <div className="relative h-px w-40 overflow-hidden bg-border">
              <motion.div
                className="absolute inset-y-0 left-0 w-full origin-left bg-accent"
                style={{ scaleX: railScale }}
              />
            </div>
            <p className="text-sm tabular-nums text-muted">
              {step.number} / {String(steps.length).padStart(2, "0")}
            </p>
          </div>

          <h2 className="mt-4 max-w-2xl text-balance text-[clamp(1.5rem,2.5vw,2rem)] font-semibold leading-[1.15] tracking-[-0.03em] text-foreground">
            {headline}
          </h2>

          <div className="mt-10 min-h-[340px] max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 36, filter: "blur(16px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -28, filter: "blur(12px)" }}
                transition={{ duration: 0.5, ease: motionEase }}
              >
                <h3 className="text-[clamp(3rem,6.5vw,5.5rem)] font-semibold leading-[1.0] tracking-[-0.04em] text-foreground">
                  {step.name}
                </h3>
                <p className="mt-8 max-w-xl text-base leading-relaxed text-muted md:text-lg">
                  {step.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-12 flex gap-3" aria-hidden="true">
            {steps.map((item, index) => (
              <div
                key={`${item.number}-${item.name}`}
                className={`h-1 rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  current === index ? "w-16 bg-accent" : "w-6 bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessMobile({
  eyebrow,
  headline,
  steps,
}: {
  eyebrow: string;
  headline: string;
  steps: readonly ProcessStep[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      ref={containerRef}
      className="border-y border-border bg-surface py-20 md:py-28 lg:hidden"
    >
      <div className="mx-auto max-w-[1120px] px-6">
        <p className="text-sm font-medium text-accent">{eyebrow}</p>
        <h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
          {headline}
        </h2>

        <ol className="relative mt-12 space-y-12 pl-7">
          <motion.div
            className="absolute bottom-0 left-[5px] top-0 w-px origin-top bg-accent"
            style={{ scaleY: lineScale }}
            aria-hidden="true"
          />
          {steps.map((step) => (
            <li key={`${step.number}-${step.name}`} className="relative">
              <span className="absolute -left-7 top-2 size-2.5 rounded-full bg-accent" />
              <p className="text-4xl font-semibold tracking-[-0.04em] text-muted/50">
                {step.number}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-foreground">
                {step.name}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function ProcessSection(props: ProcessSectionProps = {}) {
  const reducedMotion = useReducedMotion();
  const { eyebrow, headline, steps } = useProcessContent(props);

  if (reducedMotion) {
    return (
      <ProcessStatic eyebrow={eyebrow} headline={headline} steps={steps} />
    );
  }

  return (
    <>
      <ProcessDesktop eyebrow={eyebrow} headline={headline} steps={steps} />
      <ProcessMobile eyebrow={eyebrow} headline={headline} steps={steps} />
    </>
  );
}
