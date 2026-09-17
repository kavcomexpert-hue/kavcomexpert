import { FaqSection } from "@/components/site/home/faq-section";
import { HomeCtaSection } from "@/components/site/home/home-cta-section";
import { Ambient } from "@/components/site/home/motion/ambient";
import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import { ProcessSection } from "@/components/site/home/process-section";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { SectionErrorBoundary } from "@/components/site/section-error-boundary";
import { JsonLd } from "@/components/seo/json-ld";
import { SafeImage } from "@/components/site/safe-image";
import { ServiceHeroIllustration } from "@/components/site/service-page/service-hero-illustration";
import { ServiceHeroLottieLoader } from "@/components/site/service-page/service-hero-lottie-loader";
import { ServiceHeroSpline } from "@/components/site/service-page/service-hero-spline";
import { ServiceTagsStrip } from "@/components/site/service-page/service-tags-strip";
import { ServiceTextBlocks } from "@/components/site/service-page/service-text-blocks";
import { ServiceWorkSlider } from "@/components/site/service-page/service-work-slider";
import {
  buildStaticServiceSchema,
  buildStaticServiceWebPageSchema,
} from "@/lib/schema/static-service";
import { buildBreadcrumbListSchema } from "@/lib/schema/breadcrumbs";
import { hasItems } from "@/lib/site/optional-section";
import type { StaticServicePage } from "@/lib/site/service-pages/types";
import { SiteLinkButton } from "@/components/site/site-link-button";
import { linkButton } from "@/lib/content/link-button";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import Link from "next/link";

type ServiceDetailTemplateProps = {
  page: StaticServicePage;
  organizationName: string;
  /** When true, template does not emit default JSON-LD (caller provides it). */
  skipDefaultSchema?: boolean;
  /** Override default Home → Services → name crumbs (e.g. CMS marketing pages). */
  breadcrumbs?: { label: string; href?: string }[];
};

function isSvgOrGifUrl(url: string) {
  return /\.(svg|gif)(\?|$)/i.test(url);
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes("video/");
}

function isLottieUrl(url: string) {
  return /\.json(\?|$)/i.test(url);
}

const OFFERING_SPANS = [
  "md:col-span-7",
  "md:col-span-5",
  "md:col-span-5",
  "md:col-span-7",
  "md:col-span-6",
  "md:col-span-6",
  "md:col-span-4",
  "md:col-span-4",
  "md:col-span-4",
] as const;

const WHY_TONES = ["dark", "accent", "dark"] as const;

const whyToneClasses = {
  dark: "bg-foreground text-background dark:bg-surface dark:text-foreground dark:border dark:border-border",
  accent: "bg-accent text-surface",
} as const;

const whyToneGhost = {
  dark: "text-background/[0.07] dark:text-foreground/[0.06]",
  accent: "text-surface/10",
} as const;

const whyToneBody = {
  dark: "text-background/70 dark:text-muted",
  accent: "text-surface/85",
} as const;

