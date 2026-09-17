import dynamic from "next/dynamic";
import { HeroSection } from "@/components/site/home/hero-section";
import { HomeCtaSection } from "@/components/site/home/home-cta-section";
import { SectionErrorBoundary } from "@/components/site/section-error-boundary";
import { JsonLd } from "@/components/seo/json-ld";
import {
  getHomePageSections,
  systemPageMetadata,
} from "@/lib/pages/system-page-content";
import { getContentMap, getLinkButtonMap } from "@/lib/queries/content-blocks";
import { getServices } from "@/lib/queries/services";
import { getVideoTestimonials } from "@/lib/queries/testimonials";
import { getSiteSettings } from "@/lib/queries/site-settings";
import { buildHomeWebPageSchema } from "@/lib/schema/organization";
import {
  defaultDevServices,
  type HomeServiceCard,
} from "@/components/site/home/dev-services-section";
import {
  defaultGrowthServices,
} from "@/components/site/home/growth-services-section";
import type { HomePageSections } from "@/lib/pages/page-section-schemas";
import { enrichServiceCardsBySlug } from "@/lib/site/enrich-service-cards";
import { buildStaticMetaFromKey } from "@/lib/seo/metadata";
import type { Metadata } from "next";

function buildHomeServiceCards(
  cmsCards: HomePageSections["devServiceCards"],
  defaults: HomeServiceCard[],
): HomeServiceCard[] {
  if (!cmsCards.length) return defaults;
  return cmsCards.map((card) => {
    const slug =
      card.slug.trim() ||
      card.href.split("/").filter(Boolean).pop() ||
      "";
    const match =
      defaults.find((item) => {
        const itemSlug = item.href.split("/").filter(Boolean).pop();
        return (
          (slug.length > 0 && itemSlug === slug) ||
          (card.name.length > 0 && item.name === card.name)
        );
      }) ?? defaults[0]!;
    return {
      name: card.name || match.name,
      href: card.href || match.href,
      description: card.description || match.description,
      icon: match.icon,
    };
  });
}

const LogoMarqueeSection = dynamic(
  () =>
    import("@/components/site/home/logo-marquee-section").then(
      (m) => m.LogoMarqueeSection,
    ),
  {
    loading: () => (
      <div
        className="border-y border-border bg-surface py-4 md:py-5"
        style={{ minHeight: "4.5rem" }}
        aria-hidden
      />
    ),
  },
);

const AboutSection = dynamic(() =>
  import("@/components/site/home/about-section").then((m) => m.AboutSection),
);
const DevServicesSection = dynamic(() =>
  import("@/components/site/home/dev-services-section").then(
    (m) => m.DevServicesSection,
  ),
);
const ServiceTicker = dynamic(() =>
  import("@/components/site/home/service-ticker").then((m) => m.ServiceTicker),
);
const GrowthServicesSection = dynamic(() =>
  import("@/components/site/home/growth-services-section").then(
    (m) => m.GrowthServicesSection,
  ),
);
const WhySection = dynamic(() =>
  import("@/components/site/home/why-section").then((m) => m.WhySection),
);
const ProcessSection = dynamic(() =>
  import("@/components/site/home/process-section").then(
    (m) => m.ProcessSection,
  ),
);
const VideoTestimonialsSection = dynamic(() =>
  import("@/components/site/home/video-testimonials-section").then(
    (m) => m.VideoTestimonialsSection,
  ),
);
const BenefitsSection = dynamic(() =>
  import("@/components/site/home/benefits-section").then(
    (m) => m.BenefitsSection,
  ),
);
const FaqSection = dynamic(() =>
  import("@/components/site/home/faq-section").then((m) => m.FaqSection),
);

const HOME_CONTENT_KEYS = [
  "home.hero.eyebrow",
  "home.hero.headline_line1",
  "home.hero.headline_line2",
  "home.hero.subtext",
  "home.about.eyebrow",
  "home.about.headline",
  "home.about.body",
  "home.about.row1_title",
  "home.about.row1_body",
  "home.about.row2_title",
  "home.about.row2_body",
  "home.about.row3_title",
  "home.about.row3_body",
  "home.cta.eyebrow",
  "home.cta.headline",
  "home.cta.body",
  "home.cta.email_pref",
  "home.cta.email",
  "home.cta.watermark",
  "home.why.eyebrow",
  "home.why.headline",
  "home.why.body",
  "home.process.eyebrow",
  "home.process.headline",
  "home.benefits.eyebrow",
  "home.benefits.headline",
  "home.benefits.subtext",
  "home.dev.eyebrow",
  "home.dev.headline",
  "home.growth.eyebrow",
  "home.growth.headline",
  "home.testimonials.eyebrow",
  "home.testimonials.headline",
  "home.faq.eyebrow",
  "home.faq.headline",
] as const;

const HOME_LINK_KEYS = [
  "home.hero.cta_primary",
  "home.hero.cta_secondary",
  "home.about.cta",
  "home.why.cta",
  "home.dev.cta",
  "home.growth.cta",
  "home.testimonials.cta",
  "home.faq.cta",
  "home.cta.button",
] as const;

export async function generateMetadata(): Promise<Metadata> {
  return systemPageMetadata("home", "/", () => buildStaticMetaFromKey("home"));
}

