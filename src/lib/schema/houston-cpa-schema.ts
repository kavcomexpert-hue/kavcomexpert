import {
  FAQ_ITEMS,
  HOUSTON_CPA_PATH,
  PHONE_E164,
  PRICING,
  SERVICES_GRID,
} from "@/components/houston-cpa/constants";
import type { SiteSettings } from "@/lib/queries/site-settings";
import { absoluteUrl } from "@/lib/seo/constants";

export function buildHoustonCpaSchema(settings: SiteSettings) {
  const pageUrl = absoluteUrl(HOUSTON_CPA_PATH);
  const orgId = absoluteUrl("/#organization");
  const sameAs = Object.values(settings.socialLinks).filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: settings.organizationName,
        url: absoluteUrl("/"),
        ...(settings.contactEmail
          ? {
              contactPoint: {
                "@type": "ContactPoint",
                email: settings.contactEmail,
                telephone: PHONE_E164,
                contactType: "sales",
                areaServed: "US",
                availableLanguage: ["English"],
              },
            }
          : {}),
        ...(sameAs.length > 0 ? { sameAs } : {}),
      },
      {
        "@type": "ProfessionalService",
        "@id": `${pageUrl}#service`,
        name: "CPA Marketing Agency Houston | Kavcom Expert",
        description:
          "Marketing and back office support for Houston CPA firms, including websites, local SEO, AEO, social, video, email, and virtual assistant support.",
        url: pageUrl,
        telephone: PHONE_E164,
        priceRange: "$850-$2800",
        areaServed: [
          {
            "@type": "City",
            name: "Houston",
            containedInPlace: {
              "@type": "State",
              name: "Texas",
            },
          },
          {
            "@type": "AdministrativeArea",
            name: "Houston-The Woodlands-Sugar Land metro",
          },
        ],
        provider: { "@id": orgId },
        ...(sameAs.length > 0 ? { sameAs } : {}),
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Houston CPA marketing services",
          itemListElement: SERVICES_GRID.map((service, index) => ({
            "@type": "OfferCatalog",
            position: index + 1,
            name: service.title,
            itemListElement: [
              {
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: service.title,
                  description: service.body,
                },
              },
            ],
          })),
        },
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: "CPA Marketing Agency Houston | Kavcom Expert",
        description:
          "Marketing and back office support for Houston CPA firms. Book a free 20 minute fit call.",
        isPartOf: { "@id": absoluteUrl("/#website") },
        about: { "@id": `${pageUrl}#service` },
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
        inLanguage: "en-US",
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: absoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Services",
            item: absoluteUrl("/services"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "CPA Marketing Houston",
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
      {
        "@type": "Offer",
        "@id": `${pageUrl}#offer-foundation`,
        name: "Foundation",
        url: `${pageUrl}#pricing`,
        price: String(PRICING.foundation.monthly),
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: String(PRICING.foundation.monthly),
          priceCurrency: "USD",
          billingDuration: "P1M",
          unitText: "MONTH",
        },
        description: PRICING.foundation.blurb,
        seller: { "@id": orgId },
      },
      {
        "@type": "Offer",
        "@id": `${pageUrl}#offer-growth`,
        name: "Growth",
        url: `${pageUrl}#pricing`,
        price: String(PRICING.growth.monthly),
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: String(PRICING.growth.monthly),
          priceCurrency: "USD",
          billingDuration: "P1M",
          unitText: "MONTH",
        },
        description: PRICING.growth.blurb,
        seller: { "@id": orgId },
      },
      {
        "@type": "Offer",
        "@id": `${pageUrl}#offer-scale`,
        name: "Scale",
        url: `${pageUrl}#pricing`,
        price: String(PRICING.scale.monthly),
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: String(PRICING.scale.monthly),
          priceCurrency: "USD",
          billingDuration: "P1M",
          unitText: "MONTH",
        },
        description: PRICING.scale.blurb,
        seller: { "@id": orgId },
      },
    ],
  };
}
