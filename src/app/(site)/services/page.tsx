import { ServiceCard } from "@/components/site/home/dev-services-section";
import { FaqSection } from "@/components/site/home/faq-section";
import {
  getHomePageSections,
  getServicesPageSections,
} from "@/lib/pages/system-page-content";
import { HomeCtaSection } from "@/components/site/home/home-cta-section";
import { Ambient } from "@/components/site/home/motion/ambient";
import {
  IconAndroid,
  IconAssistant,
  IconAws,
  IconCloudflare,
  IconErp,
  IconFacebookAds,
  IconFullStack,
  IconGoogleAds,
  IconGraphic,
  IconIos,
  IconLinkedInAds,
  IconMagento,
  IconMigration,
  IconPayment,
  IconSeo,
  IconShopify,
  IconSocial,
  IconUiUx,
  IconVideo,
  IconWooCommerce,
  IconWordPress,
} from "@/components/site/home/motion/tech-icons";
import { ServiceTicker } from "@/components/site/home/service-ticker";
import { ServicesHeroNav } from "@/components/site/services-hero-nav";
import { TechStackSection } from "@/components/site/tech-stack-section";
import { systemPageMetadata } from "@/lib/pages/system-page-content";
import { getContentMap } from "@/lib/queries/content-blocks";
import { getServices } from "@/lib/queries/services";
import { enrichServiceCardsBySlug } from "@/lib/site/enrich-service-cards";
import { buildStaticMetaFromKey } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export async function generateMetadata(): Promise<Metadata> {
  return systemPageMetadata("services", "/services", () =>
    buildStaticMetaFromKey("services"),
  );
}

type ServiceEntry = {
  name: string;
  href: string;
  description: string;
  icon: ReactNode;
};

const devServices: ServiceEntry[] = [
  {
    name: "WordPress Development",
    href: "/services/wordpress-development",
    description:
      "Custom, scalable WordPress websites built for performance, security, SEO, easy management, and growth.",
    icon: <IconWordPress />,
  },
  {
    name: "Shopify Development",
    href: "/services/shopify-development",
    description:
      "High-converting Shopify stores with custom themes, apps, secure payments, and seamless user experiences.",
    icon: <IconShopify />,
  },
  {
    name: "WooCommerce Development",
    href: "/services/woocommerce-development",
    description:
      "Powerful WooCommerce solutions for flexible online stores, payments, inventory management, and scalability.",
    icon: <IconWooCommerce />,
  },
  {
    name: "Magento Development",
    href: "/services/magento-development",
    description:
      "Enterprise-grade Magento stores delivering speed, security, customization, integrations, and high performance.",
    icon: <IconMagento />,
  },
  {
    name: "Full-Stack Development",
    href: "/services/full-stack-development",
    description:
      "End-to-end development covering frontend, backend, databases, APIs, security, deployment, and scalability.",
    icon: <IconFullStack />,
  },
  {
    name: "Migration Services",
    href: "/services/migration-services",
    description:
      "Seamless data and platform migration ensuring zero downtime, data integrity, security, and continuity.",
    icon: <IconMigration />,
  },
  {
    name: "iOS App Development",
    href: "/services/ios-app-development",
    description:
      "High-performance iOS applications with intuitive design, security, scalability, and smooth user experiences.",
    icon: <IconIos />,
  },
  {
    name: "Android App Development",
    href: "/services/android-app-development",
    description:
      "Feature-rich Android applications built for performance, compatibility, scalability, and user engagement.",
    icon: <IconAndroid />,
  },
  {
    name: "ERP Solutions",
    href: "/services/erp-solutions",
    description:
      "Custom ERP systems streamlining operations, finance, HR, inventory, reporting, automation, and decision-making.",
    icon: <IconErp />,
  },
];

