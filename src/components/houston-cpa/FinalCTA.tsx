"use client";

import { BOOKING_URL } from "@/components/houston-cpa/constants";
import { LeadForm } from "@/components/houston-cpa/LeadForm";
import { Reveal, motionEase } from "@/components/site/motion/reveal";
import { motion } from "motion/react";

export function FinalCTA() {
  return (
    <section
      id="final-cta"
      aria-labelledby="final-cta-heading"
      className="relative overflow-hidden border-t border-border bg-background"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_55%)]"
      />
      <div className="relative mx-auto grid max-w-[1120px] gap-10 px-6 py-20 md:grid-cols-2 md:items-start md:gap-14 md:py-28">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            Next step
          </p>
          <h2
            id="final-cta-heading"
            className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
          >
            Book a free 20 minute fit call for your Houston CPA firm.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            No payment before the call. We map what is broken, recommend a
            package, and leave you with a clear next step.
          </p>
          <motion.a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.25, ease: motionEase }}
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-surface transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            data-track="book_fit_call_final"
          >
            Book a Free 20 Minute Fit Call
          </motion.a>
        </Reveal>
        <Reveal delay={0.1}>
          <LeadForm />
        </Reveal>
      </div>
    </section>
  );
}
