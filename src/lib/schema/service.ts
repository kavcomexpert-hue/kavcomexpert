import type { PublishedService } from "@/lib/queries/services";
import { servicePath } from "@/lib/paths";
import { absoluteUrl } from "@/lib/seo/constants";
import { parseFaqs } from "@/lib/site/content-parsers";

export function buildServiceSchema(
  service: PublishedService,
  organizationName: string,
  parentSlug?: string | null,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.shortPitch ?? service.metaDescription,
    url: absoluteUrl(servicePath({ slug: service.slug, parentSlug })),
    provider: {
      "@type": "Organization",
      name: organizationName,
    },
  };
}

export function buildFaqPageSchema(
  service: PublishedService,
  organizationName: string,
  parentSlug?: string | null,
) {
  const faqs = parseFaqs(service.faqs);

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
      name: service.name,
      url: absoluteUrl(servicePath({ slug: service.slug, parentSlug })),
      publisher: {
        "@type": "Organization",
        name: organizationName,
      },
    },
  };
}
