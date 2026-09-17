import { ServiceDetailTemplate } from "@/components/site/service-page/service-detail-template";
import { CtaBand } from "@/components/site/cta-band";
import { InnerPageShell } from "@/components/site/inner-page-shell";
import { RichText } from "@/components/site/rich-text";
import { JsonLd } from "@/components/seo/json-ld";
import type { pages } from "@/lib/db/schema";
import {
  parseMarketingPageSections,
  sectionsToStaticPage,
} from "@/lib/services/page-sections";

type PageRow = typeof pages.$inferSelect;

type RenderCmsPageOptions = {
  page: PageRow;
  organizationName: string;
  breadcrumbs?: { label: string; href?: string }[];
};

/**
 * Renders a CMS page with marketing sections (service-like) when available,
 * otherwise the classic article + TipTap layout.
 */
export function renderCmsPage({
  page,
  organizationName,
  breadcrumbs,
}: RenderCmsPageOptions) {
  const sections = parseMarketingPageSections(page.pageSections);
  const useMarketing =
    (page.template ?? "marketing") === "marketing" && sections !== null;

  if (useMarketing && sections) {
    const staticPage = sectionsToStaticPage({
      slug: page.slug,
      name: page.title,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      sections,
      heroVisual: page.heroVisual,
    });

    const crumbs =
      breadcrumbs ?? [
        { label: "Home", href: "/" },
        { label: page.title },
      ];

    const customSchema =
      page.schemaJson &&
      typeof page.schemaJson === "object" &&
      !Array.isArray(page.schemaJson)
        ? (page.schemaJson as Record<string, unknown>)
        : null;

    return (
      <>
        {customSchema ? <JsonLd data={customSchema} /> : null}
        <ServiceDetailTemplate
          page={staticPage}
          organizationName={organizationName}
          skipDefaultSchema
          breadcrumbs={crumbs}
        />
      </>
    );
  }

  const crumbs = breadcrumbs ?? [
    { label: "Home", href: "/" },
    { label: page.title },
  ];

  return (
    <InnerPageShell breadcrumbs={crumbs}>
      <>
        <article className="mx-auto max-w-[1120px] px-6 py-16">
          <header className="max-w-2xl space-y-4">
            {page.heroEyebrow ? (
              <p className="font-mono text-xs uppercase tracking-wider text-muted">
                {page.heroEyebrow}
              </p>
            ) : null}
            <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {page.title}
            </h1>
            {page.heroSubtext ? (
              <p className="text-lg leading-relaxed text-muted">
                {page.heroSubtext}
              </p>
            ) : null}
          </header>

          <div className="mt-12 max-w-[720px]">
            <RichText content={page.content} />
          </div>
        </article>

        {page.showCta ? <CtaBand /> : null}
      </>
    </InnerPageShell>
  );
}
