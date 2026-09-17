"use client";

import { ArrowUpRight } from "lucide-react";

import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import { SiteLinkButton } from "@/components/site/site-link-button";
import { linkButton, type LinkButton } from "@/lib/content/link-button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motion, useSpring } from "motion/react";
import { Fragment, useRef, type PointerEvent } from "react";

function MagneticCta({ cta }: { cta: LinkButton }) {
  const reducedMotion = useReducedMotion();
  const areaRef = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 180, damping: 16 });
  const y = useSpring(0, { stiffness: 180, damping: 16 });

  if (!cta.enabled) return null;

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (reducedMotion) {
      return;
    }

    const area = areaRef.current;
    if (!area) {
      return;
    }

    const rect = area.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    x.set(dx * 0.25);
    y.set(dy * 0.35);
  }

  function onPointerLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div
      ref={areaRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="inline-flex items-center justify-center p-6 md:p-10"
    >
      <motion.div style={reducedMotion ? undefined : { x, y }}>
        <SiteLinkButton
          button={cta}
          className="group inline-flex h-16 items-center justify-center gap-4 rounded-full bg-background py-4 pl-10 pr-4 text-base font-semibold text-foreground transition-transform duration-300 hover:scale-[1.05] active:scale-[0.98] dark:bg-foreground dark:text-background md:h-20 md:pl-12 md:text-lg"
        >
          <>
            {cta.label}
            <span
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-full bg-accent text-xl text-surface transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-45 dark:text-background md:size-12"
            >
              <ArrowUpRight
                className="size-4"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </span>
          </>
        </SiteLinkButton>
      </motion.div>
    </div>
  );
}

type HomeCtaSectionProps = {
  eyebrow?: string;
  headline?: string;
  body?: string;
  cta?: LinkButton;
  emailPrefLabel?: string;
  emailAddress?: string;
  watermark?: string;
};

const DEFAULT_CTA = linkButton("Start your project", "/contact-us");

export function HomeCtaSection({
  eyebrow = "Currently accepting new projects",
  headline = "Have an idea?\nLet's build it together.",
  body = "Tell us about your project and get a free strategy call with no commitment. Just honest advice on how to grow.",
  cta = DEFAULT_CTA,
  emailPrefLabel = "Prefer email?",
  emailAddress = "info@kavcomexpert.com",
  watermark = "Let's talk",
}: HomeCtaSectionProps = {}) {
  const headlineLines = headline.split("\n");
  const email = emailAddress.trim() || "info@kavcomexpert.com";

  return (
    <section className="relative overflow-hidden bg-foreground py-24 text-background dark:bg-surface dark:text-foreground md:py-36">
      <p
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 w-max -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[clamp(8rem,24vw,20rem)] font-semibold leading-none tracking-[-0.06em] text-background/[0.04] dark:text-foreground/[0.04]"
      >
        {watermark}
      </p>

      <div className="relative mx-auto flex max-w-[1120px] flex-col items-center px-6 text-center">
        <BlurReveal>
          <p className="inline-flex items-center gap-2.5 rounded-full border border-background/20 px-4 py-2 text-sm font-medium text-background/70 dark:border-border dark:text-muted">
            <span className="relative flex size-2" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-lime opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-accent-lime" />
            </span>
            {eyebrow}
          </p>
        </BlurReveal>

        <BlurReveal delay={0.1}>
          <h2 className="mt-8 max-w-3xl text-[clamp(2.5rem,6.5vw,5rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
            {headlineLines.map((line, index) => (
              <Fragment key={`${index}-${line}`}>
                {index > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </h2>
        </BlurReveal>

        <BlurReveal delay={0.2}>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-background/70 dark:text-muted md:text-lg">
            {body}
          </p>
        </BlurReveal>

        <BlurReveal delay={0.3}>
          <MagneticCta cta={cta} />
        </BlurReveal>

        <BlurReveal delay={0.4}>
          <p className="text-sm text-background/60 dark:text-muted">
            {emailPrefLabel}{" "}
            <a
              href={`mailto:${email}`}
              className="font-medium text-background underline-offset-4 hover:underline dark:text-foreground"
            >
              {email}
            </a>
          </p>
        </BlurReveal>
      </div>
    </section>
  );
}
