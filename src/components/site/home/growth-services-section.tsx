import { ServiceCard, type HomeServiceCard } from "@/components/site/home/dev-services-section";
import { Ambient } from "@/components/site/home/motion/ambient";
import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import {
  IconAssistant,
  IconGoogleAds,
  IconMarketing,
  IconSeo,
  IconSocial,
  IconVideo,
} from "@/components/site/home/motion/tech-icons";
import { SiteLinkButton } from "@/components/site/site-link-button";
import { linkButton, type LinkButton } from "@/lib/content/link-button";
import { servicePath } from "@/lib/paths";
import { ArrowUpRight } from "lucide-react";

const defaultServices: HomeServiceCard[] = [
  {
    name: "Digital Marketing",
    href: servicePath({ slug: "digital-marketing" }),
    description:
      "Integrated, data-driven campaigns across search, social, and email that generate qualified leads and measurable ROI.",
    icon: <IconMarketing />,
  },
  {
    name: "SEO & AI SEO Services",
    href: servicePath({
      slug: "seo-ai-optimization",
      parentSlug: "digital-marketing",
    }),
    description:
      "Organic rankings, technical performance, and AI-search visibility, content strategies that dominate results pages.",
    icon: <IconSeo />,
  },
  {
    name: "Google Ads",
    href: servicePath({ slug: "google-ads", parentSlug: "digital-marketing" }),
    description:
      "ROAS-focused search, display, and shopping campaigns with smart bidding, tracking, and continuous optimization.",
    icon: <IconGoogleAds />,
  },
  {
    name: "Social Media Marketing",
    href: servicePath({
      slug: "social-media-marketing",
      parentSlug: "digital-marketing",
    }),
    description:
      "Engaging content, community management, and paid social that turns followers into customers.",
    icon: <IconSocial />,
  },
  {
    name: "Video Editing",
    href: servicePath({
      slug: "video-editing",
      parentSlug: "digital-marketing",
    }),
    description:
      "Professional video production with color grading, motion graphics, and sound design for maximum engagement.",
    icon: <IconVideo />,
  },
  {
    name: "Virtual Assistant",
    href: servicePath({
      slug: "virtual-assistant",
      parentSlug: "digital-marketing",
    }),
    description:
      "Dedicated support for admin, customer service, content management, and scheduling, so you can focus on growth.",
    icon: <IconAssistant />,
  },
];

export const defaultGrowthServices: HomeServiceCard[] = defaultServices;

export function GrowthServicesSection({
  services = defaultServices,
  eyebrow = "Digital growth services",
  headline = "Marketing that moves the numbers",
  cta = linkButton("View all services", servicePath({ slug: "digital-marketing" })),
}: {
  services?: HomeServiceCard[];
  eyebrow?: string;
  headline?: string;
  cta?: LinkButton;
}) {
  return (
    <section className="relative overflow-clip border-b border-border bg-surface py-20 md:py-32">
      <Ambient />
      <div className="relative mx-auto max-w-[1120px] px-6">
        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <BlurReveal>
            <p className="text-sm font-medium text-accent">{eyebrow}</p>
            <h2 className="mt-4 max-w-xl text-balance text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground">
              {headline}
            </h2>
          </BlurReveal>
          <BlurReveal delay={0.1}>
            <SiteLinkButton
              button={cta}
              className="group inline-flex h-12 shrink-0 items-center justify-center gap-3 rounded-full border border-border bg-background py-3 pl-6 pr-3 text-sm font-medium text-foreground transition-colors duration-300 hover:border-accent hover:text-accent"
            >
              <>
                {cta.label}
                <span
                  aria-hidden="true"
                  className="flex size-7 items-center justify-center rounded-full bg-accent/10 text-accent transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-45"
                ><ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" /></span>
              </>
            </SiteLinkButton>
          </BlurReveal>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <ServiceCard
              key={service.name}
              service={service}
              index={index}
              delay={index * 0.06}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
