import { caseStudyPath } from "@/lib/paths";
import type { PublishedCaseStudy } from "@/lib/queries/case-studies";
import { absoluteUrl, resolveImageUrl } from "@/lib/seo/constants";

function toIsoDate(value: Date | string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

export function buildCaseStudyArticleSchema(
  caseStudy: PublishedCaseStudy,
  organizationName: string,
  defaultOgImage?: string | null,
) {
  const image = resolveImageUrl(caseStudy.ogImage, defaultOgImage);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: caseStudy.metaTitle || `${caseStudy.client} case study`,
    description: caseStudy.metaDescription || caseStudy.challenge || undefined,
    datePublished: toIsoDate(caseStudy.publishedAt),
    dateModified: toIsoDate(caseStudy.updatedAt ?? caseStudy.publishedAt),
    author: {
      "@type": "Organization",
      name: organizationName,
    },
    publisher: {
      "@type": "Organization",
      name: organizationName,
    },
    mainEntityOfPage: absoluteUrl(caseStudyPath(caseStudy.slug)),
    ...(image ? { image: [image] } : {}),
    about: {
      "@type": "Organization",
      name: caseStudy.client,
    },
  };
}
