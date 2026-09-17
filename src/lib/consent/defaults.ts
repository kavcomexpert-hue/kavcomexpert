export type ConsentConfig = {
  enabled: boolean;
  bannerText: string;
  acceptLabel: string;
  declineLabel: string;
  policyLinkLabel: string;
  policyLinkHref: string;
  position: "bottom-bar" | "bottom-left";
  reshowAfterDays: number;
};

export const DEFAULT_CONSENT: ConsentConfig = {
  enabled: true,
  bannerText: "We use cookies for analytics.",
  acceptLabel: "Accept",
  declineLabel: "Decline",
  policyLinkLabel: "Privacy policy",
  policyLinkHref: "/privacy-policy",
  position: "bottom-bar",
  reshowAfterDays: 365,
};

export function consentFromSettings(row: {
  consentEnabled?: boolean | null;
  consentBannerText?: string | null;
  consentAcceptLabel?: string | null;
  consentDeclineLabel?: string | null;
  consentPolicyLinkLabel?: string | null;
  consentPolicyLinkHref?: string | null;
  consentPosition?: string | null;
  consentReshowAfterDays?: number | null;
} | null): ConsentConfig {
  if (!row) return DEFAULT_CONSENT;
  const position =
    row.consentPosition === "bottom-left" ? "bottom-left" : "bottom-bar";
  return {
    enabled: row.consentEnabled ?? true,
    bannerText: row.consentBannerText?.trim() || DEFAULT_CONSENT.bannerText,
    acceptLabel: row.consentAcceptLabel?.trim() || DEFAULT_CONSENT.acceptLabel,
    declineLabel:
      row.consentDeclineLabel?.trim() || DEFAULT_CONSENT.declineLabel,
    policyLinkLabel:
      row.consentPolicyLinkLabel?.trim() || DEFAULT_CONSENT.policyLinkLabel,
    policyLinkHref:
      row.consentPolicyLinkHref?.trim() || DEFAULT_CONSENT.policyLinkHref,
    position,
    reshowAfterDays:
      typeof row.consentReshowAfterDays === "number" &&
      row.consentReshowAfterDays > 0
        ? row.consentReshowAfterDays
        : DEFAULT_CONSENT.reshowAfterDays,
  };
}
