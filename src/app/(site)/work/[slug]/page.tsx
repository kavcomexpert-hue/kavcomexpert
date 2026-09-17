import { Ambient } from "@/components/site/home/motion/ambient";
import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import { HomeCtaSection } from "@/components/site/home/home-cta-section";
import { InnerPageShell } from "@/components/site/inner-page-shell";
import { RichText } from "@/components/site/rich-text";
import { JsonLd } from "@/components/seo/json-ld";
import { WorkGallerySlider } from "@/components/site/work/work-gallery-slider";
import {
  getCaseStudies,
  getCaseStudyBySlug,
} from "@/lib/queries/case-studies";
import { safePublicQuery } from "@/lib/queries/safe-fetch";
import { resolveCaseStudyPreview } from "@/lib/preview/access";
import { getAllTestimonials } from "@/lib/queries/testimonials";
import { getSiteSettings } from "@/lib/queries/site-settings";
import { buildCaseStudyArticleSchema } from "@/lib/schema/case-study";
import {
  parseSectionLabels,
  resolveSectionLabel,
  type CaseStudySectionLabels,
} from "@/lib/case-studies/section-labels";
import { parseGallery } from "@/lib/site/content-parsers";
import { hasItems, hasRichDoc, hasText } from "@/lib/site/optional-section";
import {
  isEmbeddableVideoUrl,
  toEmbedUrl,
} from "@/lib/site/video-embed";
import { SafeImage } from "@/components/site/safe-image";
import { ServiceHeroLottieLoader } from "@/components/site/service-page/service-hero-lottie-loader";
import { buildContentMetadataFromSettings } from "@/lib/seo/metadata";
import { caseStudyPath, workIndexPath } from "@/lib/paths";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

type WorkDetailPageProps = {
  params: Promise<{ slug: string }>;
};

function normalizeMatch(value: string) {
  return value.trim().toLowerCase();
}

function normalizeExternalUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const caseStudies = await getCaseStudies();
    return caseStudies.map((study) => ({ slug: study.slug }));
  } catch (error) {
    console.warn(
      "[work] generateStaticParams failed; building with zero paths.",
      error,
    );
    return [];
  }
}

export async function generateMetadata({
  params,
}: WorkDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const preview = await resolveCaseStudyPreview(slug);
  const caseStudy =
    preview ??
    (await safePublicQuery(`work/${slug}`, () => getCaseStudyBySlug(slug)));

  if (!caseStudy) {
    return {};
  }

  return buildContentMetadataFromSettings({
    metaTitle: caseStudy.metaTitle,
    metaDescription: caseStudy.metaDescription,
    canonicalUrl: caseStudy.canonicalUrl,
    path: caseStudyPath(caseStudy.slug),
    noIndex: caseStudy.noIndex,
    ogImage: caseStudy.ogImage,
    openGraphType: "article",
    publishedTime: caseStudy.publishedAt,
    modifiedTime: caseStudy.updatedAt,
  });
}

function ClientFeedbackVideo({ url, title }: { url: string; title: string }) {
  if (isEmbeddableVideoUrl(url)) {
    return (
      <div className="aspect-video overflow-hidden rounded-default bg-background">
        <iframe
          title={title}
          src={toEmbedUrl(url)}
          className="size-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        />
      </div>
    );
  }

  return (
    <video
      src={url}
      controls
      playsInline
      className="aspect-video w-full rounded-default bg-background object-contain"
    />
  );
}

function SectionMedia({
  url,
  alt,
}: {
  url: string;
  alt: string;
}) {
  if (/\.json(\?|$)/i.test(url)) {
    return (
      <div className="overflow-hidden rounded-default bg-transparent">
        <ServiceHeroLottieLoader src={url} label={alt} />
      </div>
    );
  }

  if (isEmbeddableVideoUrl(url)) {
    return (
      <div className="overflow-hidden rounded-default bg-background">
        <div className="aspect-[4/3]">
          <iframe
            title={alt}
            src={toEmbedUrl(url)}
            className="size-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          />
        </div>
      </div>
    );
  }

  if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url)) {
    return (
      <video
        src={url}
        controls
        playsInline
        className="aspect-[4/3] w-full rounded-default bg-background object-cover"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-default bg-background">
      <SafeImage
        src={url}
        alt={alt}
        width={960}
        height={720}
        className="aspect-[4/3] w-full object-cover"
      />
    </div>
  );
}

