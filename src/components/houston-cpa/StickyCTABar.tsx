"use client";

import { BOOKING_URL } from "@/components/houston-cpa/constants";
import { motionEase } from "@/components/site/motion/reveal";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

export function StickyCTABar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("houston-cpa-hero-heading");
    const finalCta = document.getElementById("final-cta");
    if (!hero || !finalCta) return;

    let pastHero = false;
    let finalInView = false;

    const update = () => {
      setVisible(pastHero && !finalInView);
    };

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        pastHero = !entry?.isIntersecting;
        update();
      },
      { threshold: 0 },
    );

    const finalObserver = new IntersectionObserver(
      ([entry]) => {
        finalInView = Boolean(entry?.isIntersecting);
        update();
      },
      { threshold: 0.15 },
    );

    heroObserver.observe(hero);
    finalObserver.observe(finalCta);

    return () => {
      heroObserver.disconnect();
      finalObserver.disconnect();
    };
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-50"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          transition={{ duration: 0.35, ease: motionEase }}
        >
          <div className="border-t border-border bg-surface/85 px-4 py-3 shadow-soft backdrop-blur-md dark:shadow-glow">
            <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4">
              <p className="hidden text-sm text-muted sm:block">
                Free 20 minute fit call. No payment before we talk.
              </p>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-surface transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
                data-track="book_fit_call_sticky"
              >
                Book a Fit Call
              </a>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
