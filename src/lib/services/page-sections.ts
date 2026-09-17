import { servicePath } from "@/lib/paths";
import type {
  ServiceHeroVisual,
  StaticServicePage,
} from "@/lib/site/service-pages/types";
import {
  linkButton,
  linkButtonZodField,
} from "@/lib/content/link-button";
import { z } from "zod";

export const SERVICE_SECTION_KEYS = [
  "hero",
  "tags",
  "features",
  "offerings",
  "why",
  "process",
  "work",
  "text",
  "faqs",
] as const;

export type ServiceSectionKey = (typeof SERVICE_SECTION_KEYS)[number];

export const serviceSectionLabels: Record<ServiceSectionKey, string> = {
  hero: "Hero & intro",
  tags: "Tag strip",
  features: "Key features",
  offerings: "Offerings",
  why: "Why us",
  process: "How it works",
  work: "Related work",
  text: "Text",
  faqs: "FAQs",
};

export const DEFAULT_PROCESS_STEPS = [
  {
    number: "01",
    name: "Discover",
    description:
      "We start by listening. Before anyone talks design or code, we want to understand your business, who your customers are, what your competitors are doing, and what has and hasn't worked for you before.",
  },
  {
    number: "02",
    name: "Strategize",
    description:
      "Then we put a plan on paper. Clear goals, realistic timelines, and what success actually looks like in numbers, agreed together before any work begins.",
  },
  {
    number: "03",
    name: "Design",
    description:
      "This is where your brand takes shape. We design around your customers and how they actually behave, not around what looks good in a portfolio.",
  },
  {
    number: "04",
    name: "Build",
    description:
      "Our developers bring the designs to life with clean, fast code built to grow with you. You get regular updates and working previews along the way.",
  },
  {
    number: "05",
    name: "Grow",
    description:
      "We stay with you long after launch to make sure your new site is working as hard as you are.",
  },
] as const;

/**
 * Item fields are tolerant (default to "") so a partially filled row saved
 * mid-edit never fails the whole page parse; empty items are filtered out
 * later in sectionsToStaticPage.
 */
const tolerantString = z
  .string()
  .nullish()
  .transform((value) => value ?? "");

const tolerantStringDefault = (fallback: string) =>
  z
    .string()
    .nullish()
    .transform((value) => (value == null || value === "" ? fallback : value));

const offeringSchema = z.object({
  title: tolerantString,
  description: tolerantString,
  href: z.string().optional(),
});

const whyReasonSchema = z.object({
  title: tolerantString,
  body: tolerantString,
});

const workItemSchema = z
  .object({
    clientName: tolerantString,
    industry: tolerantString,
    website: tolerantString,
    websiteUrl: tolerantString,
    /** Prefer `images`. Legacy `thumbnailSrc` is migrated on parse. */
    images: z.array(z.string()).nullish(),
    thumbnailSrc: z.string().optional(),
    videoUrl: z.string().optional(),
    /** Legacy — ignored (cards open a preview modal). */
    href: z.string().optional(),
  })
  .transform((item) => {
    const fromImages = (item.images ?? [])
      .map((url) => url.trim())
      .filter(Boolean);
    const images =
      fromImages.length > 0
        ? fromImages
        : item.thumbnailSrc?.trim()
          ? [item.thumbnailSrc.trim()]
          : [];
    return {
      clientName: item.clientName,
      industry: item.industry,
      website: item.website,
      websiteUrl: item.websiteUrl,
      images,
      videoUrl: item.videoUrl?.trim() || undefined,
    };
  });

const textBlockSchema = z.object({
  heading: tolerantString,
  subheading: tolerantString,
  /** TipTap JSON document (same shape as post body). */
  body: z.unknown().optional(),
});

const faqSchema = z.object({
  question: tolerantString,
  answer: tolerantString,
});

const processStepSchema = z.object({
  number: tolerantString,
  name: tolerantString,
  description: tolerantString,
});

function isNonEmptyTiptap(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const content = (body as { content?: unknown[] }).content;
  if (!Array.isArray(content) || content.length === 0) return false;
  return content.some((node) => {
    if (!node || typeof node !== "object") return false;
    const n = node as { text?: string; content?: unknown[] };
    if (typeof n.text === "string" && n.text.trim()) return true;
    return Array.isArray(n.content) && n.content.length > 0;
  });
}

