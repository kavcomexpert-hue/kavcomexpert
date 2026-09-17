import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdminPageSession } from "@/lib/admin/session";
import { DEFAULT_CONSENT } from "@/lib/consent/defaults";
import { withDbFallback } from "@/lib/db/retry";
import { getSiteSettings } from "@/lib/queries/admin-content";
import { getAdminContentBlocks } from "@/lib/queries/content-blocks";
import {
  getAdminMenuLinkOptions,
  type MenuLinkOption,
} from "@/lib/queries/menus";

function parseSocialLinks(value: unknown): { label: string; url: string }[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is { label: string; url: string } =>
        typeof item === "object" &&
        item !== null &&
        "label" in item &&
        "url" in item,
    );
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, string>).map(
      ([label, url]) => ({ label, url }),
    );
  }

  return [];
}

function parseExcludedPaths(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export default async function AdminSettingsPage() {
  await requireAdminPageSession();

  const emptyLinks: MenuLinkOption[] = [];
  const [settings, contentBlockRows, linkOptions] = await Promise.all([
    getSiteSettings(),
    getAdminContentBlocks(),
    withDbFallback(() => getAdminMenuLinkOptions(), emptyLinks),
  ]);

  const contentBlocks = contentBlockRows.map((row) => ({
    key: row.key,
    label: row.label,
    type: row.type,
    value: row.value,
  }));

  return (
    <SettingsForm
      contentBlocks={contentBlocks}
      linkOptions={linkOptions}
      initialData={{
        id: settings?.id,
        organizationName: settings?.organizationName ?? "",
        tagline: settings?.tagline ?? "",
        contactEmail: settings?.contactEmail ?? "",
        defaultOgImage: settings?.defaultOgImage ?? "",
        logoUrl: settings?.logoUrl ?? "",
        socialLinks: parseSocialLinks(settings?.socialLinks),
        announcementText: settings?.announcementText ?? "",
        announcementEnabled: settings?.announcementEnabled ?? false,
        ga4Id: settings?.ga4Id ?? "",
        clarityId: settings?.clarityId ?? "",
        indexNowKey: settings?.indexNowKey ?? "",
        sitemapExcludedPaths: parseExcludedPaths(settings?.sitemapExcludedPaths),
        consentEnabled: settings?.consentEnabled ?? true,
        consentBannerText:
          settings?.consentBannerText ?? DEFAULT_CONSENT.bannerText,
        consentAcceptLabel:
          settings?.consentAcceptLabel ?? DEFAULT_CONSENT.acceptLabel,
        consentDeclineLabel:
          settings?.consentDeclineLabel ?? DEFAULT_CONSENT.declineLabel,
        consentPolicyLinkLabel:
          settings?.consentPolicyLinkLabel ?? DEFAULT_CONSENT.policyLinkLabel,
        consentPolicyLinkHref:
          settings?.consentPolicyLinkHref ?? DEFAULT_CONSENT.policyLinkHref,
        consentPosition:
          settings?.consentPosition === "bottom-left"
            ? "bottom-left"
            : "bottom-bar",
        consentReshowAfterDays:
          settings?.consentReshowAfterDays ?? DEFAULT_CONSENT.reshowAfterDays,
        maintenanceMode: settings?.maintenanceMode ?? false,
        maintenanceTitle: settings?.maintenanceTitle ?? "",
        maintenanceBody: settings?.maintenanceBody ?? "",
        defaultTheme:
          settings?.defaultTheme === "light" ||
          settings?.defaultTheme === "system"
            ? settings.defaultTheme
            : "dark",
      }}
    />
  );
}
