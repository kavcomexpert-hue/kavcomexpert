import { buildAuthorPersonSchema } from "@/lib/schema/author";
import { postPath } from "@/lib/paths";
import type { PublishedPost } from "@/lib/queries/posts";
import type { SocialLinks } from "@/lib/queries/site-settings";
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

export function buildDefaultPostOgImageUrl(
  title: string,
  category: string | null | undefined,
): string {
  const params = new URLSearchParams({
    title,
    category: category ?? "Blog",
  });

  return absoluteUrl(`/og?${params.toString()}`);
}

export function buildBlogPostingSchema(
  post: PublishedPost,
  organizationName: string,
  socialLinks: SocialLinks,
  defaultOgImage?: string | null,
) {
  const image =
    resolveImageUrl(post.ogImage, post.coverImage, defaultOgImage) ??
    buildDefaultPostOgImageUrl(post.title, post.category);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription,
    datePublished: toIsoDate(post.publishedAt),
    dateModified: toIsoDate(post.updatedAt ?? post.publishedAt),
    author: buildAuthorPersonSchema(socialLinks),
    publisher: {
      "@type": "Organization",
      "@id": absoluteUrl("/#organization"),
      name: organizationName,
      logo: {
        "@type": "ImageObject",
        url: resolveImageUrl(defaultOgImage) ?? absoluteUrl("/logo.png"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(postPath(post.slug)),
    },
    image: [image],
    inLanguage: "en-US",
  };
}

export function buildPostFaqPageSchema(
  post: PublishedPost,
  organizationName: string,
) {
  const faqs = Array.isArray(post.postFaqs)
    ? (post.postFaqs as { q: string; a: string }[]).filter(
        (item) => item.q?.trim() && item.a?.trim(),
      )
    : [];

  if (faqs.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
    isPartOf: {
      "@type": "WebPage",
      name: post.title,
      url: absoluteUrl(postPath(post.slug)),
      publisher: {
        "@type": "Organization",
        name: organizationName,
      },
    },
  };
}
