import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type Service = {
  name: string;
  href: string;
  description: string;
  span: string;
  minH: string;
  big?: boolean;
};

const services: Service[] = [
  {
    name: "WordPress Development",
    href: "/services/wordpress-development",
    description:
      "Custom WordPress websites with powerful functionality, SEO optimization, and intuitive content management. From blogs to enterprise portals with seamless integrations.",
    span: "md:col-span-7",
    minH: "md:min-h-[300px]",
    big: true,
  },
  {
    name: "WooCommerce Development",
    href: "/services/woocommerce-development",
    description:
      "High-converting online stores with seamless payments, inventory management, and optimized checkout experiences that boost sales.",
    span: "md:col-span-5",
    minH: "md:min-h-[300px]",
  },
  {
    name: "Shopify Development",
    href: "/services/shopify-development",
    description:
      "Scalable Shopify stores with custom themes, app integrations, and performance optimization. Fast, mobile-friendly shopping that maximizes revenue.",
    span: "md:col-span-4",
    minH: "md:min-h-[260px]",
  },
  {
    name: "Digital Marketing",
    href: "/services/digital-marketing",
    description:
      "Data-driven SEO, Google Ads, social media, and email campaigns. Integrated strategies that generate qualified leads, increase visibility, and deliver measurable ROI.",
    span: "md:col-span-8",
    minH: "md:min-h-[260px]",
    big: true,
  },
  {
    name: "Video Editing",
    href: "/services/digital-marketing/video-editing",
    description:
      "Professional video production transforming raw footage into compelling marketing content. Color grading, motion graphics, and sound design.",
    span: "md:col-span-6",
    minH: "md:min-h-[220px]",
  },
  {
    name: "Virtual Assistant",
    href: "/services/digital-marketing/virtual-assistant",
    description:
      "Dedicated support handling admin tasks, customer service, content management, and scheduling, so you can focus on growth.",
    span: "md:col-span-6",
    minH: "md:min-h-[220px]",
  },
];

function ServiceCard({ service, index }: { service: Service; index: number }) {
  return (
    <BlurReveal
      delay={index * 0.07}
      className={`${service.span}`}
    >
      <Link
        href={service.href}
        className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-default border border-border bg-surface p-7 shadow-soft transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-accent dark:shadow-none dark:hover:shadow-glow md:p-8 ${service.minH}`}
      >
        <div
          aria-hidden="true"
          className="absolute -bottom-16 -right-16 size-40 rounded-full bg-accent-lime/15 blur-2xl transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-150 dark:bg-accent/10"
        />

        <div className="relative flex items-start justify-between gap-4">
          <span className="text-sm tabular-nums text-muted">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            aria-hidden="true"
            className="text-xl text-muted transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
          ><ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" /></span>
        </div>

        <div className="relative mt-10">
          <h3
            className={`font-semibold tracking-[-0.025em] text-foreground transition-colors duration-300 group-hover:text-accent ${
              service.big
                ? "text-3xl md:text-[2.5rem] md:leading-[1.05]"
                : "text-2xl md:text-[1.6rem] md:leading-[1.15]"
            }`}
          >
            {service.name}
          </h3>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted md:text-base">
            {service.description}
          </p>
        </div>
      </Link>
    </BlurReveal>
  );
}

export function ServicesSection() {
  return (
    <section className="border-y border-border bg-surface py-20 md:py-32">
      <div className="mx-auto max-w-[1120px] px-6">
        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <BlurReveal>
            <p className="text-sm font-medium text-accent">Our services</p>
            <h2 className="mt-4 max-w-xl text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-foreground">
              Digital services to grow your brand
            </h2>
          </BlurReveal>
          <BlurReveal delay={0.1}>
            <p className="max-w-sm text-sm leading-relaxed text-muted md:text-base">
              Complete digital solutions from development to marketing:
              integrated services designed to build brands and drive growth.
            </p>
          </BlurReveal>
        </div>

        <div className="grid gap-4 md:grid-cols-12">
          {services.map((service, index) => (
            <ServiceCard key={service.name} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
