import type { StaticServicePage } from "@/lib/site/service-pages/types";
import type { FaqEntry } from "@/components/site/home/faq-section";
import { servicePath } from "@/lib/paths";
import { absoluteUrl } from "@/lib/seo/constants";

function servicePageUrl(page: StaticServicePage): string {
  return absoluteUrl(page.path ?? servicePath({ slug: page.slug }));
}

export function buildStaticServiceSchema(
  page: StaticServicePage,
  organizationName: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.name,
    description: page.metaDescription,
    url: servicePageUrl(page),
    serviceType: page.name,
    areaServed: ["United States", "Canada"],
    provider: {
      "@type": "Organization",
      name: organizationName,
      url: absoluteUrl("/"),
    },
  };
}

export function buildStaticFaqSchema(
  page: StaticServicePage,
  faqs: readonly FaqEntry[],
) {
  if (faqs.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
    isPartOf: {
      "@type": "WebPage",
      name: page.name,
      url: servicePageUrl(page),
    },
  };
}

export function buildStaticServiceWebPageSchema(
  page: StaticServicePage,
  organizationName: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.metaTitle,
    description: page.metaDescription,
    url: servicePageUrl(page),
    isPartOf: {
      "@type": "WebSite",
      name: organizationName,
      url: absoluteUrl("/"),
    },
    about: {
      "@type": "Service",
      name: page.name,
    },
  };
}
