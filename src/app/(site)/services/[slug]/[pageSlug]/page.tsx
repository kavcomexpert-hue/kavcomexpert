import { JsonLd } from "@/components/seo/json-ld";
import { renderCmsPage } from "@/components/site/cms-page-view";
import { ServiceDetailTemplate } from "@/components/site/service-page/service-detail-template";
import { pathFromSegments } from "@/lib/pages/path";
import { servicePath, servicesIndexPath } from "@/lib/paths";
import { getPublishedPageByPath } from "@/lib/queries/pages";
import { getChildService, getServiceBySlug } from "@/lib/queries/services";
import { safePublicQuery } from "@/lib/queries/safe-fetch";
import {
  resolvePagePreviewByPath,
  resolveServicePreview,
} from "@/lib/preview/access";
import { getSiteSettings } from "@/lib/queries/site-settings";
import {
  parseServicePageSections,
  sectionsToStaticPage,
  staticPageToSections,
} from "@/lib/services/page-sections";
import { getStaticServicePage } from "@/lib/site/service-pages";
import { buildContentMetadataFromSettings } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string; pageSlug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, pageSlug } = await params;

  const previewChild = await resolveServicePreview(pageSlug);
  if (previewChild?.parentId) {
    const parent =
      (await resolveServicePreview(slug)) ??
      (await safePublicQuery(`services/${slug}`, () => getServiceBySlug(slug)));
    if (parent && previewChild.parentId === parent.id) {
      return buildContentMetadataFromSettings({
        metaTitle: previewChild.metaTitle,
        metaDescription: previewChild.metaDescription,
        canonicalUrl: previewChild.canonicalUrl,
        path: servicePath({ slug: pageSlug, parentSlug: slug }),
        noIndex: previewChild.noIndex,
        ogImage: previewChild.ogImage,
      });
    }
  }

  const nested = await safePublicQuery(`services/${slug}/${pageSlug}`, () =>
    getChildService(slug, pageSlug),
  );
  if (nested) {
    return buildContentMetadataFromSettings({
      metaTitle: nested.child.metaTitle,
      metaDescription: nested.child.metaDescription,
      canonicalUrl: nested.child.canonicalUrl,
      path: servicePath({ slug: pageSlug, parentSlug: slug }),
      noIndex: nested.child.noIndex,
      ogImage: nested.child.ogImage,
    });
  }

  const path = pathFromSegments(["services", slug, pageSlug]);
  const page =
    (await resolvePagePreviewByPath(path)) ??
    (await safePublicQuery(`pages${path}`, () => getPublishedPageByPath(path)));

  if (!page) {
    return {};
  }

  return buildContentMetadataFromSettings({
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    canonicalUrl: page.canonicalUrl,
    path: page.path || path,
    noIndex: page.noIndex,
    ogImage: page.ogImage,
  });
}

export default async function ServiceChildPage({ params }: PageProps) {
  const { slug, pageSlug } = await params;
  const settings = await getSiteSettings();
  const nestedPath = servicePath({ slug: pageSlug, parentSlug: slug });
  const parentPath = servicePath({ slug });

  const previewChild = await resolveServicePreview(pageSlug);
  if (previewChild?.parentId) {
    const parent =
      (await resolveServicePreview(slug)) ??
      (await safePublicQuery(`services/${slug}`, () => getServiceBySlug(slug)));
    if (parent && previewChild.parentId === parent.id) {
      const nested = { parent, child: previewChild };
      const sections =
        parseServicePageSections(nested.child.pageSections) ??
        (getStaticServicePage(pageSlug)
          ? staticPageToSections(getStaticServicePage(pageSlug)!)
          : null);

      if (sections) {
        const page = sectionsToStaticPage({
          slug: nested.child.slug,
          name: nested.child.name,
          metaTitle: nested.child.metaTitle,
          metaDescription: nested.child.metaDescription,
          sections,
          path: nestedPath,
          heroVisual: nested.child.heroVisual,
        });

        const breadcrumbs = [
          { label: "Home", href: "/" },
          { label: "Services", href: servicesIndexPath },
          { label: nested.parent.name, href: parentPath },
          { label: nested.child.name },
        ];

        return (
          <ServiceDetailTemplate
            page={page}
            organizationName={settings.organizationName}
            breadcrumbs={breadcrumbs}
          />
        );
      }
    }
  }

  const nested = await safePublicQuery(`services/${slug}/${pageSlug}`, () =>
    getChildService(slug, pageSlug),
  );
  if (nested) {
    const sections =
      parseServicePageSections(nested.child.pageSections) ??
      (getStaticServicePage(pageSlug)
        ? staticPageToSections(getStaticServicePage(pageSlug)!)
        : null);

    if (!sections) {
      notFound();
    }

    const page = sectionsToStaticPage({
      slug: nested.child.slug,
      name: nested.child.name,
      metaTitle: nested.child.metaTitle,
      metaDescription: nested.child.metaDescription,
      sections,
      path: nestedPath,
      heroVisual: nested.child.heroVisual,
    });

    const breadcrumbs = [
      { label: "Home", href: "/" },
      { label: "Services", href: servicesIndexPath },
      { label: nested.parent.name, href: parentPath },
      { label: nested.child.name },
    ];

    if (
      nested.child.schemaJson &&
      typeof nested.child.schemaJson === "object" &&
      !Array.isArray(nested.child.schemaJson)
    ) {
      return (
        <>
          <JsonLd data={nested.child.schemaJson as Record<string, unknown>} />
          <ServiceDetailTemplate
            page={page}
            organizationName={settings.organizationName}
            skipDefaultSchema
            breadcrumbs={breadcrumbs}
          />
        </>
      );
    }

    return (
      <ServiceDetailTemplate
        page={page}
        organizationName={settings.organizationName}
        breadcrumbs={breadcrumbs}
      />
    );
  }

  const path = pathFromSegments(["services", slug, pageSlug]);
  const [page, service] = await Promise.all([
    (async () =>
      (await resolvePagePreviewByPath(path)) ??
      (await safePublicQuery(`pages${path}`, () =>
        getPublishedPageByPath(path),
      )))(),
    safePublicQuery(`services/${slug}`, () => getServiceBySlug(slug)),
  ]);

  if (!page || !service) {
    notFound();
  }

  return renderCmsPage({
    page,
    organizationName: settings.organizationName,
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "Services", href: servicesIndexPath },
      { label: service.name, href: parentPath },
      { label: page.title },
    ],
  });
}
