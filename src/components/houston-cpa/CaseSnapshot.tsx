"use client";

import { CASE_SNAPSHOT } from "@/components/houston-cpa/constants";
import { Reveal, motionEase } from "@/components/site/motion/reveal";
import { motion } from "motion/react";

export function CaseSnapshot() {
  return (
    <section
      aria-labelledby="case-snapshot-heading"
      className="border-y border-border bg-surface"
    >
      <div className="mx-auto max-w-[1120px] px-6 py-20 md:py-28">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            Results snapshot
          </p>
          <h2
            id="case-snapshot-heading"
            className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
          >
            What partnership looks like when ops and marketing sit in one place.
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.35, ease: motionEase }}
            className="mt-10 rounded-default border border-border bg-background p-8 md:p-10"
          >
            <p className="font-display text-3xl font-semibold tracking-tight text-accent md:text-4xl">
              {CASE_SNAPSHOT.metric}
            </p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted">
              {CASE_SNAPSHOT.metricHint}
            </p>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground">
              {CASE_SNAPSHOT.context}
            </p>
            <p className="mt-4 font-mono text-xs text-muted">
              {CASE_SNAPSHOT.attribution}
            </p>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}
