"use client";

import { SafeImage } from "@/components/site/safe-image";

import { ChevronRight } from "lucide-react";

import { Ambient } from "@/components/site/home/motion/ambient";
import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import {
  homeFaqItems,
  type FaqEntry,
} from "@/components/site/home/faq-data";
import { SiteLinkButton } from "@/components/site/site-link-button";
import { linkButton, type LinkButton } from "@/lib/content/link-button";
import { useId, useState } from "react";

export type { FaqEntry };
function FaqItem({
  question,
  answer,
  index,
  open,
  onToggle,
  panelId,
  buttonId,
}: {
  question: string;
  answer: string;
  index: number;
  open: boolean;
  onToggle: () => void;
  panelId: string;
  buttonId: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-default border bg-surface transition-[border-color,box-shadow] duration-300 ${
        open
          ? "border-accent shadow-soft dark:shadow-glow"
          : "border-border hover:border-accent/50"
      }`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-12 -top-12 size-32 rounded-full blur-2xl transition-[background-color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open
            ? "scale-125 bg-accent-lime/20 dark:bg-accent/15"
            : "bg-accent-lime/0 group-hover:scale-125 group-hover:bg-accent-lime/20 dark:group-hover:bg-accent/15"
        }`}
      />
      <button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="relative flex w-full items-center gap-5 p-5 text-left md:p-6"
      >
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums transition-[background-color,color,border-color] duration-300 ${
            open
              ? "border-accent bg-accent text-surface"
              : "border-border text-muted"
          }`}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="flex-1 text-base font-medium text-foreground md:text-lg">
          {question}
        </span>
        <span
          aria-hidden="true"
          className={`shrink-0 text-xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? "rotate-45 text-accent" : "text-muted"
          }`}
        >
          +
        </span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="max-w-2xl px-5 pb-6 pl-[4.75rem] text-sm leading-relaxed text-muted md:px-6 md:pl-[4.9rem] md:text-base">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

function FaqList({ items }: { items: readonly FaqEntry[] }) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <BlurReveal key={item.question} delay={index * 0.05} y={16}>
          <FaqItem
            question={item.question}
            answer={item.answer}
            index={index}
            open={openIndex === index}
            onToggle={() => setOpenIndex(index)}
            buttonId={`${baseId}-btn-${index}`}
            panelId={`${baseId}-panel-${index}`}
          />
        </BlurReveal>
      ))}
    </div>
  );
}

export type FaqSectionClientProps = {
  items?: readonly FaqEntry[];
  eyebrow?: string;
  headline?: string;
  description?: string;
  hideDescription?: boolean;
  hideContactCard?: boolean;
  cta?: LinkButton;
  cardTitle?: string;
  cardSubtitle?: string;
};

export function FaqSectionClient({
  items = homeFaqItems,
  eyebrow = "FAQs",
  headline = "Frequently asked questions",
  description = "Everything you need to know about working with us. Can't find your answer here?",
  hideDescription = false,
  hideContactCard = false,
  cta = linkButton("Talk to our team", "/contact-us"),
  cardTitle = "Still have questions?",
  cardSubtitle = "We reply within 24 hours.",
}: FaqSectionClientProps) {
  return (
    <section className="relative overflow-clip bg-background py-20 md:py-32">
      <Ambient flip />
      <div className="relative mx-auto max-w-[1120px] px-6">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <BlurReveal>
              <p className="text-sm font-medium text-accent">{eyebrow}</p>
              <h2 className="mt-4 text-balance text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground">
                {headline}
              </h2>
              {hideDescription ? null : (
                <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted md:text-base">
                  {description}
                </p>
              )}

              {hideContactCard ? null : (
                <div className="mt-8 max-w-sm rounded-default border border-border bg-surface p-6 shadow-soft dark:shadow-none">
                  <div className="flex items-center gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                      <SafeImage
                        src="/logo.png"
                        alt=""
                        width={26}
                        height={26}
                        className="size-6.5 object-contain"
                      />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {cardTitle}
                      </p>
                      <p className="text-sm text-muted">{cardSubtitle}</p>
                    </div>
                  </div>
                  <SiteLinkButton
                    button={cta}
                    className="group mt-5 inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-full bg-accent text-sm font-medium text-surface transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <>
                      {cta.label}
                      <span
                        aria-hidden="true"
                        className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1"
                      >
                        <ChevronRight
                          className="size-4"
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                      </span>
                    </>
                  </SiteLinkButton>
                </div>
              )}
            </BlurReveal>
          </div>

          <FaqList items={items} />
        </div>
      </div>
    </section>
  );
}
