import type { FaqEntry } from "@/components/site/home/faq-section";
import type { LinkButton } from "@/lib/content/link-button";
import type { ReactNode } from "react";

export type ServiceOffering = {
  title: string;
  description: string;
  /** When set, the offering card links to this path. */
  href?: string;
};

export type ServiceWhyReason = {
  title: string;
  body: string;
};

export type ServiceWorkItem = {
  clientName: string;
  industry: string;
  website: string;
  websiteUrl: string;
  /** One or more preview images (crossfade on the card). */
  images: string[];
  videoUrl?: string;
};

export type ServiceTextBlock = {
  heading?: string;
  subheading?: string;
  body?: unknown;
};

export type ServiceProcessStep = {
  number: string;
  name: string;
  description: string;
};

export type ServiceHeroVisual = {
  mode: "animation" | "media";
  mediaUrl?: string;
};

export type StaticServicePage = {
  slug: string;
  /** Canonical public path (nested for child services). Defaults to /services/{slug}. */
  path?: string;
  name: string;
  metaTitle: string;
  metaDescription: string;
  /** Direct answer block for AI search / featured snippets. */
  aeoSummary: string;
  intro: string;
  introContinued?: string;
  /** Hero eyebrow above the H1. When omitted, UI falls back to `{platformLabel} development`. */
  heroEyebrow?: string;
  tags: readonly string[];
  featuresEyebrow: string;
  featuresHeadline: string;
  featuresIntro: string;
  features: readonly string[];
  offeringsEyebrow: string;
  offeringsHeadline: string;
  offerings: readonly ServiceOffering[];
  whyEyebrow: string;
  whyHeadline: string;
  whyIntro: string;
  whyReasons: readonly ServiceWhyReason[];
  /** When omitted or empty, the template uses the default process. */
  processEyebrow?: string;
  processHeadline?: string;
  processSteps?: readonly ServiceProcessStep[];
  /** When false, the How it works section is hidden. */
  showProcess?: boolean;
  workEyebrow?: string;
  workHeadline: string;
  workItems: readonly ServiceWorkItem[];
  /** Hero primary CTA (Get in touch). Default enabled. */
  heroCtaPrimary?: LinkButton;
  /** Hero secondary CTA (View our work). Default enabled. */
  heroCtaSecondary?: LinkButton;
  /** Why section CTA (Start a project). Default enabled. */
  whyCta?: LinkButton;
  textBlocks?: readonly ServiceTextBlock[];
  faqsEyebrow?: string;
  faqsHeadline?: string;
  faqsCta?: LinkButton;
  faqs: readonly FaqEntry[];
  /** Optional Spline scene URL (self-hosted .splinecode / .spline under /public). */
  heroSplineScene?: string;
  /** Admin-managed hero visual: coded animation (default) or custom media. */
  heroVisual?: ServiceHeroVisual;
  /** When false, the bottom HomeCtaSection is hidden. Default true. */
  showBottomCta?: boolean;
  /** Optional bottom CTA overrides — empty/undefined keeps site HomeCtaSection defaults. */
  bottomCtaEyebrow?: string;
  bottomCtaHeadline?: string;
  bottomCtaEmail?: string;
  bottomCtaWatermark?: string;
  bottomCtaButton?: LinkButton;
  /** Optional icon component name key, resolved in template. */
  platformLabel: string;
};

export type ServicePageIcon = ReactNode;
