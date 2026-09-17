"use client";

import { SERVICES_GRID } from "@/components/houston-cpa/constants";
import { Reveal, motionEase } from "@/components/site/motion/reveal";
import { motion } from "motion/react";

export function ServicesGrid() {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="border-y border-border bg-surface"
    >
      <div className="mx-auto max-w-[1120px] px-6 py-20 md:py-28">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            What we run for you
          </p>
          <h2
            id="services-heading"
            className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
          >
            Eight outcomes that keep Houston accounting firms visible and
            organized.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES_GRID.map((service, index) => (
            <Reveal key={service.title} delay={index * 0.04} as="article">
              <motion.div
                whileHover={{ y: -4, borderColor: "color-mix(in oklab, var(--accent) 50%, var(--border))" }}
                transition={{ duration: 0.3, ease: motionEase }}
                className="flex h-full flex-col rounded-default border border-border bg-background p-5"
              >
                <span className="font-mono text-[11px] text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-base font-semibold tracking-tight text-foreground">
                  {service.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {service.body}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