export function isRenderableTextBlock(block: {
  heading?: string;
  subheading?: string;
  body?: unknown;
}): boolean {
  return Boolean(
    block.heading?.trim() ||
      block.subheading?.trim() ||
      isNonEmptyTiptap(block.body),
  );
}

export const servicePageSectionsSchema = z.object({
  enabledSections: z
    .array(z.enum(SERVICE_SECTION_KEYS))
    .nullish()
    .transform((value) => value ?? [...SERVICE_SECTION_KEYS]),
  aeoSummary: tolerantString,
  intro: tolerantString,
  introContinued: tolerantString,
  /** Full hero eyebrow. Empty → public UI uses `{platformLabel} development`. */
  heroEyebrow: tolerantString,
  /** Hero H1. Empty → public UI uses the page/service name/title. */
  heroHeading: tolerantString,
  tags: z.array(tolerantString).nullish().transform((value) => value ?? []),
  featuresEyebrow: tolerantStringDefault("Key features"),
  featuresHeadline: tolerantString,
  featuresIntro: tolerantString,
  features: z
    .array(tolerantString)
    .nullish()
    .transform((value) => value ?? []),
  offeringsEyebrow: tolerantStringDefault("What we build"),
  offeringsHeadline: tolerantString,
  offerings: z
    .array(offeringSchema)
    .nullish()
    .transform((value) => value ?? []),
  whyEyebrow: tolerantStringDefault("Why Kavcom"),
  whyHeadline: tolerantString,
  whyIntro: tolerantString,
  whyReasons: z
    .array(whyReasonSchema)
    .nullish()
    .transform((value) => value ?? []),
  processEyebrow: tolerantStringDefault("How it works"),
  processHeadline: tolerantStringDefault(
    "Our proven process for achieving success",
  ),
  processSteps: z
    .array(processStepSchema)
    .nullish()
    .transform((value) => value ?? [...DEFAULT_PROCESS_STEPS]),
  workEyebrow: tolerantStringDefault("Our work"),
  workHeadline: tolerantStringDefault("Related work"),
  workItems: z
    .array(workItemSchema)
    .nullish()
    .transform((value) => value ?? []),
  heroCtaPrimary: linkButtonZodField(
    linkButton("Get in touch", "/contact-us"),
  ),
  heroCtaSecondary: linkButtonZodField(
    linkButton("View our work", "#service-work"),
  ),
  whyCta: linkButtonZodField(linkButton("Start a project", "/contact-us")),
  textBlocks: z
    .array(textBlockSchema)
    .nullish()
    .transform((value) => value ?? []),
  faqsEyebrow: tolerantStringDefault("FAQ"),
  faqsHeadline: tolerantStringDefault("Let's address your questions today!"),
  faqsCta: linkButtonZodField(
    linkButton("Talk to our team", "/contact-us"),
  ),
  faqs: z.array(faqSchema).nullish().transform((value) => value ?? []),
  platformLabel: tolerantString,
  /** Optional Spline scene path (e.g. /spline/…). Empty → coded hero animation. */
  heroSplineScene: tolerantString,
  /** Bottom HomeCtaSection — shown by default; empty overrides use site CTA defaults. */
  showBottomCta: z
    .boolean()
    .nullish()
    .transform((value) => value ?? true),
  bottomCtaEyebrow: tolerantString,
  bottomCtaHeadline: tolerantString,
  bottomCtaEmail: tolerantString,
  bottomCtaWatermark: tolerantString,
  /** Empty label → public page uses the site-wide CTA button. */
  bottomCtaButton: linkButtonZodField(
    linkButton("", "/contact-us"),
  ),
});

export type ServicePageSections = z.infer<typeof servicePageSectionsSchema>;

export function emptyServicePageSections(): ServicePageSections {
  return servicePageSectionsSchema.parse({});
}

