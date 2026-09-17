import { Ambient } from "@/components/site/home/motion/ambient";
import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import { InnerPageShell } from "@/components/site/inner-page-shell";
import { CareerJobsGrid } from "@/components/site/careers/career-jobs-grid";
import { getPublishedJobs } from "@/lib/queries/jobs";
import {
  getCareersPageSections,
  systemPageMetadata,
} from "@/lib/pages/system-page-content";
import { buildStaticMetaFromKey } from "@/lib/seo/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return systemPageMetadata("careers", "/careers", () =>
    buildStaticMetaFromKey("careers"),
  );
}

export default async function CareersPage() {
  const [jobs, sections] = await Promise.all([
    getPublishedJobs(),
    getCareersPageSections(),
  ]);

  return (
    <InnerPageShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Careers" },
      ]}
    >
      <section className="relative overflow-clip pb-10 pt-8 md:pb-14 md:pt-10">
        <Ambient />
        <div className="relative mx-auto max-w-[1120px] px-6">
          <BlurReveal>
            <p className="text-sm font-medium text-accent">
              {sections.hero.eyebrow}
            </p>
            <h1 className="mt-3 text-[clamp(1.35rem,3.2vw,2.75rem)] font-semibold leading-none tracking-[-0.035em] text-foreground md:whitespace-nowrap">
              {sections.hero.headline}
            </h1>
            <p className="mt-4 text-sm text-muted md:whitespace-nowrap md:text-base">
              {sections.hero.subtext}
            </p>
          </BlurReveal>
        </div>
      </section>

      <section
        id="openings"
        className="mx-auto max-w-[1120px] scroll-mt-24 px-6 pb-24"
      >
        <BlurReveal>
          <h2 className="mb-8 font-display text-2xl font-semibold text-foreground">
            {sections.openingsTitle}
          </h2>
        </BlurReveal>
        <CareerJobsGrid
          jobs={jobs}
          emptyTitle={sections.fallbackTitle}
          emptyBody={sections.fallbackBody}
          emptyEmail={sections.fallbackEmail}
        />

        <div className="mt-12 rounded-default border border-border bg-surface p-8">
          <p className="font-display text-lg font-semibold text-foreground">
            {sections.fallbackTitle}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {sections.fallbackBody}
          </p>
          <a
            href={`mailto:${sections.fallbackEmail}`}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-default border border-border px-5 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            {sections.fallbackButtonLabel}
          </a>
        </div>
      </section>
    </InnerPageShell>
  );
}
