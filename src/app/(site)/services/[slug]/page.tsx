import { JsonLd } from "@/components/seo/json-ld";
import { CtaBand } from "@/components/site/cta-band";
import { FaqAccordion } from "@/components/site/faq-accordion";
import { InnerPageShell } from "@/components/site/inner-page-shell";
import { RichText } from "@/components/site/rich-text";
import { Section } from "@/components/site/section";
import { ServiceDetailTemplate } from "@/components/site/service-page/service-detail-template";
import { resolveServicePreview } from "@/lib/preview/access";
import { getSiteSettings } from "@/lib/queries/site-settings";
import { getServiceBySlug, getServices } from "@/lib/queries/services";
import { safePublicQuery } from "@/lib/queries/safe-fetch";
import { servicePath, servicesIndexPath } from "@/lib/paths";
import {
  buildFaqPageSchema,
  buildServiceSchema,
} from "@/lib/schema/service";
import {
  buildContentMetadataFromSettings,
  buildStaticPageMetadata,
} from "@/lib/seo/metadata";
import {
  getStaticServicePage,
  staticServiceSlugs,
} from "@/lib/site/service-pages";
import {
  parseServicePageSections,
  sectionsToStaticPage,
  staticPageToSections,
} from "@/lib/services/page-sections";
import { parseFaqs, parseStringArray } from "@/lib/site/content-parsers";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

type ServicePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;
export const revalidate = 3600;

async function resolveParentSlug(
  parentId: string | null | undefined,
): Promise<string | null> {
  if (!parentId) return null;
  const all = await getServices();
  return all.find((row) => row.id === parentId)?.slug ?? null;
}

export async function generateStaticParams() {
  try {
    const services = await getServices();
    // Child services live at /services/{parent}/{child}. Their flat slug is
    // still prerendered on purpose: the page throws permanentRedirect during
    // build, so Next records a static 308 in the prerender manifest instead
    // of a duplicate page. Rendering them on demand instead would race the
    // streamed shell and cache a 200 response.
    const staticParams = staticServiceSlugs.map((slug) => ({ slug }));
    const dbParams = services
      .map((service) => ({ slug: service.slug }))
      .filter((entry) => !staticServiceSlugs.includes(entry.slug));

    return [...staticParams, ...dbParams];
  } catch (error) {
    console.warn(
      "[services] generateStaticParams failed; building with zero paths.",
      error,
    );
    return [];
  }
}

export async function generateMetadata({
  params,
}: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const preview = await resolveServicePreview(slug);
  const service =
    preview ??
    (await safePublicQuery(`services/${slug}`, () => getServiceBySlug(slug)));

  if (service) {
    const parentSlug = await resolveParentSlug(service.parentId);
    if (service.parentId && parentSlug) {
      permanentRedirect(servicePath({ slug: service.slug, parentSlug }));
    }

    return buildContentMetadataFromSettings({
      metaTitle: service.metaTitle,
      metaDescription: service.metaDescription,
      canonicalUrl: service.canonicalUrl,
      path: servicePath({ slug: service.slug, parentSlug }),
      noIndex: service.noIndex,
      ogImage: service.ogImage,
    });
  }

  const staticPage = getStaticServicePage(slug);

  if (staticPage) {
    return buildStaticPageMetadata({
      title: staticPage.metaTitle,
      description: staticPage.metaDescription,
      path: servicePath({ slug: staticPage.slug }),
    });
  }

  return {};
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;

  const preview = await resolveServicePreview(slug);
  const [published, settings] = await Promise.all([
    preview
      ? Promise.resolve(null)
      : safePublicQuery(`services/${slug}`, () => getServiceBySlug(slug)),
    getSiteSettings(),
  ]);
  const service = preview ?? published;

  if (service) {
    const parentSlug = await resolveParentSlug(service.parentId);
    if (service.parentId && parentSlug) {
      permanentRedirect(servicePath({ slug: service.slug, parentSlug }));
    }

    const canonicalPath = servicePath({ slug: service.slug, parentSlug });
    const sections =
      parseServicePageSections(service.pageSections) ??
      (getStaticServicePage(slug)
        ? staticPageToSections(getStaticServicePage(slug)!)
        : null);

    if (sections) {
      const page = sectionsToStaticPage({
        slug: service.slug,
        name: service.name,
        metaTitle: service.metaTitle,
        metaDescription: service.metaDescription,
        sections,
        path: canonicalPath,
        heroVisual: service.heroVisual,
      });

      if (
        service.schemaJson &&
        typeof service.schemaJson === "object" &&
        !Array.isArray(service.schemaJson)
      ) {
        return (
          <>
            <JsonLd data={service.schemaJson as Record<string, unknown>} />
            <ServiceDetailTemplate
              page={page}
              organizationName={settings.organizationName}
              skipDefaultSchema
            />
          </>
        );
      }

      return (
        <ServiceDetailTemplate
          page={page}
          organizationName={settings.organizationName}
        />
      );
    }

    // Legacy CMS layout (no structured sections)
    const deliverables = parseStringArray(service.deliverables);
    const faqs = parseFaqs(service.faqs);
    const faqSchema = buildFaqPageSchema(service, settings.organizationName);
    const schemaGraph = [
      service.schemaJson &&
      typeof service.schemaJson === "object" &&
      !Array.isArray(service.schemaJson)
        ? (service.schemaJson as Record<string, unknown>)
        : buildServiceSchema(service, settings.organizationName),
      ...(faqSchema ? [faqSchema] : []),
    ];

    return (
      <InnerPageShell
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Services", href: servicesIndexPath },
          { label: service.name },
        ]}
      >
        <>
          <JsonLd data={schemaGraph} />

          <Section className="pb-12 md:pb-16">
            <header className="max-w-3xl space-y-4">
              <p className="font-mono text-xs uppercase tracking-wider text-muted">
                Service
              </p>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {service.name}
              </h1>
              {service.shortPitch ? (
                <p className="text-lg leading-relaxed text-muted">
                  {service.shortPitch}
                </p>
              ) : null}
            </header>

            <div className="mt-12 max-w-[720px]">
              <RichText content={service.body} />
            </div>
          </Section>

          {deliverables.length > 0 ? (
            <Section
              className="border-t border-border bg-surface"
              eyebrow="Deliverables"
              headline="What you get"
            >
              <ul className="grid gap-3 sm:grid-cols-2">
                {deliverables.map((item) => (
                  <li
                    key={item}
                    className="rounded-default border border-border bg-background px-4 py-3 text-sm text-foreground"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {faqs.length > 0 ? (
            <Section
              className="border-t border-border bg-surface"
              eyebrow="FAQ"
              headline="Common questions"
            >
              <FaqAccordion items={faqs} />
            </Section>
          ) : null}

          <CtaBand />
        </>
      </InnerPageShell>
    );
  }

  const staticPage = getStaticServicePage(slug);

  if (staticPage) {
    return (
      <ServiceDetailTemplate
        page={staticPage}
        organizationName={settings.organizationName}
      />
    );
  }

  notFound();
}
