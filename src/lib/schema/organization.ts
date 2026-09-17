import type { SiteSettings } from "@/lib/queries/site-settings";
import { absoluteUrl, resolveImageUrl } from "@/lib/seo/constants";

export function buildOrganizationSchema(settings: SiteSettings) {
  const sameAs = Object.values(settings.socialLinks).filter(Boolean);
  const logo =
    resolveImageUrl(settings.defaultOgImage) ?? absoluteUrl("/logo.png");

  return {
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: settings.organizationName,
    url: absoluteUrl("/"),
    logo: {
      "@type": "ImageObject",
      url: logo,
    },
    image: logo,
    ...(settings.tagline ? { description: settings.tagline } : {}),
    ...(settings.contactEmail
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            email: settings.contactEmail,
            contactType: "customer support",
            availableLanguage: ["English"],
          },
        }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function buildWebSiteSchema(settings: SiteSettings) {
  return {
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: settings.organizationName,
    url: absoluteUrl("/"),
    ...(settings.tagline ? { description: settings.tagline } : {}),
    publisher: { "@id": absoluteUrl("/#organization") },
    inLanguage: "en-US",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/blog?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildHomeWebPageSchema(settings: SiteSettings) {
  return {
    "@type": "WebPage",
    "@id": absoluteUrl("/#webpage"),
    url: absoluteUrl("/"),
    name: settings.organizationName,
    ...(settings.tagline ? { description: settings.tagline } : {}),
    isPartOf: { "@id": absoluteUrl("/#website") },
    about: { "@id": absoluteUrl("/#organization") },
    inLanguage: "en-US",
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: resolveImageUrl(settings.defaultOgImage) ?? absoluteUrl("/logo.png"),
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "main p"],
    },
  };
}
