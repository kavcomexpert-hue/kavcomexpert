import { absoluteUrl, resolveImageUrl } from "@/lib/seo/constants";
import type { Metadata } from "next";

type OpenGraphType = "website" | "article";

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

export type ContentSeoInput = {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl?: string | null;
  path: string;
  noIndex?: boolean | null;
  ogImage?: string | null;
  coverImage?: string | null;
  defaultOgImage?: string | null;
  openGraphType?: OpenGraphType;
  publishedTime?: Date | null;
  modifiedTime?: Date | null;
  alternateMarkdown?: string | null;
  socialTitle?: string | null;
  socialDescription?: string | null;
  noFollow?: boolean | null;
  noArchive?: boolean | null;
};

export function buildContentMetadata(input: ContentSeoInput): Metadata {
  const canonical = input.canonicalUrl?.trim() || absoluteUrl(input.path);
  const imageUrl = resolveImageUrl(
    input.ogImage,
    input.coverImage,
    input.defaultOgImage,
  );
  const socialTitle = input.socialTitle?.trim() || input.metaTitle;
  const socialDescription =
    input.socialDescription?.trim() || input.metaDescription;

  const robots =
    input.noIndex || input.noFollow || input.noArchive
      ? {
          index: !input.noIndex,
          follow: !input.noFollow,
          ...(input.noArchive ? { nosnippet: false, noarchive: true } : {}),
        }
      : undefined;

  return {
    title: input.metaTitle,
    description: input.metaDescription,
    alternates: {
      canonical,
      ...(input.alternateMarkdown
        ? { types: { "text/markdown": input.alternateMarkdown } }
        : {}),
    },
    openGraph: {
      title: socialTitle,
      description: socialDescription,
      url: canonical,
      type: input.openGraphType ?? "website",
      publishedTime: toIsoDate(input.publishedTime),
      modifiedTime: toIsoDate(input.modifiedTime),
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: socialDescription,
      images: imageUrl ? [imageUrl] : undefined,
    },
    robots,
  };
}

export type StaticPageMetadataInput = {
  title: string;
  description: string;
  path: string;
  defaultOgImage?: string | null;
};

export async function buildContentMetadataFromSettings(
  input: Omit<ContentSeoInput, "defaultOgImage">,
): Promise<Metadata> {
  const { getSiteSettings } = await import("@/lib/queries/site-settings");
  const settings = await getSiteSettings();

  return buildContentMetadata({
    ...input,
    defaultOgImage: settings.defaultOgImage,
  });
}

export async function buildStaticPageMetadata(
  input: StaticPageMetadataInput,
): Promise<Metadata> {
  const { getSiteSettings } = await import("@/lib/queries/site-settings");
  const settings = await getSiteSettings();

  return buildContentMetadata({
    metaTitle: input.title,
    metaDescription: input.description,
    path: input.path,
    defaultOgImage: input.defaultOgImage ?? settings.defaultOgImage,
  });
}

export async function buildStaticMetaFromKey(
  key: import("@/lib/static-meta").StaticMetaKey,
): Promise<Metadata> {
  const { getStaticPageMeta } = await import("@/lib/static-meta");
  const entry = getStaticPageMeta(key);
  return buildStaticPageMetadata({
    title: entry.title,
    description: entry.description,
    path: entry.path,
  });
}

export type SeoStatus = "good" | "warning";

export function getPostSeoStatus(input: {
  metaTitle: string;
  metaDescription: string;
}): SeoStatus {
  const title = input.metaTitle.trim();
  const description = input.metaDescription.trim();

  if (
    title &&
    description &&
    title.length <= 70 &&
    description.length <= 170
  ) {
    return "good";
  }

  return "warning";
}