function CaseStudySection({
  eyebrow,
  headline,
  mediaUrl,
  mediaAlt,
  alignEnd,
  surface,
  children,
}: {
  eyebrow: string;
  headline: string;
  mediaUrl?: string | null;
  mediaAlt: string;
  alignEnd?: boolean;
  surface?: boolean;
  children: ReactNode;
}) {
  const hasMedia = hasText(mediaUrl);

  return (
    <section
      className={`relative py-16 md:py-24 ${
        surface ? "border-y border-border bg-surface" : ""
      }`}
    >
      <div className="mx-auto max-w-[1120px] px-6">
        {hasMedia ? (
          <div
            className={`grid items-start gap-10 md:grid-cols-2 md:gap-12 ${
              alignEnd ? "md:[&>*:first-child]:order-2" : ""
            }`}
          >
            <BlurReveal>
              <p className="text-sm font-medium text-accent">{eyebrow}</p>
              <h2 className="mt-3 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">
                {headline}
              </h2>
              <div className="mt-8">{children}</div>
            </BlurReveal>
            <BlurReveal delay={0.06}>
              <SectionMedia url={mediaUrl!.trim()} alt={mediaAlt} />
            </BlurReveal>
          </div>
        ) : (
          <div className="mx-auto max-w-[760px] text-center">
            <BlurReveal>
              <p className="text-sm font-medium text-accent">{eyebrow}</p>
              <h2 className="mt-3 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">
                {headline}
              </h2>
              <div className="mt-8 text-center [&_.rich-text]:text-center [&_.rich-text_p]:text-center [&_.rich-text_li]:text-center">
                {children}
              </div>
            </BlurReveal>
          </div>
        )}
      </div>
    </section>
  );
}

function ClientInfoCard({
  clientName,
  website,
  industry,
  engagementType,
  servicesProvided,
  location,
  platformStack,
  headlineLabel,
  headlineValue,
  visitSiteLabel,
  clientLabel,
  industryLabel,
  engagementLabel,
  servicesLabel,
  locationLabel,
  platformLabel,
}: {
  clientName: string;
  website: string;
  industry: string;
  engagementType: string;
  servicesProvided: string;
  location: string;
  platformStack: string;
  headlineLabel: string;
  headlineValue: string;
  visitSiteLabel: string;
  clientLabel: string;
  industryLabel: string;
  engagementLabel: string;
  servicesLabel: string;
  locationLabel: string;
  platformLabel: string;
}) {
  const siteUrl = normalizeExternalUrl(website);
  const showHeadline = hasText(headlineValue);
  const rows: { label: string; value: string }[] = [];

  if (hasText(clientName)) {
    rows.push({ label: clientLabel, value: clientName.trim() });
  }
  if (hasText(industry)) {
    rows.push({ label: industryLabel, value: industry.trim() });
  }
  if (hasText(servicesProvided)) {
    rows.push({ label: servicesLabel, value: servicesProvided.trim() });
  }
  if (hasText(location)) {
    rows.push({ label: locationLabel, value: location.trim() });
  }
  if (hasText(platformStack)) {
    rows.push({ label: platformLabel, value: platformStack.trim() });
  }
  if (hasText(engagementType)) {
    rows.push({ label: engagementLabel, value: engagementType.trim() });
  }

  const hasAny =
    rows.length > 0 || showHeadline || hasText(siteUrl);

  if (!hasAny) return null;

  return (
    <aside className="w-full shrink-0 rounded-default border border-border bg-surface p-5 shadow-soft md:max-w-[320px] md:p-6">
      <dl className="space-y-4">
        {rows.map((row) => (
          <div key={`${row.label}-${row.value}`}>
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              {row.label}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">
              {row.value}
            </dd>
          </div>
        ))}
        {showHeadline ? (
          <div className="border-t border-border pt-4">
            {hasText(headlineLabel) ? (
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                {headlineLabel.trim()}
              </dt>
            ) : null}
            <dd
              className={`text-2xl font-semibold tracking-tight text-accent ${
                hasText(headlineLabel) ? "mt-1" : ""
              }`}
            >
              {headlineValue.trim()}
            </dd>
          </div>
        ) : null}
      </dl>
      {hasText(siteUrl) ? (
        <a
          href={siteUrl}
          target="_blank"
          rel="noopener nofollow"
          className={`inline-flex text-sm font-medium text-accent transition-colors hover:text-foreground ${
            rows.length > 0 || showHeadline ? "mt-5" : ""
          }`}
        >
          {visitSiteLabel}
        </a>
      ) : null}
    </aside>
  );
}

