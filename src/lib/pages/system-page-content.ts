import { resolvePagePreviewByPath } from "@/lib/preview/access";
import { getPublishedPageByPath, getPublishedPageBySlug } from "@/lib/queries/pages";
import { buildContentMetadataFromSettings } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import {
  aboutPageSectionsSchema,
  blogPageSectionsSchema,
  careersPageSectionsSchema,
  contactPageSectionsSchema,
  homePageSectionsSchema,
  parsePageSectionsForSlug,
  servicesPageSectionsSchema,
  workPageSectionsSchema,
  type AboutPageSections,
  type BlogPageSections,
  type CareersPageSections,
  type ContactPageSections,
  type HomePageSections,
  type ServicesPageSections,
  type WorkPageSections,
} from "./page-section-schemas";

export async function getPublishedSystemPage(slug: string, path: string) {
  return (
    (await getPublishedPageByPath(path)) ??
    (await getPublishedPageBySlug(slug))
  );
}

/** Prefer draft CMS page when Draft Mode preview is active. */
async function getSystemPageForSections(slug: string, path: string) {
  const preview = await resolvePagePreviewByPath(path);
  if (preview) return preview;
  return getPublishedSystemPage(slug, path);
}

export async function systemPageMetadata(
  slug: string,
  path: string,
  fallback: () => Metadata | Promise<Metadata>,
): Promise<Metadata> {
  try {
    const page = await getPublishedSystemPage(slug, path);
    if (page) {
      return buildContentMetadataFromSettings({
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        canonicalUrl: page.canonicalUrl,
        path,
        noIndex: page.noIndex,
        ogImage: page.ogImage,
      });
    }
  } catch {
    // fall through
  }
  return fallback();
}

export async function getWorkPageSections(): Promise<WorkPageSections> {
  try {
    const page = await getSystemPageForSections("work", "/work");
    return workPageSectionsSchema.parse(
      parsePageSectionsForSlug("work", page?.pageSections) ?? {},
    );
  } catch {
    return workPageSectionsSchema.parse({});
  }
}

export async function getContactPageSections(): Promise<ContactPageSections> {
  try {
    const page = await getSystemPageForSections("contact-us", "/contact-us");
    return contactPageSectionsSchema.parse(
      parsePageSectionsForSlug("contact-us", page?.pageSections) ?? {},
    );
  } catch {
    return contactPageSectionsSchema.parse({});
  }
}

export async function getCareersPageSections(): Promise<CareersPageSections> {
  try {
    const page = await getSystemPageForSections("careers", "/careers");
    return careersPageSectionsSchema.parse(
      parsePageSectionsForSlug("careers", page?.pageSections) ?? {},
    );
  } catch {
    return careersPageSectionsSchema.parse({});
  }
}

export async function getBlogPageSections(): Promise<BlogPageSections> {
  try {
    const page = await getSystemPageForSections("blog", "/blog");
    return blogPageSectionsSchema.parse(
      parsePageSectionsForSlug("blog", page?.pageSections) ?? {},
    );
  } catch {
    return blogPageSectionsSchema.parse({});
  }
}

export async function getHomePageSections(): Promise<HomePageSections> {
  try {
    const page = await getSystemPageForSections("home", "/");
    return homePageSectionsSchema.parse(
      parsePageSectionsForSlug("home", page?.pageSections) ?? {},
    );
  } catch {
    return homePageSectionsSchema.parse({});
  }
}

export async function getAboutPageSections(): Promise<AboutPageSections> {
  try {
    const page = await getSystemPageForSections("about-us", "/about-us");
    return aboutPageSectionsSchema.parse(
      parsePageSectionsForSlug("about-us", page?.pageSections) ?? {},
    );
  } catch {
    return aboutPageSectionsSchema.parse({});
  }
}

export async function getServicesPageSections(): Promise<ServicesPageSections> {
  try {
    const page = await getSystemPageForSections("services", "/services");
    return servicesPageSectionsSchema.parse(
      parsePageSectionsForSlug("services", page?.pageSections) ?? {},
    );
  } catch {
    return servicesPageSectionsSchema.parse({});
  }
}
