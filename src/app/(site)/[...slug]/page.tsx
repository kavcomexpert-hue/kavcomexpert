import { renderCmsPage } from "@/components/site/cms-page-view";
import { renderMarketingLandingPage } from "@/components/site/landing-page-view";
import {
  resolvePagePreview,
  resolvePagePreviewByPath,
} from "@/lib/preview/access";
import { pathFromSegments } from "@/lib/pages/path";
import {
  getPublishedLandingPageByPath,
  getPublishedLandingPageBySlug,
  getPublishedLandingPageSlugs,
} from "@/lib/queries/landing-pages";
import {
  getPublishedPageByPath,
  getPublishedPageBySlug,
  getPublishedPageSlugs,
} from "@/lib/queries/pages";
import { safePublicQuery } from "@/lib/queries/safe-fetch";
import { getSiteSettings } from "@/lib/queries/site-settings";
import { buildContentMetadataFromSettings } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const [pages, landings] = await Promise.all([
      getPublishedPageSlugs(),
      getPublishedLandingPageSlugs(),
    ]);

    const fromPages = pages
      .filter((page) => {
        const path = page.path || `/${page.slug}`;
        if (path === "/") return false;
        if (path.startsWith("/services/")) return false;
        return true;
      })
      .map((page) => {
        const path = page.path || `/${page.slug}`;
        const segments = path.split("/").filter(Boolean);
        return { slug: segments.length > 0 ? segments : [page.slug] };
      });

    const fromLandings = landings
      .filter((row) => (row.layoutKind ?? "marketing") === "marketing")
      .map((row) => {
        const path = row.path || `/${row.slug}`;
        const segments = path.split("/").filter(Boolean);
        return { slug: segments.length > 0 ? segments : [row.slug] };
      });

    const seen = new Set<string>();
    const merged: { slug: string[] }[] = [];
    for (const entry of [...fromLandings, ...fromPages]) {
      const key = entry.slug.join("/");
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(entry);
    }
    return merged;
  } catch (error) {
    console.warn(
      "[pages] generateStaticParams failed; building with zero paths.",
      error,
    );
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const path = pathFromSegments(slug);

  const landing =
    (await safePublicQuery(`landing-pages${path}`, () =>
      getPublishedLandingPageByPath(path),
    )) ??
    (slug.length === 1
      ? await safePublicQuery(`landing-pages/${slug[0]}`, () =>
          getPublishedLandingPageBySlug(slug[0]),
        )
      : null);

  if (landing && (landing.layoutKind ?? "marketing") === "marketing") {
    return buildContentMetadataFromSettings({
      metaTitle: landing.metaTitle,
      metaDescription: landing.metaDescription,
      canonicalUrl: landing.canonicalUrl,
      path: landing.path || `/${landing.slug}`,
      noIndex: landing.noIndex,
      ogImage: landing.ogImage,
    });
  }

  const preview =
    (await resolvePagePreviewByPath(path)) ??
    (slug.length === 1 ? await resolvePagePreview(slug[0]) : null);
  const page =
    preview ??
    (await safePublicQuery(`pages${path}`, () => getPublishedPageByPath(path))) ??
    (slug.length === 1
      ? await safePublicQuery(`pages/${slug[0]}`, () =>
          getPublishedPageBySlug(slug[0]),
        )
      : null);

  if (!page) {
    return {};
  }

  return buildContentMetadataFromSettings({
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    canonicalUrl: page.canonicalUrl,
    path: page.path || `/${page.slug}`,
    noIndex: page.noIndex,
    ogImage: page.ogImage,
  });
}

export default async function CatchAllPage({ params }: PageProps) {
  const { slug } = await params;
  const path = pathFromSegments(slug);

  const landing =
    (await safePublicQuery(`landing-pages${path}`, () =>
      getPublishedLandingPageByPath(path),
    )) ??
    (slug.length === 1
      ? await safePublicQuery(`landing-pages/${slug[0]}`, () =>
          getPublishedLandingPageBySlug(slug[0]),
        )
      : null);

  if (landing && (landing.layoutKind ?? "marketing") === "marketing") {
    const settings = await getSiteSettings();
    const view = renderMarketingLandingPage({
      landing,
      organizationName: settings.organizationName,
    });
    if (!view) {
      notFound();
    }
    return view;
  }

  const preview =
    (await resolvePagePreviewByPath(path)) ??
    (slug.length === 1 ? await resolvePagePreview(slug[0]) : null);
  const page =
    preview ??
    (await safePublicQuery(`pages${path}`, () => getPublishedPageByPath(path))) ??
    (slug.length === 1
      ? await safePublicQuery(`pages/${slug[0]}`, () =>
          getPublishedPageBySlug(slug[0]),
        )
      : null);

  if (!page) {
    notFound();
  }

  const settings = await getSiteSettings();

  return renderCmsPage({
    page,
    organizationName: settings.organizationName,
  });
}
