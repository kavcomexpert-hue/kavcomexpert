"use client";

import {
  BOOKING_URL,
  PRICING,
  quarterlyEffectiveMonthly,
  quarterlyPrice,
} from "@/components/houston-cpa/constants";
import { Reveal, motionEase } from "@/components/site/motion/reveal";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

type Billing = "monthly" | "quarterly";

type TierKey = keyof typeof PRICING;

export function Pricing() {
  const [billing, setBilling] = useState<Billing>("monthly");

  const tiers = (Object.keys(PRICING) as TierKey[]).map((key) => {
    const tier = PRICING[key];
    const monthly = tier.monthly;
    const display =
      billing === "monthly"
        ? monthly
        : quarterlyEffectiveMonthly(monthly);
    const quarterlyTotal =
      billing === "quarterly" ? quarterlyPrice(monthly) : null;

    return {
      key,
      ...tier,
      display,
      quarterlyTotal,
      popular: "popular" in tier && tier.popular,
    };
  });

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="border-y border-border bg-surface"
    >
      <div className="mx-auto max-w-[1120px] px-6 py-20 md:py-28">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            Pricing
          </p>
          <h2
            id="pricing-heading"
            className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
          >
            Simple monthly packages for Houston CPA marketing and back office
            work.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            Foundation is $850 per month. Growth is $1,650 per month. Scale is
            $2,800 per month. Quarterly billing saves 10 percent.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div
            role="group"
            aria-label="Billing period"
            className="mt-8 inline-flex rounded-full border border-border bg-background p-1"
          >
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                billing === "monthly"
                  ? "bg-accent text-surface"
                  : "text-muted hover:text-foreground"
              }`}
              aria-pressed={billing === "monthly"}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling("quarterly")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                billing === "quarterly"
                  ? "bg-accent text-surface"
                  : "text-muted hover:text-foreground"
              }`}
              aria-pressed={billing === "quarterly"}
            >
              Quarterly, save 10%
            </button>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier, index) => (
            <Reveal key={tier.key} delay={0.1 + index * 0.06} as="article">
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3, ease: motionEase }}
                className={`relative flex h-full flex-col rounded-default border p-6 md:p-7 ${
                  tier.popular
                    ? "border-accent/50 bg-surface/80 shadow-soft backdrop-blur-md dark:shadow-glow lg:-translate-y-2"
                    : "border-border bg-background"
                }`}
              >
                {tier.popular ? (
                  <p className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-surface">
                    Most Popular
                  </p>
                ) : null}
                <h3 className="font-display text-xl font-semibold text-foreground">
                  {tier.name}
                </h3>
                <p className="mt-2 text-sm text-muted">{tier.blurb}</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`${tier.key}-${billing}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: motionEase }}
                    className="mt-5 font-display text-4xl font-semibold tracking-tight text-foreground"
                  >
                    ${tier.display.toLocaleString("en-US")}
                    <span className="ml-1 font-mono text-sm font-normal text-muted">
                      / mo
                    </span>
                  </motion.p>
                </AnimatePresence>
                {tier.quarterlyTotal != null ? (
                  <p className="mt-1 font-mono text-xs text-muted">
                    Billed ${tier.quarterlyTotal.toLocaleString("en-US")} per
                    quarter
                  </p>
                ) : (
                  <p className="mt-1 font-mono text-xs text-muted">
                    Billed monthly
                  </p>
                )}
                <ul className="mt-6 flex-1 space-y-2.5">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-2 text-sm leading-relaxed text-muted"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-8 inline-flex h-11 items-center justify-center rounded-full text-sm font-medium transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    tier.popular
                      ? "bg-accent text-surface"
                      : "border border-border bg-surface text-foreground"
                  }`}
                  data-track={`book_fit_call_pricing_${tier.key}`}
                >
                  Book a Fit Call
                </a>
              </motion.div>
            </Reveal>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted">
          Custom scopes are available for multi partner firms.{" "}
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Book a fit call to discuss
          </a>
          .
        </p>
      </div>
    </section>
  );
}
