import { ComparisonTable } from "@/components/houston-cpa/ComparisonTable";
import {
  HOUSTON_CPA_PATH,
  PAGE_DESCRIPTION,
  PAGE_TITLE,
} from "@/components/houston-cpa/constants";
import { FAQ } from "@/components/houston-cpa/FAQ";
import { FinalCTA } from "@/components/houston-cpa/FinalCTA";
import { Hero } from "@/components/houston-cpa/Hero";
import { HowItWorks } from "@/components/houston-cpa/HowItWorks";
import {
  LandingMiniFooter,
  LandingTopBar,
} from "@/components/houston-cpa/LandingChrome";
import { LocalProof } from "@/components/houston-cpa/LocalProof";
import { PainPoints } from "@/components/houston-cpa/PainPoints";
import { Pricing } from "@/components/houston-cpa/Pricing";
import { ServicesGrid } from "@/components/houston-cpa/ServicesGrid";
import { StickyCTABar } from "@/components/houston-cpa/StickyCTABar";
import { TiffanyVideo } from "@/components/houston-cpa/TiffanyVideo";
import { TrustBar } from "@/components/houston-cpa/TrustBar";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublishedLandingPageBySlug } from "@/lib/queries/landing-pages";
import { getSiteSettings } from "@/lib/queries/site-settings";
import { buildHoustonCpaSchema } from "@/lib/schema/houston-cpa-schema";
import { absoluteUrl } from "@/lib/seo/constants";
import type { Metadata } from "next";

export const revalidate = 3600;

const HOUSTON_SLUG = "cpa-marketing-agency-houston";

export async function generateMetadata(): Promise<Metadata> {
  let title = PAGE_TITLE;
  let description = PAGE_DESCRIPTION;
  let canonical = absoluteUrl(HOUSTON_CPA_PATH);

  try {
    const row = await getPublishedLandingPageBySlug(HOUSTON_SLUG);
    if (row) {
      if (row.metaTitle?.trim()) title = row.metaTitle.trim();
      if (row.metaDescription?.trim()) description = row.metaDescription.trim();
      if (row.canonicalUrl?.trim()) {
        canonical = row.canonicalUrl.trim().startsWith("http")
          ? row.canonicalUrl.trim()
          : absoluteUrl(row.canonicalUrl.trim());
      } else if (row.path) {
        canonical = absoluteUrl(row.path);
      }
    }
  } catch {
    // Fall back to hardcoded constants when DB is unavailable.
  }

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: "Kavcom Expert",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function HoustonCpaLandingPage() {
  const settings = await getSiteSettings();
  const schema = buildHoustonCpaSchema(settings);

  // Soft-touch DB lookup so SEO/admin status can live in CMS without blocking the live page.
  try {
    await getPublishedLandingPageBySlug(HOUSTON_SLUG);
  } catch {
    // Keep rendering hardcoded UI if DB is down.
  }

  return (
    <>
      <JsonLd data={schema} />
      <LandingTopBar
        organizationName={settings.organizationName}
        logoSrc={settings.logoUrl}
      />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <Hero />
        <TrustBar />
        <PainPoints />
        <ServicesGrid />
        <HowItWorks />
        <Pricing />
        <ComparisonTable />
        <TiffanyVideo />
        <LocalProof />
        <FAQ />
        <FinalCTA />
      </main>
      <LandingMiniFooter organizationName={settings.organizationName} />
      <StickyCTABar />
    </>
  );
}
