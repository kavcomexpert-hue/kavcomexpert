import { HomeCtaSection } from "@/components/site/home/home-cta-section";
import { InnerPageShell } from "@/components/site/inner-page-shell";
import { WorkPortfolio } from "@/components/site/work/work-portfolio";
import { getCaseStudies } from "@/lib/queries/case-studies";
import { getWorkGallery } from "@/lib/queries/work-gallery";
import {
  getWorkPageSections,
  systemPageMetadata,
} from "@/lib/pages/system-page-content";
import { buildStaticMetaFromKey } from "@/lib/seo/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return systemPageMetadata("work", "/work", () => buildStaticMetaFromKey("work"));
}

export default async function WorkIndexPage() {
  const [projects, sections, generalGallery] = await Promise.all([
    getCaseStudies(),
    getWorkPageSections(),
    getWorkGallery(),
  ]);

  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Work" }]}
    >
      <WorkPortfolio
        projects={projects}
        hero={sections.hero}
        galleryCopy={sections.gallery}
        generalGallery={generalGallery}
      />
      <HomeCtaSection />
    </InnerPageShell>
  );
}