export function ServiceDetailTemplate({
  page,
  organizationName,
  skipDefaultSchema = false,
  breadcrumbs: breadcrumbsProp,
}: ServiceDetailTemplateProps) {
  const heroVisualMode = page.heroVisual?.mode ?? "animation";
  const heroMediaUrl = page.heroVisual?.mediaUrl?.trim();
  const shouldRenderMedia = heroVisualMode === "media" && Boolean(heroMediaUrl);
  const shouldRenderSpline =
    heroVisualMode === "animation" && Boolean(page.heroSplineScene);

  const breadcrumbs = breadcrumbsProp ?? [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: page.name },
  ];

  const schemaGraph: Array<Record<string, unknown>> = skipDefaultSchema
    ? []
    : [
        buildBreadcrumbListSchema(breadcrumbs),
        buildStaticServiceSchema(page, organizationName),
        buildStaticServiceWebPageSchema(page, organizationName),
      ];

  const nameParts = (page.name ?? "").trim().split(/\s+/);
  const nameLead = nameParts.slice(0, -1).join(" ");
  const nameAccent = nameParts.at(-1) ?? "";

  const whyWords = (page.whyHeadline ?? "").trim().split(/\s+/);
  const whySplit = Math.max(1, whyWords.length - 3);
  const whyLead = whyWords.slice(0, whySplit).join(" ");
  const whyAccent = whyWords.slice(whySplit).join(" ");

  return (
    <>
      {schemaGraph.length > 0 ? <JsonLd data={schemaGraph} /> : null}

      {/* Hero */}
      <SectionErrorBoundary label="service-hero">
      <section className="relative overflow-clip bg-background pb-16 pt-28 md:pb-24 md:pt-36">
        <Ambient />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-[12%] top-[8%] size-[min(52vw,420px)] rounded-full bg-accent/10 blur-3xl dark:bg-accent/20"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-[8%] bottom-[0%] size-[min(40vw,280px)] rounded-full bg-accent-lime/15 blur-3xl"
        />

        <div className="relative mx-auto max-w-[1120px] px-6">
          <Breadcrumbs items={breadcrumbs} />

          <div className="mt-10 grid items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
            <div className="max-w-2xl">
              <p
                className="animate-enter text-sm font-medium text-accent"
                style={{ animationDelay: "0.05s" }}
              >
                {page.heroEyebrow?.trim() ||
                  `${page.platformLabel} development`}
              </p>
              <h1
                className="animate-enter mt-5 text-balance text-[clamp(2.75rem,7vw,5rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-foreground [text-wrap:balance]"
                style={{ animationDelay: "0.12s" }}
              >
                {nameLead ? `${nameLead} ` : null}
                <span className="text-accent">{nameAccent}</span>
              </h1>
              {page.aeoSummary?.trim() ? (
                <p
                  className="animate-enter mt-6 text-base leading-relaxed text-muted md:text-lg"
                  style={{ animationDelay: "0.2s" }}
                >
                  {page.aeoSummary}
                </p>
              ) : null}
              {page.intro?.trim() &&
              page.intro.trim() !== page.aeoSummary?.trim() ? (
                <p
                  className={`animate-enter text-base leading-relaxed text-muted md:text-lg ${
                    page.aeoSummary?.trim() ? "mt-4" : "mt-6"
                  }`}
                  style={{
                    animationDelay: page.aeoSummary?.trim() ? "0.28s" : "0.2s",
                  }}
                >
                  {page.intro}
                </p>
              ) : null}
              {page.introContinued ? (
                <p
                  className="animate-enter mt-4 text-base leading-relaxed text-muted"
                  style={{ animationDelay: "0.28s" }}
                >
                  {page.introContinued}
                </p>
              ) : null}

              <div
                className="animate-enter mt-9 flex flex-wrap gap-3"
                style={{ animationDelay: "0.36s" }}
              >
                <SiteLinkButton
                  button={
                    page.heroCtaPrimary ??
                    linkButton("Get in touch", "/contact-us")
                  }
                  className="group inline-flex h-12 items-center justify-center gap-3 rounded-full bg-accent py-3 pl-6 pr-3 text-sm font-medium text-surface transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
                >
                  <>
                    {(page.heroCtaPrimary ?? linkButton("Get in touch", "/contact-us"))
                      .label}
                    <span
                      aria-hidden="true"
                      className="flex size-7 items-center justify-center rounded-full bg-surface/20 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-45"
                    >
                      <ArrowUpRight
                        className="size-4"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </span>
                  </>
                </SiteLinkButton>
                <SiteLinkButton
                  button={
                    page.heroCtaSecondary ??
                    linkButton("View our work", "#service-work")
                  }
                  className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-surface px-6 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
                />
              </div>
            </div>

            <div
              className="animate-enter relative mx-auto flex w-full max-w-md items-center justify-center lg:mx-0 lg:justify-self-end"
              style={{ animationDelay: "0.18s" }}
            >
              {shouldRenderMedia && heroMediaUrl ? (
                isLottieUrl(heroMediaUrl) ? (
                  <ServiceHeroLottieLoader
                    src={heroMediaUrl}
                    label={`${page.name} hero visual`}
                  />
                ) : isVideoUrl(heroMediaUrl) ? (
                  <div className="relative aspect-square w-full overflow-hidden bg-transparent">
                    <video
                      src={heroMediaUrl}
                      className="size-full object-contain bg-transparent"
                      muted
                      playsInline
                      loop
                      autoPlay
                      aria-label={`${page.name} hero visual`}
                    />
                  </div>
                ) : (
                  <div className="relative aspect-square w-full bg-transparent">
                    <SafeImage
                      src={heroMediaUrl}
                      alt={`${page.name} hero visual`}
                      fill
                      sizes="(max-width: 1024px) 90vw, 420px"
                      className="object-contain bg-transparent"
                      unoptimized={isSvgOrGifUrl(heroMediaUrl)}
                    />
                  </div>
                )
              ) : shouldRenderSpline && page.heroSplineScene ? (
                <ServiceHeroSpline
                  scene={page.heroSplineScene}
                  slug={page.slug}
                  platformLabel={page.platformLabel}
                  tags={page.tags}
                />
              ) : (
                <ServiceHeroIllustration
                  slug={page.slug}
                  platformLabel={page.platformLabel}
                  tags={page.tags}
                />
              )}
            </div>
          </div>
        </div>
      </section>
      </SectionErrorBoundary>

      <SectionErrorBoundary label="service-tags">
        {hasItems(page.tags) ? <ServiceTagsStrip tags={page.tags} /> : null}
      </SectionErrorBoundary>

      {/* Key features, editorial rows (homepage About pattern) */}
      <SectionErrorBoundary label="service-features">
      {hasItems(page.features) ? (
      <section className="relative overflow-clip bg-background py-20 md:py-32">
        <Ambient />
        <div className="relative mx-auto max-w-[1120px] px-6">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <BlurReveal>
                <p className="text-sm font-medium text-accent">
                  {page.featuresEyebrow}
                </p>
                <h2 className="mt-4 text-balance text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground">
                  {page.featuresHeadline}
                </h2>
                <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
                  {page.featuresIntro}
                </p>
              </BlurReveal>
            </div>

            <div>
              {page.features.map((feature, index) => {
                const n = String(index + 1).padStart(2, "0");
                return (
                  <BlurReveal
                    key={feature.slice(0, 48)}
                    delay={index * 0.06}
                    className="group relative border-t border-border py-10 last:border-b md:py-12"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 select-none text-[6rem] font-semibold leading-none tracking-[-0.06em] text-accent/[0.08] transition-[color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-[60%] group-hover:text-accent/20 md:text-[8rem]"
                    >
                      {n}
                    </span>
                    <div className="relative grid gap-4 md:grid-cols-[4.5rem_minmax(0,1fr)]">
                      <p className="text-sm font-medium tabular-nums text-muted">
                        {n}
                      </p>
                      <p className="max-w-xl text-sm leading-relaxed text-muted md:text-base">
                        {feature}
                      </p>
                    </div>
                  </BlurReveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      ) : null}
      </SectionErrorBoundary>

      {/* Offerings, asymmetric bento (homepage Benefits pattern) */}
      <SectionErrorBoundary label="service-offerings">
      {hasItems(page.offerings) ? (
      <section className="relative overflow-clip border-t border-border bg-surface py-20 md:py-32">
        <Ambient flip />
        <div className="relative mx-auto max-w-[1120px] px-6">
          <BlurReveal className="mb-14 max-w-3xl">
            <p className="text-sm font-medium text-accent">
              {page.offeringsEyebrow}
            </p>
            <h2 className="mt-4 text-balance text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground">
              {page.offeringsHeadline}
            </h2>
          </BlurReveal>

          <div className="grid gap-4 md:grid-cols-12">
            {page.offerings.map((offering, index) => {
              const spanClass = OFFERING_SPANS[index] ?? "md:col-span-6";
              const cardClass =
                "group relative flex h-full flex-col overflow-hidden rounded-default border border-border bg-background p-7 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-soft dark:hover:shadow-glow md:p-9";

              const cardInner = (
                <>
                  <div
                    aria-hidden="true"
                    className="absolute -bottom-14 -right-14 size-36 rounded-full bg-accent-lime/0 blur-2xl transition-[background-color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-125 group-hover:bg-accent-lime/20 dark:group-hover:bg-accent/15"
                  />
                  <div className="relative flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-full border border-border text-sm font-semibold tabular-nums text-muted transition-[background-color,color,border-color] duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-surface">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-xl text-muted/50 transition-[color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                    ><ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" /></span>
                  </div>
                  <h3 className="relative mt-8 max-w-md text-2xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground transition-colors duration-300 group-hover:text-accent">
                    {offering.title}
                  </h3>
                  <p className="relative mt-3 max-w-xl flex-1 text-sm leading-relaxed text-muted md:text-[0.95rem]">
                    {offering.description}
                  </p>
                </>
              );

              return (
                <BlurReveal
                  key={offering.title}
                  as="article"
                  delay={index * 0.06}
                  className={`${spanClass} h-full min-w-0`}
                >
                  {offering.href ? (
                    <Link href={offering.href} className={`${cardClass} h-full`}>
                      {cardInner}
                    </Link>
                  ) : (
                    <div className={`${cardClass} h-full`}>{cardInner}</div>
                  )}
                </BlurReveal>
              );
            })}
          </div>
        </div>
      </section>
      ) : null}
      </SectionErrorBoundary>

      {/* Why platform, stacking cards (homepage Why pattern) */}
      <SectionErrorBoundary label="service-why">
      {hasItems(page.whyReasons) ? (
      <section className="relative overflow-clip bg-background py-20 md:py-32">
        <Ambient />
        <div className="relative mx-auto max-w-[1120px] px-6">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <BlurReveal>
                <p className="text-sm font-medium text-accent">
                  {page.whyEyebrow}
                </p>
                <h2 className="mt-4 text-balance text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground">
                  {whyLead}{" "}
                  <span className="text-accent">{whyAccent}</span>
                </h2>
                <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
                  {page.whyIntro}
                </p>
                <SiteLinkButton
                  button={
                    page.whyCta ?? linkButton("Start a project", "/contact-us")
                  }
                  className="group mt-8 inline-flex items-center gap-2 text-sm font-medium text-foreground"
                >
                  <>
                    {(page.whyCta ?? linkButton("Start a project", "/contact-us"))
                      .label}
                    <span
                      aria-hidden="true"
                      className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5"
                    >
                      <ChevronRight
                        className="size-4"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </span>
                  </>
                </SiteLinkButton>
              </BlurReveal>
            </div>

            <div>
              {page.whyReasons.map((reason, index) => {
                const tone = WHY_TONES[index] ?? "dark";
                const n = String(index + 1).padStart(2, "0");
                return (
                  <div
                    key={reason.title}
                    className="lg:sticky"
                    style={{ top: `${7 + index * 2}rem` }}
                  >
                    <BlurReveal delay={index * 0.06} className="mb-6 lg:mb-10">
                      <article
                        className={`relative min-h-[260px] overflow-hidden rounded-default p-8 shadow-soft md:min-h-[300px] md:p-10 ${whyToneClasses[tone]}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none absolute -right-4 -top-10 select-none text-[11rem] font-semibold leading-none tracking-[-0.06em] ${whyToneGhost[tone]}`}
                        >
                          {n}
                        </span>
                        <div className="relative flex items-center gap-4">
                          <span className="text-sm font-medium tabular-nums opacity-70">
                            {n} /{" "}
                            {String(page.whyReasons.length).padStart(2, "0")}
                          </span>
                          <span
                            aria-hidden="true"
                            className="h-px w-16 bg-current opacity-30"
                          />
                        </div>
                        <h3 className="relative mt-10 max-w-md text-2xl font-semibold tracking-[-0.02em] md:text-3xl">
                          {reason.title}
                        </h3>
                        <p
                          className={`relative mt-4 max-w-md text-sm leading-relaxed md:text-base ${whyToneBody[tone]}`}
                        >
                          {reason.body}
                        </p>
                      </article>
                    </BlurReveal>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      ) : null}
      </SectionErrorBoundary>

      <SectionErrorBoundary label="service-process">
        {page.showProcess !== false &&
        (page.processSteps === undefined || hasItems(page.processSteps)) ? (
          <ProcessSection
            eyebrow={page.processEyebrow}
            headline={page.processHeadline}
            steps={page.processSteps}
          />
        ) : null}
      </SectionErrorBoundary>

      <SectionErrorBoundary label="service-work">
        {hasItems(page.workItems) ? (
          <div id="service-work">
            <ServiceWorkSlider
              eyebrow={page.workEyebrow}
              headline={page.workHeadline}
              items={page.workItems}
            />
          </div>
        ) : null}
      </SectionErrorBoundary>

      <SectionErrorBoundary label="service-text">
        {hasItems(page.textBlocks) ? (
          <ServiceTextBlocks blocks={page.textBlocks ?? []} />
        ) : null}
      </SectionErrorBoundary>

      <SectionErrorBoundary label="service-faqs">
        {hasItems(page.faqs) ? (
          <FaqSection
            items={page.faqs}
            eyebrow={page.faqsEyebrow ?? "FAQ"}
            headline={
              page.faqsHeadline ?? "Let's address your questions today!"
            }
            cta={page.faqsCta}
            hideDescription
          />
        ) : null}
      </SectionErrorBoundary>

      <SectionErrorBoundary label="service-cta">
        {page.showBottomCta === false ? null : (
          <HomeCtaSection
            eyebrow={page.bottomCtaEyebrow}
            headline={page.bottomCtaHeadline}
            emailAddress={page.bottomCtaEmail}
            watermark={page.bottomCtaWatermark}
            cta={page.bottomCtaButton}
          />
        )}
      </SectionErrorBoundary>
    </>
  );
}