export function staticPageToSections(
  page: StaticServicePage,
): ServicePageSections {
  return servicePageSectionsSchema.parse({
    enabledSections: [...SERVICE_SECTION_KEYS],
    aeoSummary: page.aeoSummary,
    intro: page.intro,
    introContinued: page.introContinued ?? "",
    heroEyebrow: page.heroEyebrow ?? "",
    heroHeading: "",
    tags: [...page.tags],
    featuresEyebrow: page.featuresEyebrow,
    featuresHeadline: page.featuresHeadline,
    featuresIntro: page.featuresIntro,
    features: [...page.features],
    offeringsEyebrow: page.offeringsEyebrow,
    offeringsHeadline: page.offeringsHeadline,
    offerings: page.offerings.map((item) => ({
      title: item.title,
      description: item.description,
      href: item.href,
    })),
    whyEyebrow: page.whyEyebrow,
    whyHeadline: page.whyHeadline,
    whyIntro: page.whyIntro,
    whyReasons: page.whyReasons.map((item) => ({
      title: item.title,
      body: item.body,
    })),
    processEyebrow: "How it works",
    processHeadline: `How our ${page.name} process works`,
    processSteps: [...DEFAULT_PROCESS_STEPS],
    workEyebrow: page.workEyebrow ?? "Our work",
    workHeadline: page.workHeadline,
    workItems: page.workItems.map((item) => ({
      clientName: item.clientName,
      industry: item.industry,
      website: item.website,
      websiteUrl: item.websiteUrl,
      images: item.images ?? [],
      videoUrl: item.videoUrl,
    })),
    heroCtaPrimary: page.heroCtaPrimary ?? linkButton("Get in touch", "/contact-us"),
    heroCtaSecondary:
      page.heroCtaSecondary ?? linkButton("View our work", "#service-work"),
    whyCta: page.whyCta ?? linkButton("Start a project", "/contact-us"),
    textBlocks: page.textBlocks ?? [],
    faqsEyebrow: page.faqsEyebrow ?? "FAQ",
    faqsHeadline:
      page.faqsHeadline ?? "Let's address your questions today!",
    faqsCta:
      page.faqsCta ?? linkButton("Talk to our team", "/contact-us"),
    faqs: page.faqs.map((item) => ({
      question: item.question,
      answer: item.answer,
    })),
    platformLabel: page.platformLabel,
    heroSplineScene: page.heroSplineScene ?? "",
    showBottomCta: page.showBottomCta ?? true,
    bottomCtaEyebrow: page.bottomCtaEyebrow ?? "",
    bottomCtaHeadline: page.bottomCtaHeadline ?? "",
    bottomCtaEmail: page.bottomCtaEmail ?? "",
    bottomCtaWatermark: page.bottomCtaWatermark ?? "",
    bottomCtaButton:
      page.bottomCtaButton ?? linkButton("", "/contact-us"),
  });
}

