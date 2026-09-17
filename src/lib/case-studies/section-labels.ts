/**
 * Per–case-study section copy for /work/[slug].
 * Empty admin values fall back to these defaults at render time so existing
 * pages keep their current headings until an editor overrides them.
 */

export const CASE_STUDY_LABEL_DEFAULTS = {
  backLink: "All work",
  visitSite: "Visit site",
  clientCardClientLabel: "Client",
  clientCardIndustryLabel: "Industry",
  clientCardServicesLabel: "Services provided",
  clientCardLocationLabel: "Location",
  clientCardPlatformLabel: "Platform / Stack",
  clientCardEngagementLabel: "Engagement",
  challengeEyebrow: "The challenge",
  challengeHeadline: "What stood in the way",
  approachEyebrow: "How we approached it",
  approachHeadline: "The plan before we shipped",
  solutionEyebrow: "What we did",
  solutionHeadline: "How we delivered",
  clientNoticedEyebrow: "What the client's team noticed",
  clientNoticedHeadline: "Inside the rollout",
  galleryEyebrow: "Gallery",
  galleryHeadline: "Inside the project",
  feedbackEyebrow: "Client feedback",
} as const;

export type CaseStudyLabelKey = keyof typeof CASE_STUDY_LABEL_DEFAULTS;

export type CaseStudySectionLabels = Partial<
  Record<CaseStudyLabelKey, string>
>;

const LABEL_KEYS = Object.keys(
  CASE_STUDY_LABEL_DEFAULTS,
) as CaseStudyLabelKey[];

export function emptySectionLabels(): CaseStudySectionLabels {
  return Object.fromEntries(LABEL_KEYS.map((key) => [key, ""])) as Record<
    CaseStudyLabelKey,
    string
  >;
}

export function parseSectionLabels(value: unknown): CaseStudySectionLabels {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptySectionLabels();
  }

  const record = value as Record<string, unknown>;
  const next = emptySectionLabels();

  for (const key of LABEL_KEYS) {
    const raw = record[key];
    if (typeof raw === "string") {
      next[key] = raw;
    }
  }

  return next;
}

/** Prefer stored override; otherwise use the historical template default. */
export function resolveSectionLabel(
  labels: CaseStudySectionLabels | null | undefined,
  key: CaseStudyLabelKey,
): string {
  const stored = labels?.[key];
  if (typeof stored === "string" && stored.trim()) {
    return stored.trim();
  }
  return CASE_STUDY_LABEL_DEFAULTS[key];
}

/** Strip blanks before persistence so new studies stay genuinely empty. */
export function compactSectionLabels(
  labels: CaseStudySectionLabels,
): CaseStudySectionLabels | null {
  const next: CaseStudySectionLabels = {};
  let hasAny = false;

  for (const key of LABEL_KEYS) {
    const value = labels[key]?.trim();
    if (value) {
      next[key] = value;
      hasAny = true;
    }
  }

  return hasAny ? next : null;
}
