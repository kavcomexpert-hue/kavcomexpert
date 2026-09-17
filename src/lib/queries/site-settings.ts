import { getDb } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import {
  consentFromSettings,
  DEFAULT_CONSENT,
  type ConsentConfig,
} from "@/lib/consent/defaults";
import { unstable_cache } from "next/cache";

export type SocialLinks = {
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  [key: string]: string | undefined;
};

export type SiteTheme = "light" | "dark" | "system";

export type SiteSettings = {
  organizationName: string;
  tagline: string | null;
  defaultOgImage: string | null;
  logoUrl: string | null;
  socialLinks: SocialLinks;
  announcementText: string | null;
  announcementEnabled: boolean;
  contactEmail: string | null;
  ga4Id: string | null;
  clarityId: string | null;
  indexNowKey: string | null;
  sitemapExcludedPaths: string[];
  consent: ConsentConfig;
  defaultTheme: SiteTheme;
  maintenanceTitle: string | null;
  maintenanceBody: string | null;
};

function normalizeTheme(raw: unknown): SiteTheme {
  return raw === "light" || raw === "system" ? raw : "dark";
}

const defaultSettings: SiteSettings = {
  organizationName: "Kavcom Expert",
  tagline: "From Vision To Virtual - We Build It All",
  defaultOgImage: null,
  logoUrl: null,
  socialLinks: {},
  announcementText: null,
  announcementEnabled: false,
  contactEmail: null,
  ga4Id: null,
  clarityId: null,
  indexNowKey: null,
  sitemapExcludedPaths: [],
  consent: DEFAULT_CONSENT,
  defaultTheme: "dark",
  maintenanceTitle: null,
  maintenanceBody: null,
};

function mapLabelToKey(label: string): keyof SocialLinks | null {
  const normalized = label.trim().toLowerCase();
  if (normalized.includes("linkedin")) return "linkedin";
  if (normalized.includes("facebook") || normalized === "fb") return "facebook";
  if (normalized.includes("instagram") || normalized === "ig") return "instagram";
  return null;
}

export function normalizeSocialLinks(raw: unknown): SocialLinks {
  const result: SocialLinks = {};

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (
        !item ||
        typeof item !== "object" ||
        !("label" in item) ||
        !("url" in item)
      ) {
        continue;
      }

      const label = typeof item.label === "string" ? item.label : "";
      const url = typeof item.url === "string" ? item.url : "";
      if (!label || !url) continue;

      const key = mapLabelToKey(label);
      if (key) result[key] = url;
    }
    return result;
  }

  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    for (const [key, value] of Object.entries(record)) {
      if (typeof value !== "string" || !value.trim()) continue;
      const mapped = mapLabelToKey(key) ?? (key as keyof SocialLinks);
      if (
        mapped === "linkedin" ||
        mapped === "facebook" ||
        mapped === "instagram"
      ) {
        result[mapped] = value.trim();
      }
    }
  }

  return result;
}

async function fetchSiteSettings(): Promise<SiteSettings> {
  const [settings] = await getDb().select().from(siteSettings).limit(1);

  if (!settings) {
    return defaultSettings;
  }

  return {
    organizationName:
      settings.organizationName ?? defaultSettings.organizationName,
    tagline: settings.tagline ?? defaultSettings.tagline,
    defaultOgImage: settings.defaultOgImage,
    logoUrl: settings.logoUrl ?? null,
    socialLinks: normalizeSocialLinks(settings.socialLinks),
    announcementText: settings.announcementText,
    announcementEnabled: settings.announcementEnabled ?? false,
    contactEmail: settings.contactEmail ?? null,
    ga4Id: settings.ga4Id ?? null,
    clarityId: settings.clarityId ?? null,
    indexNowKey: settings.indexNowKey ?? null,
    sitemapExcludedPaths: Array.isArray(settings.sitemapExcludedPaths)
      ? (settings.sitemapExcludedPaths as string[])
      : [],
    consent: consentFromSettings(settings),
    defaultTheme: normalizeTheme(settings.defaultTheme),
    maintenanceTitle: settings.maintenanceTitle ?? null,
    maintenanceBody: settings.maintenanceBody ?? null,
  };
}

export function getSiteSettings() {
  return unstable_cache(
    async () => {
      try {
        return await fetchSiteSettings();
      } catch (error) {
        console.warn("[site-settings] fetch failed; using defaults.", error);
        return defaultSettings;
      }
    },
    ["site-settings-v3"],
    { tags: ["site-settings"] },
  )();
}
