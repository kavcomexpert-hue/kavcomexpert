import {
  AboutHero,
  AboutMissionVisionValues,
  AboutWho,
  AboutWhy,
} from "@/components/site/about/about-sections";
import { AboutSocialProof } from "@/components/site/about/about-social-proof";
import { FaqSection } from "@/components/site/home/faq-section";
import { HomeCtaSection } from "@/components/site/home/home-cta-section";
import { LogoMarqueeSection } from "@/components/site/home/logo-marquee-section";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbListSchema } from "@/lib/schema/breadcrumbs";
import {
  getAboutPageSections,
  getHomePageSections,
  systemPageMetadata,
} from "@/lib/pages/system-page-content";
import { getContentMap, getLinkButtonMap } from "@/lib/queries/content-blocks";
import {
  getAllTestimonials,
  getVideoTestimonials,
} from "@/lib/queries/testimonials";
import { hasItems } from "@/lib/site/optional-section";
import { buildStaticMetaFromKey } from "@/lib/seo/metadata";
import type { Metadata } from "next";

const ABOUT_HERO_KEYS = [
  "about.hero.eyebrow",
  "about.hero.headline",
  "about.hero.subtext",
] as const;

const ABOUT_LINK_KEYS = ["about.hero.cta", "about.why.cta"] as const;

export async function generateMetadata(): Promise<Metadata> {
  return systemPageMetadata("about-us", "/about-us", () =>
    buildStaticMetaFromKey("about"),
  );
}

export default async function AboutUsPage() {
  let testimonials: Awaited<ReturnType<typeof getAllTestimonials>> = [];
  let videos: Awaited<ReturnType<typeof getVideoTestimonials>> = [];

  try {
    [testimonials, videos] = await Promise.all([
      getAllTestimonials(),
      getVideoTestimonials(),
    ]);
  } catch {
    testimonials = [];
    videos = [];
  }

  const [aboutHero, aboutLinks, sections, homeSections] = await Promise.all([
    getContentMap(ABOUT_HERO_KEYS),
    getLinkButtonMap(ABOUT_LINK_KEYS),
    getAboutPageSections(),
    getHomePageSections(),
  ]);

  const faqs = sections.faqs.filter(
    (item) => item.question.trim() && item.answer.trim(),
  );

  return (
    <>
      <JsonLd
        data={buildBreadcrumbListSchema([
          { label: "Home", href: "/" },
          { label: "About Us" },
        ])}
      />
      <AboutHero
        eyebrow={aboutHero["about.hero.eyebrow"]}
        headline={aboutHero["about.hero.headline"]}
        subtext={aboutHero["about.hero.subtext"]}
        cta={aboutLinks["about.hero.cta"]}
      />
      <LogoMarqueeSection logos={homeSections.clientLogos} />
      <AboutMissionVisionValues
        eyebrow={sections.missionEyebrow}
        headline={sections.missionHeadline}
        items={sections.missionItems}
      />
      <AboutWho
        eyebrow={sections.whoEyebrow}
        headlineLead={sections.whoHeadlineLead}
        headlineAccent={sections.whoHeadlineAccent}
        body={sections.whoBody}
        tags={sections.whoTags.filter(Boolean)}
        highlights={sections.whoHighlights}
        stats={sections.whoStats}
      />
      <AboutSocialProof
        testimonials={testimonials}
        videos={hasItems(videos) ? videos : undefined}
        eyebrow={sections.socialProofEyebrow}
        headline={sections.socialProofHeadline}
      />
      <AboutWhy
        eyebrow={sections.whyEyebrow}
        headlineLead={sections.whyHeadlineLead}
        headlineAccent={sections.whyHeadlineAccent}
        body={sections.whyBody}
        reasons={sections.whyReasons}
        cta={aboutLinks["about.why.cta"]}
      />
      {hasItems(faqs) ? (
        <FaqSection
          items={faqs}
          eyebrow={sections.faqEyebrow}
          headline={sections.faqHeadline}
          hideDescription
        />
      ) : null}
      <HomeCtaSection />
    </>
  );
}
