import { SCHEMA_AUTHOR_NAME } from "@/lib/schema/author-name";
import type { SocialLinks } from "@/lib/queries/site-settings";
import { absoluteUrl } from "@/lib/seo/constants";

export function buildAuthorPersonSchema(socialLinks: SocialLinks) {
  const sameAs = [
    socialLinks.linkedin,
    socialLinks.facebook,
    socialLinks.instagram,
  ].filter((url): url is string => Boolean(url?.trim()));

  return {
    "@type": "Person" as const,
    name: SCHEMA_AUTHOR_NAME,
    url: absoluteUrl("/about-us"),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}