export default async function WorkDetailPage({ params }: WorkDetailPageProps) {
  const { slug } = await params;
  const preview = await resolveCaseStudyPreview(slug);
  const [published, testimonials, settings] = await Promise.all([
    preview
      ? Promise.resolve(null)
      : safePublicQuery(`work/${slug}`, () => getCaseStudyBySlug(slug)),
    getAllTestimonials(),
    getSiteSettings(),
  ]);

  const caseStudy = preview ?? published;

  if (!caseStudy) {
    notFound();
  }

  const labels = parseSectionLabels(caseStudy.sectionLabels) as CaseStudySectionLabels;
  const gallery = parseGallery(caseStudy.gallery);
  const pageHeading =
    caseStudy.pageHeading?.trim() || caseStudy.client.trim();
  const clientName = caseStudy.client.trim();
  const website = caseStudy.website?.trim() || "";
  const industry = caseStudy.industry?.trim() || "";
  const engagementType = caseStudy.engagementType?.trim() || "";
  const servicesProvided = caseStudy.servicesProvided?.trim() || "";
  const location = caseStudy.location?.trim() || "";
  const platformStack = caseStudy.platformStack?.trim() || "";
  const infoHeadlineLabel = caseStudy.infoHeadlineLabel?.trim() || "";
  const infoHeadlineValue = caseStudy.infoHeadlineValue?.trim() || "";

  const showInfoCard =
    hasText(clientName) ||
    hasText(website) ||
    hasText(industry) ||
    hasText(engagementType) ||
    hasText(servicesProvided) ||
    hasText(location) ||
    hasText(platformStack) ||
    hasText(infoHeadlineValue);

  const clientKey = normalizeMatch(caseStudy.client);
  const storedQuote =
    caseStudy.clientQuote &&
    typeof caseStudy.clientQuote === "object" &&
    "quote" in caseStudy.clientQuote &&
    typeof (caseStudy.clientQuote as { quote?: unknown }).quote === "string"
      ? (caseStudy.clientQuote as {
          quote: string;
          name?: string;
          role?: string;
          videoUrl?: string | null;
        })
      : null;

  const matchedTestimonial =
    testimonials.find((item) => {
      const company = item.company ? normalizeMatch(item.company) : "";
      const name = normalizeMatch(item.clientName);
      return (
        company === clientKey ||
        name === clientKey ||
        (company.length > 0 && clientKey.includes(company)) ||
        (company.length > 0 && company.includes(clientKey))
      );
    }) ?? null;

  const feedbackVideoUrl =
    storedQuote?.videoUrl?.trim() ||
    matchedTestimonial?.videoUrl?.trim() ||
    "";
  const feedbackQuote =
    storedQuote?.quote?.trim() || matchedTestimonial?.quote?.trim() || "";
  const feedbackName =
    storedQuote?.name?.trim() ||
    matchedTestimonial?.clientName ||
    caseStudy.client;
  const feedbackRole =
    storedQuote?.role?.trim() || matchedTestimonial?.role?.trim() || "";
  const feedbackCompany = matchedTestimonial?.company?.trim() || "";
  const feedbackHeadshot = matchedTestimonial?.headshot ?? null;
  const showClientFeedback = hasText(feedbackVideoUrl) || hasText(feedbackQuote);

  const backLink = resolveSectionLabel(labels, "backLink");
  const visitSiteLabel = resolveSectionLabel(labels, "visitSite");
  const clientCardClientLabel = resolveSectionLabel(
    labels,
    "clientCardClientLabel",
  );
  const clientCardIndustryLabel = resolveSectionLabel(
    labels,
    "clientCardIndustryLabel",
  );
  const clientCardEngagementLabel = resolveSectionLabel(
    labels,
    "clientCardEngagementLabel",
  );
  const clientCardServicesLabel = resolveSectionLabel(
    labels,
    "clientCardServicesLabel",
  );
  const clientCardLocationLabel = resolveSectionLabel(
    labels,
    "clientCardLocationLabel",
  );
  const clientCardPlatformLabel = resolveSectionLabel(
    labels,
    "clientCardPlatformLabel",
  );

  return (
    <InnerPageShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Work", href: workIndexPath },
        { label: pageHeading },
      ]}
    >
      <JsonLd
        data={buildCaseStudyArticleSchema(
          caseStudy,
          settings.organizationName,
          settings.defaultOgImage,
        )}
      />
      <article className="relative overflow-clip">
        <Ambient />

        <header className="relative mx-auto max-w-[1120px] px-6 pb-12 pt-6 md:pb-16 md:pt-10">
          <BlurReveal>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
              <div className="min-w-0 flex-1">
                <Link
                  href={workIndexPath}
                  className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-accent"
                >
                  <ChevronLeft
                    className="size-4"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  {backLink}
                </Link>
                <h1 className="mt-8 max-w-3xl text-balance text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-foreground">
                  {pageHeading}
                </h1>
              </div>
              {showInfoCard ? (
                <ClientInfoCard
                  clientName={clientName}
                  website={website}
                  industry={industry}
                  engagementType={engagementType}
                  servicesProvided={servicesProvided}
                  location={location}
                  platformStack={platformStack}
                  headlineLabel={infoHeadlineLabel}
                  headlineValue={infoHeadlineValue}
                  visitSiteLabel={visitSiteLabel}
                  clientLabel={clientCardClientLabel}
                  industryLabel={clientCardIndustryLabel}
                  engagementLabel={clientCardEngagementLabel}
                  servicesLabel={clientCardServicesLabel}
                  locationLabel={clientCardLocationLabel}
                  platformLabel={clientCardPlatformLabel}
                />
              ) : null}
            </div>
          </BlurReveal>
        </header>

        {hasText(caseStudy.challenge) ? (
          <CaseStudySection
            eyebrow={resolveSectionLabel(labels, "challengeEyebrow")}
            headline={resolveSectionLabel(labels, "challengeHeadline")}
            mediaUrl={caseStudy.challengeMedia}
            mediaAlt={`${caseStudy.client} challenge`}
          >
            <p className="text-base leading-relaxed text-muted md:text-lg">
              {caseStudy.challenge}
            </p>
          </CaseStudySection>
        ) : null}

        {hasRichDoc(caseStudy.approach) ? (
          <CaseStudySection
            eyebrow={resolveSectionLabel(labels, "approachEyebrow")}
            headline={resolveSectionLabel(labels, "approachHeadline")}
            mediaUrl={caseStudy.approachMedia}
            mediaAlt={`${caseStudy.client} approach`}
            alignEnd
            surface
          >
            <RichText content={caseStudy.approach} />
          </CaseStudySection>
        ) : null}

        {hasRichDoc(caseStudy.solution) ? (
          <CaseStudySection
            eyebrow={resolveSectionLabel(labels, "solutionEyebrow")}
            headline={resolveSectionLabel(labels, "solutionHeadline")}
            mediaUrl={caseStudy.solutionMedia}
            mediaAlt={`${caseStudy.client} delivery`}
          >
            <RichText content={caseStudy.solution} />
          </CaseStudySection>
        ) : null}

        {hasRichDoc(caseStudy.clientNoticed) ? (
          <CaseStudySection
            eyebrow={resolveSectionLabel(labels, "clientNoticedEyebrow")}
            headline={resolveSectionLabel(labels, "clientNoticedHeadline")}
            mediaUrl={caseStudy.clientNoticedMedia}
            mediaAlt={`${caseStudy.client} rollout`}
            alignEnd
            surface
          >
            <RichText content={caseStudy.clientNoticed} />
          </CaseStudySection>
        ) : null}

        {hasItems(gallery) ? (
          <section className="relative mx-auto max-w-[1120px] px-6 py-16 md:py-24">
            <BlurReveal>
              <WorkGallerySlider
                items={gallery}
                clientName={caseStudy.client}
                eyebrow={resolveSectionLabel(labels, "galleryEyebrow")}
                headline={resolveSectionLabel(labels, "galleryHeadline")}
              />
            </BlurReveal>
          </section>
        ) : null}

        {showClientFeedback ? (
          <section className="relative border-y border-border bg-surface py-16 md:py-24">
            <div className="mx-auto max-w-[800px] px-6">
              <BlurReveal>
                <p className="text-sm font-medium text-accent">
                  {resolveSectionLabel(labels, "feedbackEyebrow")}
                </p>
                <div className="mt-8 space-y-8">
                  {hasText(feedbackVideoUrl) ? (
                    <ClientFeedbackVideo
                      url={feedbackVideoUrl}
                      title={`${feedbackName} client feedback`}
                    />
                  ) : null}
                  {hasText(feedbackQuote) ? (
                    <blockquote className="text-center">
                      <p className="text-balance text-[clamp(1.35rem,3vw,2rem)] font-semibold leading-[1.25] tracking-[-0.02em] text-foreground">
                        &ldquo;{feedbackQuote}&rdquo;
                      </p>
                      <footer className="mt-8 flex flex-col items-center gap-3">
                        {feedbackHeadshot ? (
                          <SafeImage
                            src={feedbackHeadshot}
                            alt=""
                            width={56}
                            height={56}
                            className="size-14 rounded-full object-cover"
                          />
                        ) : null}
                        <div>
                          <cite className="not-italic text-sm font-semibold text-foreground">
                            {feedbackName}
                          </cite>
                          {(feedbackRole || feedbackCompany) && (
                            <p className="mt-1 text-sm text-muted">
                              {[feedbackRole, feedbackCompany]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          )}
                        </div>
                      </footer>
                    </blockquote>
                  ) : null}
                </div>
              </BlurReveal>
            </div>
          </section>
        ) : null}

        <HomeCtaSection />
      </article>
    </InnerPageShell>
  );
}
