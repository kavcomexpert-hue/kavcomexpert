"use server";

import { beginAdminMutation } from "@/lib/admin/mutation-guard";
import { requireRole } from "@/lib/authz";
import { getDb } from "@/lib/db";
import {
  caseStudies,
  landingPages,
  pages,
  posts,
  services,
  siteSettings,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

type ActionResult = { success: true } | { success: false; error: string };

const contentSourceSchema = z.enum([
  "post",
  "page",
  "landing-page",
  "service",
  "case-study",
]);

function revalidateSitemap() {
  revalidateTag("sitemap", "max");
  revalidateTag("posts", "max");
  revalidateTag("pages", "max");
  revalidateTag("landing-pages", "max");
  revalidateTag("services", "max");
  revalidateTag("case-studies", "max");
  revalidateTag("site-settings", "max");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/seo");
}

export async function setContentSitemapInclude(input: {
  source: z.infer<typeof contentSourceSchema>;
  id: string;
  include: boolean;
}): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireRole(session, ["admin", "editor"]);

    const parsed = z
      .object({
        source: contentSourceSchema,
        id: z.string().uuid(),
        include: z.boolean(),
      })
      .parse(input);

    const values = { sitemapInclude: parsed.include };

    if (parsed.source === "post") {
      await getDb().update(posts).set(values).where(eq(posts.id, parsed.id));
    } else if (parsed.source === "page") {
      await getDb().update(pages).set(values).where(eq(pages.id, parsed.id));
    } else if (parsed.source === "landing-page") {
      await getDb()
        .update(landingPages)
        .set(values)
        .where(eq(landingPages.id, parsed.id));
    } else if (parsed.source === "service") {
      await getDb().update(services).set(values).where(eq(services.id, parsed.id));
    } else {
      await getDb()
        .update(caseStudies)
        .set(values)
        .where(eq(caseStudies.id, parsed.id));
    }

    revalidateSitemap();

    await audit({
      action: "seo_sitemap_include",
      entityType: parsed.source,
      entityId: parsed.id,
      meta: { include: parsed.include },
    });

    return { success: true };
  } catch (error) {
    console.error("[setContentSitemapInclude]", error);
    return { success: false, error: "Failed to update sitemap include" };
  }
}

export async function setContentSitemapPriority(input: {
  source: z.infer<typeof contentSourceSchema>;
  id: string;
  priority: number;
}): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireRole(session, ["admin", "editor"]);

    const parsed = z
      .object({
        source: contentSourceSchema,
        id: z.string().uuid(),
        priority: z.number().min(0).max(1),
      })
      .parse(input);

    const values = { sitemapPriority: String(parsed.priority) };

    if (parsed.source === "post") {
      await getDb().update(posts).set(values).where(eq(posts.id, parsed.id));
    } else if (parsed.source === "page") {
      await getDb().update(pages).set(values).where(eq(pages.id, parsed.id));
    } else if (parsed.source === "landing-page") {
      await getDb()
        .update(landingPages)
        .set(values)
        .where(eq(landingPages.id, parsed.id));
    } else if (parsed.source === "service") {
      await getDb().update(services).set(values).where(eq(services.id, parsed.id));
    } else {
      await getDb()
        .update(caseStudies)
        .set(values)
        .where(eq(caseStudies.id, parsed.id));
    }

    revalidateSitemap();

    await audit({
      action: "seo_sitemap_priority",
      entityType: parsed.source,
      entityId: parsed.id,
      meta: { priority: parsed.priority },
    });

    return { success: true };
  } catch (error) {
    console.error("[setContentSitemapPriority]", error);
    return { success: false, error: "Failed to update sitemap priority" };
  }
}

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "/";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (withSlash.length > 1 && withSlash.endsWith("/")) {
    return withSlash.slice(0, -1);
  }
  return withSlash;
}

export async function setStaticPathSitemapExcluded(input: {
  path: string;
  excluded: boolean;
}): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireRole(session, ["admin"]);

    const parsed = z
      .object({
        path: z.string().min(1),
        excluded: z.boolean(),
      })
      .parse(input);

    const path = normalizePath(parsed.path);
    const [settings] = await getDb().select().from(siteSettings).limit(1);

    if (!settings) {
      return { success: false, error: "Site settings not found" };
    }

    const current = Array.isArray(settings.sitemapExcludedPaths)
      ? (settings.sitemapExcludedPaths as string[]).map(normalizePath)
      : [];

    const next = parsed.excluded
      ? current.includes(path)
        ? current
        : [...current, path]
      : current.filter((entry) => entry !== path);

    await getDb()
      .update(siteSettings)
      .set({ sitemapExcludedPaths: next })
      .where(eq(siteSettings.id, settings.id));

    revalidateSitemap();

    await audit({
      action: "seo_sitemap_excluded_path",
      entityType: "site_settings",
      entityId: settings.id,
      meta: { path, excluded: parsed.excluded },
    });

    return { success: true };
  } catch (error) {
    console.error("[setStaticPathSitemapExcluded]", error);
    return { success: false, error: "Failed to update excluded paths" };
  }
}

export async function saveSitemapExcludedPaths(
  paths: string[],
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireRole(session, ["admin"]);

    const parsed = z.array(z.string()).parse(paths);
    const normalized = [
      ...new Set(parsed.map(normalizePath).filter(Boolean)),
    ];

    const [settings] = await getDb().select().from(siteSettings).limit(1);

    if (!settings) {
      return { success: false, error: "Site settings not found" };
    }

    await getDb()
      .update(siteSettings)
      .set({ sitemapExcludedPaths: normalized })
      .where(eq(siteSettings.id, settings.id));

    revalidateSitemap();

    await audit({
      action: "seo_sitemap_excluded_paths",
      entityType: "site_settings",
      entityId: settings.id,
      meta: { count: normalized.length },
    });

    return { success: true };
  } catch (error) {
    console.error("[saveSitemapExcludedPaths]", error);
    return { success: false, error: "Failed to save excluded paths" };
  }
}