export function parseServicePageSections(
  value: unknown,
): ServicePageSections | null {
  if (!value || typeof value !== "object") return null;
  const parsed = servicePageSectionsSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Build the public template shape from CMS row + sections. */
export function sectionsToStaticPage(input: {
  slug: string;
  name: string;
  metaTitle: string;
  metaDescription: string;
  sections: ServicePageSections;
  /** Canonical public path (nested for child services). */
  path?: string;
  /** Admin-managed hero visual (services.heroVisual). */
  heroVisual?: unknown;
}): StaticServicePage {
  const s = input.sections;
  const enabled = new Set(s.enabledSections);
  const heroOn = enabled.has("hero");
  const heroVisual = parseServiceHeroVisual(input.heroVisual);

  return {
    slug: input.slug,
    path: input.path ?? servicePath({ slug: input.slug }),
    name: s.heroHeading.trim() || input.name,
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
    aeoSummary: heroOn ? s.aeoSummary : input.metaDescription,
    intro: heroOn ? s.intro : "",
    introContinued: heroOn && s.introContinued ? s.introContinued : undefined,
    heroEyebrow: s.heroEyebrow.trim() || undefined,
    tags: enabled.has("tags") ? s.tags.filter(Boolean) : [],
    featuresEyebrow: s.featuresEyebrow,
    featuresHeadline: s.featuresHeadline,
    featuresIntro: s.featuresIntro,
    features: enabled.has("features") ? s.features.filter(Boolean) : [],
    offeringsEyebrow: s.offeringsEyebrow,
    offeringsHeadline: s.offeringsHeadline,
    offerings: enabled.has("offerings")
      ? s.offerings.filter((item) => item.title.trim())
      : [],
    whyEyebrow: s.whyEyebrow,
    whyHeadline: s.whyHeadline,
    whyIntro: s.whyIntro,
    whyReasons: enabled.has("why")
      ? s.whyReasons.filter((item) => item.title.trim())
      : [],
    showProcess: enabled.has("process"),
    processEyebrow: s.processEyebrow,
    processHeadline: s.processHeadline,
    processSteps: enabled.has("process")
      ? s.processSteps.filter(
          (step) => step.name.trim() && step.description.trim(),
        )
      : [],
    workEyebrow: s.workEyebrow,
    workHeadline: s.workHeadline,
    workItems: enabled.has("work")
      ? s.workItems.filter((item) => item.clientName.trim())
      : [],
    heroCtaPrimary: s.heroCtaPrimary,
    heroCtaSecondary: s.heroCtaSecondary,
    whyCta: s.whyCta,
    textBlocks: enabled.has("text")
      ? s.textBlocks.filter(isRenderableTextBlock)
      : [],
    faqsEyebrow: s.faqsEyebrow,
    faqsHeadline: s.faqsHeadline,
    faqsCta: s.faqsCta,
    faqs: enabled.has("faqs")
      ? s.faqs.filter((item) => item.question.trim() && item.answer.trim())
      : [],
    platformLabel: s.platformLabel || input.name,
    ...(heroVisual ? { heroVisual } : {}),
    heroSplineScene:
      s.heroSplineScene.trim() ||
      (input.slug === "cloudflare-integration"
        ? "/spline/cloud-storage-isometric.spline"
        : undefined),
    showBottomCta: s.showBottomCta,
    bottomCtaEyebrow: s.bottomCtaEyebrow.trim() || undefined,
    bottomCtaHeadline: s.bottomCtaHeadline.trim() || undefined,
    bottomCtaEmail: s.bottomCtaEmail.trim() || undefined,
    bottomCtaWatermark: s.bottomCtaWatermark.trim() || undefined,
    bottomCtaButton: s.bottomCtaButton.label.trim()
      ? s.bottomCtaButton
      : undefined,
  };
}

export const serviceHeroVisualSchema = z.object({
  mode: z.enum(["animation", "media"]),
  mediaUrl: z.string().optional(),
});

export type ServiceHeroVisualInput = z.infer<typeof serviceHeroVisualSchema>;

export function parseServiceHeroVisual(
  value: unknown,
): ServiceHeroVisual | null {
  if (!value || typeof value !== "object") return null;
  const parsed = serviceHeroVisualSchema.safeParse(value);
  if (!parsed.success) return null;
  return parsed.data;
}

export function getProcessFromSections(sections: ServicePageSections): {
  eyebrow: string;
  headline: string;
  steps: { number: string; name: string; description: string }[];
} | null {
  if (!sections.enabledSections.includes("process")) return null;
  const steps = sections.processSteps.filter(
    (step) => step.name.trim() && step.description.trim(),
  );
  if (steps.length === 0) return null;
  return {
    eyebrow: sections.processEyebrow || "How it works",
    headline:
      sections.processHeadline || "Our proven process for achieving success",
    steps,
  };
}

/** True when CMS marketing sections have enough content to replace a static page. */
export function hasRenderableMarketingSections(value: unknown): boolean {
  const sections = parseServicePageSections(value);
  if (!sections) return false;
  return Boolean(
    sections.aeoSummary.trim() ||
      sections.intro.trim() ||
      sections.features.some((item) => item.trim()) ||
      sections.offerings.some((item) => item.title.trim()) ||
      sections.whyReasons.some((item) => item.title.trim()) ||
      sections.textBlocks.some(isRenderableTextBlock) ||
      sections.faqs.some((item) => item.question.trim()),
  );
}

/** Alias for CMS pages that reuse the same section model. */
export type MarketingPageSections = ServicePageSections;
export const marketingPageSectionsSchema = servicePageSectionsSchema;
export const emptyMarketingPageSections = emptyServicePageSections;
export const parseMarketingPageSections = parseServicePageSections;
