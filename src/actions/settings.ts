"use server";

import { beginAdminMutation, RateLimitedError } from "@/lib/admin/mutation-guard";
import { requireRole } from "@/lib/authz";
import { getDb } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { clearMaintenanceCache } from "@/lib/maintenance/cache";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

const socialLinkSchema = z.object({
  label: z.string().trim().min(1),
  url: z.string().url(),
});

const settingsInputSchema = z.object({
  id: z.string().uuid().optional(),
  organizationName: z.string().optional(),
  tagline: z.string().optional(),
  defaultOgImage: z.string().optional(),
  socialLinks: z.array(socialLinkSchema).default([]),
  announcementText: z.string().optional(),
  announcementEnabled: z.boolean().default(false),
  contactEmail: z.string().optional(),
  ga4Id: z.string().optional(),
  clarityId: z.string().optional(),
  indexNowKey: z.string().optional(),
  sitemapExcludedPaths: z.array(z.string()).optional(),
  consentEnabled: z.boolean().default(true),
  consentBannerText: z.string().optional(),
  consentAcceptLabel: z.string().optional(),
  consentDeclineLabel: z.string().optional(),
  consentPolicyLinkLabel: z.string().optional(),
  consentPolicyLinkHref: z.string().optional(),
  consentPosition: z.enum(["bottom-bar", "bottom-left"]).default("bottom-bar"),
  consentReshowAfterDays: z.number().int().min(1).max(3650).default(365),
  maintenanceMode: z.boolean().default(false),
  maintenanceTitle: z.string().optional(),
  maintenanceBody: z.string().optional(),
  logoUrl: z.string().optional(),
  defaultTheme: z.enum(["light", "dark", "system"]).default("dark"),
});

type ActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

function revalidateSettings() {
  clearMaintenanceCache();
  revalidateTag("site-settings", "max");
  revalidateTag("sitemap", "max");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/seo");
  revalidatePath("/sitemap.xml");
}

export async function saveSiteSettings(
  input: z.input<typeof settingsInputSchema>,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireRole(session, ["admin"]);
    const parsed = settingsInputSchema.parse(input);

    const values = {
      organizationName: parsed.organizationName?.trim() || null,
      tagline: parsed.tagline?.trim() || null,
      defaultOgImage: parsed.defaultOgImage?.trim() || null,
      socialLinks: parsed.socialLinks,
      announcementText: parsed.announcementText?.trim() || null,
      announcementEnabled: parsed.announcementEnabled,
      contactEmail: parsed.contactEmail?.trim() || null,
      ga4Id: parsed.ga4Id?.trim() || null,
      clarityId: parsed.clarityId?.trim() || null,
      indexNowKey: parsed.indexNowKey?.trim() || null,
      sitemapExcludedPaths: parsed.sitemapExcludedPaths ?? null,
      consentEnabled: parsed.consentEnabled,
      consentBannerText: parsed.consentBannerText?.trim() || null,
      consentAcceptLabel: parsed.consentAcceptLabel?.trim() || null,
      consentDeclineLabel: parsed.consentDeclineLabel?.trim() || null,
      consentPolicyLinkLabel: parsed.consentPolicyLinkLabel?.trim() || null,
      consentPolicyLinkHref: parsed.consentPolicyLinkHref?.trim() || null,
      consentPosition: parsed.consentPosition,
      consentReshowAfterDays: parsed.consentReshowAfterDays,
      maintenanceMode: parsed.maintenanceMode,
      maintenanceTitle: parsed.maintenanceTitle?.trim() || null,
      maintenanceBody: parsed.maintenanceBody?.trim() || null,
      logoUrl: parsed.logoUrl?.trim() || null,
      defaultTheme: parsed.defaultTheme,
    };

    if (parsed.id) {
      await getDb()
        .update(siteSettings)
        .set(values)
        .where(eq(siteSettings.id, parsed.id));

      revalidateSettings();

      await audit({
        action: "settings_change",
        entityType: "site_settings",
        entityId: parsed.id,
        meta: { maintenanceMode: parsed.maintenanceMode },
      });

      return { success: true, id: parsed.id };
    }

    const [created] = await getDb()
      .insert(siteSettings)
      .values(values)
      .returning({ id: siteSettings.id });

    revalidateSettings();

    await audit({
      action: "settings_change",
      entityType: "site_settings",
      entityId: created.id,
      meta: { maintenanceMode: parsed.maintenanceMode },
    });

    return { success: true, id: created.id };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }

    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to save settings" };
  }
}
