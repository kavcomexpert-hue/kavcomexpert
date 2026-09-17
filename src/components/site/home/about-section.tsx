import { Ambient } from "@/components/site/home/motion/ambient";
import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import { SiteLinkButton } from "@/components/site/site-link-button";
import { linkButton, type LinkButton } from "@/lib/content/link-button";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

type AboutSectionProps = {
  eyebrow?: string;
  headline?: string;
  body?: string;
  cta?: LinkButton;
  row1Title?: string;
  row1Body?: string;
  row2Title?: string;
  row2Body?: string;
  row3Title?: string;
  row3Body?: string;
};

export function AboutSection({
  eyebrow = "About Kavcom",
  headline = "Crafting unique digital experiences that elevate your brand",
  body = "We measure our success by the success of our clients. Every project begins with understanding your unique business challenges, target audience, and growth objectives. Then we craft strategies that drive conversions, increase revenue, and build lasting customers.",
  cta = linkButton("More about us", "/about-us"),
  row1Title = "Creators of digital excellence",
  row1Body = "Custom website development, e-commerce platforms across Shopify, Magento, and WooCommerce, mobile applications, and performance marketing campaigns.",
  row2Title = "Innovating the digital landscape",
  row2Body = "We don't follow trends. We set them. Our innovation lab continuously tests emerging frameworks and tools, so you're never playing catch-up.",
  row3Title = "Helping brands thrive online",
  row3Body = "Success looks different for every client: more sales, qualified leads, brand awareness, or efficiency. We build the strategy around your definition of it.",
}: AboutSectionProps = {}) {
  const aboutRows = [
    {
      index: "01",
      title: row1Title,
      body: row1Body,
    },
    {
      index: "02",
      title: row2Title,
      body: row2Body,
    },
    {
      index: "03",
      title: row3Title,
      body: row3Body,
    },
  ] as const;

  return (
    <section className="relative overflow-clip bg-background py-20 md:py-32">
      <Ambient />
      <div className="relative mx-auto max-w-[1120px] px-6">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          {/* Sticky intro column */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <BlurReveal>
              <span className="flex size-14 items-center justify-center rounded-full border border-border bg-surface shadow-soft dark:shadow-none">
                <Image
                  src="/logo.png"
                  alt=""
                  width={32}
                  height={32}
                  loading="lazy"
                  className="size-8 object-contain"
                />
              </span>
              <p className="mt-6 text-sm font-medium text-accent">
                {eyebrow}
              </p>
              <h2 className="mt-4 text-balance text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground">
                {headline}
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
                {body}
              </p>
              <SiteLinkButton
                button={cta}
                className="group mt-8 inline-flex h-12 items-center justify-center gap-3 rounded-full bg-accent py-3 pl-6 pr-3 text-sm font-medium text-surface transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
              >
                <>
                  {cta.label}
                  <span
                    aria-hidden="true"
                    className="flex size-7 items-center justify-center rounded-full bg-surface/20 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-45"
                  ><ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" /></span>
                </>
              </SiteLinkButton>
            </BlurReveal>
          </div>

          {/* Editorial numbered rows */}
          <div>
            {aboutRows.map((row, index) => (
              <BlurReveal
                key={row.index}
                delay={index * 0.08}
                className="group relative border-t border-border py-10 last:border-b md:py-12"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 select-none text-[6rem] font-semibold leading-none tracking-[-0.06em] text-accent/[0.08] transition-[color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-[60%] group-hover:text-accent/20 md:text-[8rem]"
                >
                  {row.index}
                </span>

                <div className="relative max-w-md transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-2">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="h-px w-8 bg-accent transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-14"
                    />
                    <p className="text-sm font-medium tabular-nums text-muted">
                      {row.index}
                    </p>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-foreground transition-colors duration-300 group-hover:text-accent md:text-3xl">
                    {row.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
                    {row.body}
                  </p>
                </div>
              </BlurReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