export default async function HomePage() {
  const [dbServices, videoTestimonials, content, links, settings, homeSections] =
    await Promise.all([
      getServices(),
      getVideoTestimonials(),
      getContentMap(HOME_CONTENT_KEYS),
      getLinkButtonMap(HOME_LINK_KEYS),
      getSiteSettings(),
      getHomePageSections(),
    ]);

  const homeFaqs = homeSections.faqs.filter(
    (item) => item.question.trim() && item.answer.trim(),
  );

  const cmsVideoTestimonials = homeSections.videoTestimonials.map((item) => ({
    id: item.id,
    name: item.name,
    company: item.company,
    videoSrc: item.videoSrc || undefined,
    youtubeId: item.youtubeId || undefined,
    posterSrc: item.posterSrc || undefined,
  }));

  const devServices = enrichServiceCardsBySlug(
    buildHomeServiceCards(homeSections.devServiceCards, defaultDevServices),
    dbServices,
    { preferCardDescription: true },
  );
  const growthServices = enrichServiceCardsBySlug(
    buildHomeServiceCards(
      homeSections.growthServiceCards,
      defaultGrowthServices,
    ),
    dbServices,
    { preferCardDescription: true },
  );

  return (
    <>
      <JsonLd data={[buildHomeWebPageSchema(settings)]} />
      <SectionErrorBoundary label="home-hero">
        <HeroSection
          eyebrow={content["home.hero.eyebrow"]}
          headlineLine1={content["home.hero.headline_line1"]}
          headlineLine2={content["home.hero.headline_line2"]}
          subtext={content["home.hero.subtext"]}
          ctaPrimary={links["home.hero.cta_primary"]}
          ctaSecondary={links["home.hero.cta_secondary"]}
          rotatingWords={homeSections.rotatingWords}
          techBadges={homeSections.techBadges}
        />
      </SectionErrorBoundary>
      <SectionErrorBoundary label="home-logos">
        <LogoMarqueeSection logos={homeSections.clientLogos} />
      </SectionErrorBoundary>
      <SectionErrorBoundary label="home-about">
        <AboutSection
          eyebrow={content["home.about.eyebrow"]}
          headline={content["home.about.headline"]}
          body={content["home.about.body"]}
          cta={links["home.about.cta"]}
          row1Title={content["home.about.row1_title"]}
          row1Body={content["home.about.row1_body"]}
          row2Title={content["home.about.row2_title"]}
          row2Body={content["home.about.row2_body"]}
          row3Title={content["home.about.row3_title"]}
          row3Body={content["home.about.row3_body"]}
        />
      </SectionErrorBoundary>
      <SectionErrorBoundary label="home-dev-services">
        <DevServicesSection
          services={devServices}
          eyebrow={content["home.dev.eyebrow"]}
          headline={content["home.dev.headline"]}
          cta={links["home.dev.cta"]}
        />
      </SectionErrorBoundary>
      <SectionErrorBoundary label="home-ticker">
        <ServiceTicker
          items={homeSections.tickerItems.filter(Boolean)}
        />
      </SectionErrorBoundary>
      <SectionErrorBoundary label="home-growth-services">
        <GrowthServicesSection
          services={growthServices}
          eyebrow={content["home.growth.eyebrow"]}
          headline={content["home.growth.headline"]}
          cta={links["home.growth.cta"]}
        />
      </SectionErrorBoundary>
      <SectionErrorBoundary label="home-why">
        <WhySection
          eyebrow={content["home.why.eyebrow"]}
          headline={content["home.why.headline"]}
          body={content["home.why.body"]}
          cta={links["home.why.cta"]}
          reasonItems={homeSections.whyReasons}
        />
      </SectionErrorBoundary>
      <SectionErrorBoundary label="home-process">
        <ProcessSection
          eyebrow={content["home.process.eyebrow"]}
          headline={content["home.process.headline"]}
          steps={homeSections.processSteps}
        />
      </SectionErrorBoundary>
      <SectionErrorBoundary label="home-video-testimonials">
        <VideoTestimonialsSection
          items={
            videoTestimonials.length > 0
              ? videoTestimonials
              : cmsVideoTestimonials
          }
          eyebrow={content["home.testimonials.eyebrow"]}
          headline={content["home.testimonials.headline"]}
          cta={links["home.testimonials.cta"]}
        />
      </SectionErrorBoundary>
      <SectionErrorBoundary label="home-benefits">
        <BenefitsSection
          eyebrow={content["home.benefits.eyebrow"]}
          headline={content["home.benefits.headline"]}
          subtext={content["home.benefits.subtext"]}
          items={homeSections.benefits}
        />
      </SectionErrorBoundary>
      <SectionErrorBoundary label="home-faq">
        <FaqSection
          items={homeFaqs}
          eyebrow={content["home.faq.eyebrow"]}
          headline={content["home.faq.headline"]}
          cta={links["home.faq.cta"]}
        />
      </SectionErrorBoundary>
      <SectionErrorBoundary label="home-cta">
        <HomeCtaSection
          eyebrow={content["home.cta.eyebrow"]}
          headline={content["home.cta.headline"]}
          body={content["home.cta.body"]}
          cta={links["home.cta.button"]}
          emailPrefLabel={content["home.cta.email_pref"]}
          emailAddress={content["home.cta.email"]}
          watermark={content["home.cta.watermark"]}
        />
      </SectionErrorBoundary>
    </>
  );
}
