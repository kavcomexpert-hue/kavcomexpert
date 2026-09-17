import { Ambient } from "@/components/site/home/motion/ambient";
import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import { SiteLinkButton } from "@/components/site/site-link-button";
import { linkButton, type LinkButton } from "@/lib/content/link-button";
import { ChevronRight } from "lucide-react";

const reasons = [
  {
    index: "01",
    title: "End-to-End Expertise",
    body: "From initial strategy and development to marketing and ongoing support, we're your single partner for all digital needs. No juggling multiple vendors.",
    tone: "dark",
  },
  {
    index: "02",
    title: "Transparent Communication",
    body: "You'll always know what's happening with your project. Regular updates, clear timelines, and a dedicated point of contact ensure alignment every step of the way.",
    tone: "accent",
  },
  {
    index: "03",
    title: "Results-Focused Approach",
    body: "We measure success by your success. Every solution is built with clear KPIs and business objectives in mind, not just technical deliverables.",
    tone: "dark",
  },
] as const;

const toneClasses = {
  dark: "bg-foreground text-background dark:bg-surface dark:text-foreground dark:border dark:border-border",
  accent: "bg-accent text-surface",
} as const;

const toneGhost = {
  dark: "text-background/[0.07] dark:text-foreground/[0.06]",
  accent: "text-surface/10",
} as const;

const toneBody = {
  dark: "text-background/70 dark:text-muted",
  accent: "text-surface/85",
} as const;

export function WhySection({
  eyebrow = "Why choose us",
  headline = "Expertise for your digital growth journey",
  body = "Our dedicated team is committed to understanding your unique needs, providing innovative strategies that drive results with a focus on quality and integrity.",
  cta = linkButton("How we work", "/about-us"),
  reasonItems,
}: {
  eyebrow?: string;
  headline?: string;
  body?: string;
  cta?: LinkButton;
  reasonItems?: readonly { title: string; body: string }[];
}) {
  const tones = ["dark", "accent", "dark"] as const;
  const cards =
    reasonItems && reasonItems.length > 0
      ? reasonItems.map((item, index) => ({
          index: String(index + 1).padStart(2, "0"),
          title: item.title,
          body: item.body,
          tone: tones[index % tones.length]!,
        }))
      : reasons.map((r) => ({ ...r }));

  return (
    <section className="relative overflow-clip bg-background py-20 md:py-32">
      <Ambient />
      <div className="relative mx-auto max-w-[1120px] px-6">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <BlurReveal>
              <p className="text-sm font-medium text-accent">{eyebrow}</p>
              <h2 className="mt-4 text-balance text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground">
                {headline}
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
                {body}
              </p>
              <SiteLinkButton
                button={cta}
                className="group mt-8 inline-flex items-center gap-2 text-sm font-medium text-foreground"
              >
                <>
                  {cta.label}
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5"
                  ><ChevronRight className="size-4" strokeWidth={1.5} aria-hidden="true" /></span>
                </>
              </SiteLinkButton>
            </BlurReveal>
          </div>

          {/* Cards stack over each other as you scroll */}
          <div>
            {cards.map((reason, index) => (
              <div
                key={`${reason.index}-${reason.title}`}
                className="lg:sticky"
                style={{ top: `${7 + index * 2}rem` }}
              >
                <BlurReveal delay={index * 0.06} className="mb-6 lg:mb-10">
                  <article
                    className={`relative min-h-[280px] overflow-hidden rounded-default p-8 shadow-soft md:p-10 lg:min-h-[320px] ${toneClasses[reason.tone]}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute -right-4 -top-10 select-none text-[11rem] font-semibold leading-none tracking-[-0.06em] ${toneGhost[reason.tone]}`}
                    >
                      {reason.index}
                    </span>

                    <div className="relative flex items-center gap-4">
                      <span className="text-sm font-medium tabular-nums opacity-70">
                        {reason.index} / {String(cards.length).padStart(2, "0")}
                      </span>
                      <span
                        aria-hidden="true"
                        className="h-px w-16 bg-current opacity-30"
                      />
                    </div>

                    <h3 className="relative mt-14 max-w-md text-3xl font-semibold leading-[1.1] tracking-[-0.025em] md:text-4xl">
                      {reason.title}
                    </h3>
                    <p
                      className={`relative mt-4 max-w-xl text-sm leading-relaxed md:text-base ${toneBody[reason.tone]}`}
                    >
                      {reason.body}
                    </p>
                  </article>
                </BlurReveal>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