const marketingServices: ServiceEntry[] = [
  {
    name: "Virtual Assistant",
    href: "/services/virtual-assistant",
    description:
      "Dedicated virtual assistants handling admin, customer support, scheduling, research, CRM, and daily operations efficiently.",
    icon: <IconAssistant />,
  },
  {
    name: "SEO & AI SEO Optimization",
    href: "/services/seo-ai-optimization",
    description:
      "AI-powered SEO optimization improving rankings, traffic, technical health, content quality, conversions, and online visibility.",
    icon: <IconSeo />,
  },
  {
    name: "Social Media Marketing",
    href: "/services/social-media-marketing",
    description:
      "Strategic social media marketing boosting brand awareness, engagement, leads, traffic, and customer loyalty consistently.",
    icon: <IconSocial />,
  },
  {
    name: "Google Ads",
    href: "/services/google-ads",
    description:
      "Result-driven Google Ads campaigns maximizing clicks, leads, conversions, ROI, and measurable business growth.",
    icon: <IconGoogleAds />,
  },
  {
    name: "Facebook Ads",
    href: "/services/facebook-ads",
    description:
      "High-performing Facebook ad campaigns targeting ideal audiences, increasing engagement, conversions, sales, and revenue.",
    icon: <IconFacebookAds />,
  },
  {
    name: "LinkedIn Ads",
    href: "/services/linkedin-ads",
    description:
      "B2B-focused LinkedIn advertising generating qualified leads, brand authority, engagement, and sales opportunities globally.",
    icon: <IconLinkedInAds />,
  },
  {
    name: "Video Editing",
    href: "/services/video-editing",
    description:
      "Professional video editing delivering engaging visuals, smooth transitions, branding, subtitles, and storytelling impact.",
    icon: <IconVideo />,
  },
  {
    name: "Graphic Designing",
    href: "/services/graphic-designing",
    description:
      "Creative graphic design services crafting logos, branding, marketing assets, social creatives, and visuals professionally.",
    icon: <IconGraphic />,
  },
  {
    name: "UI/UX Design",
    href: "/services/ui-ux-design",
    description:
      "User-centered UI/UX design creating intuitive interfaces, seamless journeys, higher engagement, and conversion rates.",
    icon: <IconUiUx />,
  },
];

const addonServices: ServiceEntry[] = [
  {
    name: "Cloudflare Integration",
    href: "/services/cloudflare-integration",
    description:
      "Cloudflare integration enhancing website security, performance, CDN delivery, DDoS protection, and reliability globally.",
    icon: <IconCloudflare />,
  },
  {
    name: "Payment Integration",
    href: "/services/payment-integration",
    description:
      "Secure payment gateway integration supporting multiple methods, currencies, fraud protection, and compliance standards worldwide.",
    icon: <IconPayment />,
  },
  {
    name: "AWS Services",
    href: "/services/aws-services",
    description:
      "Scalable AWS cloud services for hosting, storage, security, automation, deployment, and cost optimization globally.",
    icon: <IconAws />,
  },
];

function ServicesHero({
  eyebrow,
  headline,
  headlineAccent,
  subtext,
  heroNavPills,
}: {
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  subtext: string;
  heroNavPills?: readonly { label: string; href: string }[];
}) {
  return (
    <section className="relative overflow-clip bg-background pb-16 pt-32 text-center md:pb-24 md:pt-44">
      <Ambient />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-full opacity-40"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--border) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(ellipse at 50% 0%, black 10%, transparent 65%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 0%, black 10%, transparent 65%)",
        }}
      />
      <div className="relative mx-auto flex max-w-[1120px] flex-col items-center px-6">
        <div className="animate-enter" style={{ animationDelay: "0.05s" }}>
          <p className="inline-flex items-center gap-2.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted">
            <span className="relative flex size-2" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-lime opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-accent-lime" />
            </span>
            {eyebrow}
          </p>
        </div>
        <h1
          className="animate-enter mt-8 max-w-3xl text-balance text-[clamp(2.5rem,6.5vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-foreground [text-wrap:balance]"
          style={{ animationDelay: "0.14s" }}
        >
          {headline}{" "}
          <span className="whitespace-nowrap text-accent">{headlineAccent}</span>
        </h1>
        <p
          className="animate-enter mt-6 max-w-xl text-balance text-base leading-relaxed text-muted md:text-lg"
          style={{ animationDelay: "0.26s" }}
        >
          {subtext}
        </p>
        <ServicesHeroNav items={heroNavPills} />
      </div>
    </section>
  );
}

