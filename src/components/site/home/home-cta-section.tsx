import { HomeCtaSection as HomeCtaSectionView } from "@/components/site/home/home-cta-section-client";
import type { LinkButton } from "@/lib/content/link-button";
import { getContentMap, getLinkButton } from "@/lib/queries/content-blocks";

/** Server wrapper: loads CMS CTA when used without explicit props. */
export async function HomeCtaSection(props?: {
  eyebrow?: string;
  headline?: string;
  body?: string;
  emailPrefLabel?: string;
  emailAddress?: string;
  watermark?: string;
  cta?: LinkButton;
}) {
  const [content, cta] = await Promise.all([
    getContentMap([
      "home.cta.eyebrow",
      "home.cta.headline",
      "home.cta.body",
      "home.cta.email_pref",
      "home.cta.email",
      "home.cta.watermark",
    ]),
    getLinkButton("home.cta.button"),
  ]);

  return (
    <HomeCtaSectionView
      eyebrow={props?.eyebrow ?? content["home.cta.eyebrow"]}
      headline={props?.headline ?? content["home.cta.headline"]}
      body={props?.body ?? content["home.cta.body"]}
      emailPrefLabel={props?.emailPrefLabel ?? content["home.cta.email_pref"]}
      emailAddress={props?.emailAddress ?? content["home.cta.email"]}
      watermark={props?.watermark ?? content["home.cta.watermark"]}
      cta={props?.cta ?? cta}
    />
  );
}
