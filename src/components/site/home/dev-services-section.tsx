import { Ambient } from "@/components/site/home/motion/ambient";
import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import {
  IconAndroid,
  IconIos,
  IconMagento,
  IconShopify,
  IconWooCommerce,
  IconWordPress,
} from "@/components/site/home/motion/tech-icons";
import { SiteLinkButton } from "@/components/site/site-link-button";
import { linkButton, type LinkButton } from "@/lib/content/link-button";
import { servicePath, servicesIndexPath } from "@/lib/paths";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";

export type HomeServiceCard = {
  name: string;
  href: string;
  description: string;
  icon: ReactNode;
};

const defaultServices: HomeServiceCard[] = [
  {
    name: "WordPress Development",
    href: servicePath({ slug: "wordpress-development" }),
    description:
      "Custom WordPress websites with powerful functionality, SEO optimization, and intuitive content management.",
    icon: <IconWordPress />,
  },
  {
    name: "Shopify Development",
    href: servicePath({ slug: "shopify-development" }),
    description:
      "Scalable Shopify stores with custom themes, app integrations, and mobile-first performance that maximizes revenue.",
    icon: <IconShopify />,
  },
  {
    name: "Magento Development",
    href: servicePath({ slug: "magento-development" }),
    description:
      "Enterprise-grade Magento commerce with complex catalogs, custom modules, and integrations built to scale.",
    icon: <IconMagento />,
  },
  {
    name: "WooCommerce Development",
    href: servicePath({ slug: "woocommerce-development" }),
    description:
      "High-converting WooCommerce stores with seamless payments, inventory management, and optimized checkout.",
    icon: <IconWooCommerce />,
  },
  {
    name: "Android App Development",
    href: servicePath({ slug: "android-app-development" }),
    description:
      "Native Android applications engineered for performance, Play Store readiness, and real business outcomes.",
    icon: <IconAndroid />,
  },
  {
    name: "iOS App Development",
    href: servicePath({ slug: "ios-app-development" }),
    description:
      "Polished iOS apps with fluid interfaces and App Store optimization, built for Apple's ecosystem.",
    icon: <IconIos />,
  },
];

export function ServiceCard({
  service,
  index,
  delay,
  animate = true,
}: {
  service: HomeServiceCard;
  index: number;
  delay: number;
  animate?: boolean;
}) {
  const card = (
    <Link
      href={service.href}
      className="group relative flex h-full flex-col overflow-hidden rounded-default border border-border bg-background p-7 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-soft dark:hover:shadow-glow"
    >
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-12 size-32 rounded-full bg-accent-lime/0 blur-2xl transition-[background-color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-125 group-hover:bg-accent-lime/20 dark:group-hover:bg-accent/15"
        />

        <div className="relative flex items-start justify-between">
          <span className="flex size-12 items-center justify-center rounded-2xl border border-border bg-surface text-accent transition-[background-color,border-color,color] duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-surface">
            {service.icon}
          </span>
          <span className="text-sm tabular-nums text-muted/60">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <h3 className="relative mt-6 text-xl font-semibold tracking-[-0.02em] text-foreground transition-colors duration-300 group-hover:text-accent">
          {service.name}
        </h3>
        <p className="relative mt-3 flex-1 text-sm leading-relaxed text-muted">
          {service.description}
        </p>

        <div className="relative mt-6 flex items-center gap-2 text-sm font-medium text-muted transition-colors duration-300 group-hover:text-accent">
          <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:max-w-24 group-hover:opacity-100">
            Explore
          </span>
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-full border border-border transition-[border-color,transform] duration-300 group-hover:-rotate-45 group-hover:border-accent"
          ><ChevronRight className="size-4" strokeWidth={1.5} aria-hidden="true" /></span>
        </div>
      </Link>
  );

  if (!animate) {
    return card;
  }

  return <BlurReveal delay={delay}>{card}</BlurReveal>;
}

export const defaultDevServices: HomeServiceCard[] = defaultServices;

export function DevServicesSection({
  services = defaultServices,
  eyebrow = "Web & app development",
  headline = "Platforms we build and scale",
  cta = linkButton("View all services", servicesIndexPath),
}: {
  services?: HomeServiceCard[];
  eyebrow?: string;
  headline?: string;
  cta?: LinkButton;
}) {
  return (
    <section className="relative overflow-clip border-t border-border bg-surface py-20 md:py-32">
      <Ambient flip />
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