function ServiceGroupSection({
  id,
  eyebrow,
  headline,
  subtext,
  services,
  className,
  flip = false,
}: {
  id: string;
  eyebrow: string;
  headline: string;
  subtext: string;
  services: ServiceEntry[];
  className: string;
  flip?: boolean;
}) {
  return (
    <section
      id={id}
      className={`relative scroll-mt-24 overflow-clip py-20 md:py-28 ${className}`}
    >
      <Ambient flip={flip} />
      <div className="relative mx-auto max-w-[1120px] px-6">
        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-accent">{eyebrow}</p>
            <h2 className="mt-4 max-w-xl text-balance text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground">
              {headline}
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted md:text-base">
            {subtext}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <ServiceCard
              key={service.name}
              service={service}
              index={index}
              delay={0}
              animate={false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

const SERVICES_CONTENT_KEYS = [
  "services.hero.eyebrow",
  "services.hero.headline",
  "services.hero.headline_accent",
  "services.hero.subtext",
  "services.dev.eyebrow",
  "services.dev.headline",
  "services.dev.subtext",
  "services.marketing.eyebrow",
  "services.marketing.headline",
  "services.marketing.subtext",
  "services.addons.eyebrow",
  "services.addons.headline",
  "services.addons.subtext",
] as const;

export default async function ServicesIndexPage() {
  const [dbServices, content, sections, homeSections] = await Promise.all([
    getServices(),
    getContentMap(SERVICES_CONTENT_KEYS),
    getServicesPageSections(),
    getHomePageSections(),
  ]);
  const resolvedDev = enrichServiceCardsBySlug(devServices, dbServices);
  const resolvedMarketing = enrichServiceCardsBySlug(
    marketingServices,
    dbServices,
  );
  const resolvedAddons = enrichServiceCardsBySlug(addonServices, dbServices);
  const faqs = sections.faqs.filter(
    (item) => item.question.trim() && item.answer.trim(),
  );
  const tickerItems = homeSections.tickerItems.filter(Boolean);

  return (
    <>
      <ServicesHero
        eyebrow={content["services.hero.eyebrow"]}
        headline={content["services.hero.headline"]}
        headlineAccent={content["services.hero.headline_accent"]}
        subtext={content["services.hero.subtext"]}
        heroNavPills={sections.heroNavPills}
      />

      <ServiceGroupSection
        id="web-development"
        eyebrow={content["services.dev.eyebrow"]}
        headline={content["services.dev.headline"]}
        subtext={content["services.dev.subtext"]}
        services={resolvedDev}
        className="border-t border-border bg-surface"
      />

      <ServiceTicker items={tickerItems.length > 0 ? tickerItems : undefined} />

      <ServiceGroupSection
        id="digital-marketing"
        eyebrow={content["services.marketing.eyebrow"]}
        headline={content["services.marketing.headline"]}
        subtext={content["services.marketing.subtext"]}
        services={resolvedMarketing}
        className="bg-surface"
        flip
      />

      <ServiceGroupSection
        id="add-on-services"
        eyebrow={content["services.addons.eyebrow"]}
        headline={content["services.addons.headline"]}
        subtext={content["services.addons.subtext"]}
        services={resolvedAddons}
        className="border-y border-border bg-surface"
      />

      <TechStackSection
        animated={false}
        eyebrow={sections.techEyebrow}
        headline={sections.techHeadline}
        body={sections.techBody}
        categories={sections.techCategories}
      />

      <FaqSection
        items={faqs}
        eyebrow={sections.faqEyebrow}
        headline={sections.faqHeadline}
        description={sections.faqDescription}
        cta={sections.faqCta}
      />

      <HomeCtaSection />
    </>
  );
}
