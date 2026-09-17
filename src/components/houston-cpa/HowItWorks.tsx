"use client";

import { BOOKING_URL, HOW_IT_WORKS } from "@/components/houston-cpa/constants";
import { Reveal, motionEase } from "@/components/site/motion/reveal";
import { motion } from "motion/react";

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="mx-auto max-w-[1120px] px-6 py-20 md:py-28"
    >
      <Reveal>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
          How it works
        </p>
        <h2
          id="how-it-works-heading"
          className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
        >
          Four steps from fit call to monthly delivery. No payment before the
          call.
        </h2>
        <p className="mt-4 max-w-xl rounded-default border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
          No payment is taken before the fit call. You talk to a strategist
          first, then decide.
        </p>
      </Reveal>

      <ol className="mt-12 grid gap-6 md:grid-cols-4">
        {HOW_IT_WORKS.map((step, index) => (
          <Reveal key={step.step} delay={index * 0.08} as="li">
            <div className="relative h-full">
              {index < HOW_IT_WORKS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-[calc(100%-0.5rem)] top-5 hidden h-px w-[calc(100%-2rem)] bg-border md:block"
                />
              ) : null}
              <div className="relative border-l-2 border-accent pl-4 md:border-l-0 md:pl-0">
                <p className="font-mono text-sm font-bold text-accent">
                  {step.step}
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {step.body}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </ol>

      <Reveal delay={0.2}>
        <div className="mt-10">
          <motion.a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.25, ease: motionEase }}
            className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-surface transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            data-track="book_fit_call_how"
          >
            Book the fit call
          </motion.a>
        </div>
      </Reveal>
    </section>
  );
}
