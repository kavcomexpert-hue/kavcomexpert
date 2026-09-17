"use client";

import { TRUST_STATS } from "@/components/houston-cpa/constants";
import { Reveal } from "@/components/site/motion/reveal";

export function TrustBar() {
  const items = [
    { value: TRUST_STATS.yearsOperating, label: TRUST_STATS.yearsLabel },
    { value: TRUST_STATS.clientsServed, label: TRUST_STATS.clientsLabel },
    { value: TRUST_STATS.responseTime, label: TRUST_STATS.responseLabel },
    { value: TRUST_STATS.timezoneOverlap, label: TRUST_STATS.timezoneLabel },
  ];

  return (
    <section
      aria-labelledby="trust-bar-heading"
      className="border-b border-border bg-surface"
    >
      <h2 id="trust-bar-heading" className="sr-only">
        Trust and operating proof
      </h2>
      <div className="mx-auto grid max-w-[1120px] grid-cols-2 md:grid-cols-4">
        {items.map((item, index) => (
          <Reveal
            key={item.label}
            delay={index * 0.05}
            className="border-border px-6 py-7 text-center md:border-r md:py-9 md:last:border-r-0 [&:nth-child(odd)]:border-r"
          >
            <p className="font-mono text-lg font-bold tracking-tight text-foreground md:text-xl">
              {item.value}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              {item.label}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
