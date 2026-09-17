import { Ambient } from "@/components/site/home/motion/ambient";
import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import { ArrowUpRight } from "lucide-react";

const benefits = [
  {
    index: "01",
    title: "Innovative solutions for modern brands",
    body: "Cutting-edge approaches that keep your brand ahead of trends: from AI-powered SEO to headless commerce architectures, we bring tomorrow's tools to today's challenges.",
    span: "md:col-span-7",
  },
  {
    index: "02",
    title: "Expert team with proven results",
    body: "Certified specialists across every discipline (development, design, SEO, and paid media) with a track record of delivering measurable growth.",
    span: "md:col-span-5",
  },
  {
    index: "03",
    title: "Customized strategies for your goals",
    body: "No templates, no one-size-fits-all. Every engagement starts with your business objectives and ends with a plan built specifically around them.",
    span: "md:col-span-5",
  },
  {
    index: "04",
    title: "Dedicated support, every step",
    body: "A responsive team that treats your project like its own: transparent reporting, proactive communication, and long-term partnership beyond launch day.",
    span: "md:col-span-7",
  },
] as const;

const BENEFIT_SPANS = [
  "md:col-span-7",
  "md:col-span-5",
  "md:col-span-5",
  "md:col-span-7",
] as const;

export function BenefitsSection({
  eyebrow = "Key benefits",
  headline = "Discover the benefits of choosing us today",
  subtext = "Experience unparalleled creativity, data-driven strategies, and dedicated support that drive real results for your brand.",
  items,
}: {
  eyebrow?: string;
  headline?: string;
  subtext?: string;
  items?: readonly { title: string; body: string }[];
}) {
  const cards =
    items && items.length > 0
      ? items.map((item, index) => ({
          index: String(index + 1).padStart(2, "0"),
          title: item.title,
          body: item.body,
          span: BENEFIT_SPANS[index % BENEFIT_SPANS.length]!,
        }))
      : benefits.map((b) => ({ ...b }));

  return (
    <section className="relative overflow-clip border-t border-border bg-surface py-20 md:py-32">
      <Ambient flip />
      <div className="relative mx-auto max-w-[1120px] px-6">
        <div className="mb-14 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <BlurReveal>
            <p className="text-sm font-medium text-accent">{eyebrow}</p>
            <h2 className="mt-4 max-w-xl text-balance text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground">
              {headline}
            </h2>
          </BlurReveal>
          <BlurReveal delay={0.1}>
            <p className="max-w-md text-base leading-relaxed text-muted lg:justify-self-end">
              {subtext}
            </p>
          </BlurReveal>
        </div>

        <div className="grid gap-4 md:grid-cols-12">
          {cards.map((benefit, index) => (
            <BlurReveal
              key={`${benefit.index}-${benefit.title}`}
              as="article"
              delay={index * 0.08}
              className={`group relative flex flex-col overflow-hidden rounded-default border border-border bg-background p-7 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-soft dark:hover:shadow-glow md:p-9 ${benefit.span}`}
            >
              <div
                aria-hidden="true"
                className="absolute -bottom-14 -right-14 size-36 rounded-full bg-accent-lime/0 blur-2xl transition-[background-color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-125 group-hover:bg-accent-lime/20 dark:group-hover:bg-accent/15"
              />

              <div className="relative flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-full border border-border text-sm font-semibold tabular-nums text-muted transition-[background-color,color,border-color] duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-surface">
                  {benefit.index}
                </span>
                <span
                  aria-hidden="true"
                  className="text-xl text-muted/50 transition-[color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                ><ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" /></span>
              </div>

              <h3 className="relative mt-8 max-w-md text-2xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground">
                {benefit.title}
              </h3>
              <p className="relative mt-3 max-w-xl text-sm leading-relaxed text-muted md:text-[0.95rem]">
                {benefit.body}
              </p>
            </BlurReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
