import { Ambient } from "@/components/site/home/motion/ambient";
import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import { InnerPageShell } from "@/components/site/inner-page-shell";
import { RichText } from "@/components/site/rich-text";
import { JobApplyForm } from "@/components/site/careers/job-apply-form";
import { getCareersPageSections } from "@/lib/pages/system-page-content";
import { resolveJobPreview } from "@/lib/preview/access";
import { getJobBySlug, getPublishedJobSlugs } from "@/lib/queries/jobs";
import { safePublicQuery } from "@/lib/queries/safe-fetch";
import { jobPath } from "@/lib/paths";
import {
  buildContentMetadataFromSettings,
  buildStaticPageMetadata,
} from "@/lib/seo/metadata";
import { MapPin, Clock, Banknote } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type JobPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const slugs = await getPublishedJobSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.warn(
      "[careers] generateStaticParams failed; building with zero paths.",
      error,
    );
    return [];
  }
}

export async function generateMetadata({
  params,
}: JobPageProps): Promise<Metadata> {
  const { slug } = await params;
  const preview = await resolveJobPreview(slug);
  const job =
    preview ??
    (await safePublicQuery(`careers/${slug}`, () => getJobBySlug(slug)));

  if (!job) {
    return buildStaticPageMetadata({
      title: "Job Not Found | Kavcom Expert",
      description: "This job posting is no longer available.",
      path: `/careers/${slug}`,
    });
  }

  const fallbackTitle = `${job.title} | Kavcom Expert Careers`;
  const fallbackDescription =
    job.requirements?.slice(0, 160) ||
    `Apply for ${job.title} at Kavcom Expert.`;

  return buildContentMetadataFromSettings({
    metaTitle: job.metaTitle?.trim() || fallbackTitle,
    metaDescription: job.metaDescription?.trim() || fallbackDescription,
    canonicalUrl: job.canonicalUrl,
    path: jobPath(job.slug),
    noIndex: job.noIndex,
    ogImage: job.ogImage,
    openGraphType: "website",
    publishedTime: job.publishedAt,
    modifiedTime: job.updatedAt,
  });
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  remote: "Remote",
};

export default async function JobDetailPage({ params }: JobPageProps) {
  const { slug } = await params;
  const preview = await resolveJobPreview(slug);
  const [published, careersSections] = await Promise.all([
    preview
      ? Promise.resolve(null)
      : safePublicQuery(`careers/${slug}`, () => getJobBySlug(slug)),
    getCareersPageSections(),
  ]);
  const job = preview ?? published;

  if (!job) notFound();

  return (
    <InnerPageShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Careers", href: "/careers" },
        { label: job.title },
      ]}
    >
      <section className="relative overflow-clip pb-16 pt-8 md:pb-24 md:pt-10">
        <Ambient />
        <div className="relative mx-auto max-w-[1120px] px-6">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-start">
            <div>
              <BlurReveal>
                {job.department ? (
                  <p className="mb-3 text-sm font-medium text-accent">
                    {job.department}
                  </p>
                ) : null}
                <h1 className="text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">
                  {job.title}
                </h1>
              </BlurReveal>

              <BlurReveal delay={0.06}>
                <div className="mt-4 flex flex-wrap gap-4">
                  {job.location ? (
                    <span className="flex items-center gap-1.5 text-sm text-muted">
                      <MapPin className="size-4 shrink-0" aria-hidden="true" />
                      {job.location}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1.5 text-sm text-muted">
                    <Clock className="size-4 shrink-0" aria-hidden="true" />
                    {EMPLOYMENT_LABELS[job.employmentType] ??
                      job.employmentType}
                  </span>
                  {job.salaryRange ? (
                    <span className="flex items-center gap-1.5 text-sm text-muted">
                      <Banknote className="size-4 shrink-0" aria-hidden="true" />
                      {job.salaryRange}
                    </span>
                  ) : null}
                </div>
              </BlurReveal>

              {job.requirements ? (
                <BlurReveal delay={0.1}>
                  <div className="mt-8 rounded-default border border-border bg-surface p-6">
                    <h2 className="font-display text-lg font-semibold text-foreground">
                      What we&apos;re looking for
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted whitespace-pre-line">
                      {job.requirements}
                    </p>
                  </div>
                </BlurReveal>
              ) : null}

              {job.description ? (
                <BlurReveal delay={0.14}>
                  <div className="prose-sm mt-8">
                    <RichText content={job.description} />
                  </div>
                </BlurReveal>
              ) : null}
            </div>

            <aside className="lg:sticky lg:top-28">
              <BlurReveal delay={0.1}>
                <div className="rounded-default border border-border bg-surface p-7 shadow-soft dark:shadow-glow">
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    Apply for this role
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    We review every application personally and aim to respond
                    within 5 business days.
                  </p>
                  <div className="mt-6">
                    <JobApplyForm
                      jobId={job.id}
                      applyNameLabel={careersSections.applyNameLabel}
                      applyNamePlaceholder={careersSections.applyNamePlaceholder}
                      applyEmailLabel={careersSections.applyEmailLabel}
                      applyEmailPlaceholder={
                        careersSections.applyEmailPlaceholder
                      }
                      applyPhoneLabel={careersSections.applyPhoneLabel}
                      applyPhonePlaceholder={
                        careersSections.applyPhonePlaceholder
                      }
                      applyLinkedinLabel={careersSections.applyLinkedinLabel}
                      applyLinkedinPlaceholder={
                        careersSections.applyLinkedinPlaceholder
                      }
                      applyCoverLabel={careersSections.applyCoverLabel}
                      applyCoverPlaceholder={
                        careersSections.applyCoverPlaceholder
                      }
                      applyResumeLabel={careersSections.applyResumeLabel}
                      applySubmitLabel={careersSections.applySubmitLabel}
                      applySuccessTitle={careersSections.applySuccessTitle}
                      applySuccessBody={careersSections.applySuccessBody}
                    />
                  </div>
                </div>
              </BlurReveal>
            </aside>
          </div>
        </div>
      </section>
    </InnerPageShell>
  );
}
