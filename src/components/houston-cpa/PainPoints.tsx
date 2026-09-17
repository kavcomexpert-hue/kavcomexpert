"use client";

import { PAIN_POINTS } from "@/components/houston-cpa/constants";
import { Reveal, motionEase } from "@/components/site/motion/reveal";
import { motion } from "motion/react";

export function PainPoints() {
  return (
    <section
      aria-labelledby="pain-points-heading"
      className="mx-auto max-w-[1120px] px-6 py-20 md:py-28"
    >
      <Reveal>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
          The real friction
        </p>
        <h2
          id="pain-points-heading"
          className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
        >
          Houston CPA firms lose billable hours to marketing and intake debt.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          These are the patterns we see when partners finally open the books on
          their website, Google profile, LinkedIn, and front desk.
        </p>
      </Reveal>
      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {PAIN_POINTS.map((item, index) => (
          <Reveal key={item.title} delay={index * 0.06} as="article">
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3, ease: motionEase }}
              className="h-full rounded-default border border-border bg-surface p-6 shadow-soft transition-[border-color] duration-300 hover:border-accent/50 dark:shadow-glow"
            >
              <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.body}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
