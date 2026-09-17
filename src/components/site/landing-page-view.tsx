import { ServiceDetailTemplate } from "@/components/site/service-page/service-detail-template";
import { JsonLd } from "@/components/seo/json-ld";
import type { landingPages } from "@/lib/db/schema";
import {
  parseMarketingPageSections,
  sectionsToStaticPage,
} from "@/lib/services/page-sections";

type LandingRow = typeof landingPages.$inferSelect;

type RenderMarketingLandingOptions = {
  landing: LandingRow;
  organizationName: string;
};

/**
 * Renders a marketing-layout landing page (same section template as services/CMS pages).
 */
export function renderMarketingLandingPage({
  landing,
  organizationName,
}: RenderMarketingLandingOptions) {
  const sections = parseMarketingPageSections(landing.pageSections);
  if (!sections) {
    return null;
  }

  const staticPage = sectionsToStaticPage({
    slug: landing.slug,
    name: landing.title,
    metaTitle: landing.metaTitle,
    metaDescription: landing.metaDescription,
    sections,
    path: landing.path || `/${landing.slug}`,
    heroVisual: landing.heroVisual,
  });

  const customSchema =
    landing.schemaJson &&
    typeof landing.schemaJson === "object" &&
    !Array.isArray(landing.schemaJson)
      ? (landing.schemaJson as Record<string, unknown>)
      : null;

  return (
    <>
      {customSchema ? <JsonLd data={customSchema} /> : null}
      <ServiceDetailTemplate
        page={staticPage}
        organizationName={organizationName}
        skipDefaultSchema={Boolean(customSchema)}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: landing.title },
        ]}
      />
    </>
  );
}
