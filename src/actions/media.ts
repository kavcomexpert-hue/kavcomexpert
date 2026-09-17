"use server";

import { beginAdminMutation, RateLimitedError } from "@/lib/admin/mutation-guard";
import { canUseMedia } from "@/lib/authz";
import { requireSession } from "@/lib/admin/session";
import { getDb } from "@/lib/db";
import {
  caseStudies,
  contentBlocks,
  media,
  pages,
  landingPages,
  popups,
  posts,
  services,
  siteSettings,
  testimonials,
  workGallery,
} from "@/lib/db/schema";
import { deleteFromR2, getR2KeyFromUrl } from "@/lib/r2";
import { desc, eq, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type MediaActionResult =
  | {
      success: true;
      id: string;
      url: string;
      width: number | null;
      height: number | null;
      alt: string;
      mimeType: string | null;
      filename: string | null;
    }
  | { success: false; error: string };

type MediaListItem = {
  id: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  filename: string | null;
  sizeBytes: number | null;
  folder: string | null;
  createdAt: Date | null;
};

const updateAltSchema = z.object({
  id: z.string().uuid(),
  alt: z.string().trim().min(1, "Alt text is required").max(500),
});

export async function listMedia(): Promise<MediaListItem[]> {
  await requireSession();

  return getDb()
    .select({
      id: media.id,
      url: media.url,
      alt: media.alt,
      width: media.width,
      height: media.height,
      mimeType: media.mimeType,
      filename: media.filename,
      sizeBytes: media.sizeBytes,
      folder: media.folder,
      createdAt: media.createdAt,
    })
    .from(media)
    .orderBy(desc(media.createdAt));
}

export async function updateMediaAlt(
  id: string,
  alt: string,
): Promise<MediaActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canUseMedia(session)) {
      return { success: false, error: "Forbidden" };
    }
    const parsed = updateAltSchema.safeParse({ id, alt });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const [existing] = await getDb()
      .select()
      .from(media)
      .where(eq(media.id, parsed.data.id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Media not found" };
    }

    const [updated] = await getDb()
      .update(media)
      .set({ alt: parsed.data.alt })
      .where(eq(media.id, parsed.data.id))
      .returning({
        id: media.id,
        url: media.url,
        width: media.width,
        height: media.height,
        alt: media.alt,
        mimeType: media.mimeType,
        filename: media.filename,
      });

    revalidatePath("/admin/media");

    await audit({
      action: "update",
      entityType: "media",
      entityId: updated.id,
      meta: { alt: updated.alt },
    });

    return {
      success: true,
      id: updated.id,
      url: updated.url,
      width: updated.width,
      height: updated.height,
      alt: updated.alt,
      mimeType: updated.mimeType,
      filename: updated.filename,
    };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }

    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to update alt text" };
  }
}

export type MediaUsage = {
  type: string;
  id: string;
  title: string;
  href: string | null;
};

function containsUrl(column: unknown, url: string) {
  return sql`strpos(coalesce(${column}::text, ''), ${url}) > 0`;
}

/**
 * Scan CMS tables for rows that store this media URL (simple string match).
 */
export async function findMediaUsages(
  url: string,
): Promise<
  { success: true; usages: MediaUsage[] } | { success: false; error: string }
> {
  try {
    await requireSession();
    const trimmed = url.trim();
    if (!trimmed || trimmed.length < 8) {
      return { success: false, error: "Invalid media URL" };
    }

    const usages: MediaUsage[] = [];

    const [
      postHits,
      pageHits,
      landingHits,
      serviceHits,
      caseHits,
      testimonialHits,
      settingsHits,
      blockHits,
      popupHits,
      galleryHits,
    ] = await Promise.all([
      getDb()
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
        })
        .from(posts)
        .where(
          or(
            containsUrl(posts.coverImage, trimmed),
            containsUrl(posts.ogImage, trimmed),
            containsUrl(posts.content, trimmed),
          ),
        )
        .limit(40),
      getDb()
        .select({
          id: pages.id,
          title: pages.title,
          slug: pages.slug,
        })
        .from(pages)
        .where(
          or(
            containsUrl(pages.ogImage, trimmed),
            containsUrl(pages.content, trimmed),
            containsUrl(pages.pageSections, trimmed),
            containsUrl(pages.heroVisual, trimmed),
          ),
        )
        .limit(40),
      getDb()
        .select({
          id: landingPages.id,
          title: landingPages.title,
          slug: landingPages.slug,
        })
        .from(landingPages)
        .where(
          or(
            containsUrl(landingPages.ogImage, trimmed),
            containsUrl(landingPages.content, trimmed),
            containsUrl(landingPages.pageSections, trimmed),
            containsUrl(landingPages.heroVisual, trimmed),
          ),
        )
        .limit(40),
      getDb()
        .select({
          id: services.id,
          name: services.name,
          slug: services.slug,
        })
        .from(services)
        .where(
          or(
            containsUrl(services.ogImage, trimmed),
            containsUrl(services.icon, trimmed),
            containsUrl(services.body, trimmed),
            containsUrl(services.pageSections, trimmed),
            containsUrl(services.heroVisual, trimmed),
          ),
        )
        .limit(40),
      getDb()
        .select({
          id: caseStudies.id,
          client: caseStudies.client,
          slug: caseStudies.slug,
        })
        .from(caseStudies)
        .where(
          or(
            containsUrl(caseStudies.ogImage, trimmed),
            containsUrl(caseStudies.approach, trimmed),
            containsUrl(caseStudies.solution, trimmed),
            containsUrl(caseStudies.gallery, trimmed),
            containsUrl(caseStudies.challengeMedia, trimmed),
            containsUrl(caseStudies.approachMedia, trimmed),
            containsUrl(caseStudies.solutionMedia, trimmed),
            containsUrl(caseStudies.clientNoticedMedia, trimmed),
          ),
        )
        .limit(40),
      getDb()
        .select({
          id: testimonials.id,
          clientName: testimonials.clientName,
        })
        .from(testimonials)
        .where(
          or(
            containsUrl(testimonials.headshot, trimmed),
            containsUrl(testimonials.videoUrl, trimmed),
          ),
        )
        .limit(40),
      getDb()
        .select({
          id: siteSettings.id,
          logoUrl: siteSettings.logoUrl,
          defaultOgImage: siteSettings.defaultOgImage,
        })
        .from(siteSettings)
        .where(
          or(
            containsUrl(siteSettings.logoUrl, trimmed),
            containsUrl(siteSettings.defaultOgImage, trimmed),
          ),
        )
        .limit(5),
      getDb()
        .select({
          id: contentBlocks.id,
          label: contentBlocks.label,
          key: contentBlocks.key,
        })
        .from(contentBlocks)
        .where(containsUrl(contentBlocks.value, trimmed))
        .limit(40),
      getDb()
        .select({
          id: popups.id,
          name: popups.name,
        })
        .from(popups)
        .where(containsUrl(popups.content, trimmed))
        .limit(40),
      getDb()
        .select({
          id: workGallery.id,
          alt: workGallery.alt,
        })
        .from(workGallery)
        .where(containsUrl(workGallery.url, trimmed))
        .limit(40),
    ]);

    for (const row of postHits) {
      usages.push({
        type: "Post",
        id: row.id,
        title: row.title,
        href: `/admin/posts/${row.id}`,
      });
    }
    for (const row of pageHits) {
      usages.push({
        type: "Page",
        id: row.id,
        title: row.title,
        href: `/admin/pages/${row.id}`,
      });
    }
    for (const row of landingHits) {
      usages.push({
        type: "Landing page",
        id: row.id,
        title: row.title,
        href: `/admin/landing-pages/${row.id}`,
      });
    }
    for (const row of serviceHits) {
      usages.push({
        type: "Service",
        id: row.id,
        title: row.name,
        href: `/admin/services/${row.id}`,
      });
    }
    for (const row of caseHits) {
      usages.push({
        type: "Case study",
        id: row.id,
        title: row.client,
        href: `/admin/case-studies/${row.id}`,
      });
    }
    for (const row of testimonialHits) {
      usages.push({
        type: "Testimonial",
        id: row.id,
        title: row.clientName,
        href: `/admin/testimonials/${row.id}`,
      });
    }
    for (const row of settingsHits) {
      usages.push({
        type: "Settings",
        id: row.id,
        title: "Site settings",
        href: "/admin/settings",
      });
    }
    for (const row of blockHits) {
      usages.push({
        type: "Content block",
        id: row.id,
        title: row.label || row.key,
        href: "/admin/settings",
      });
    }
    for (const row of popupHits) {
      usages.push({
        type: "Popup",
        id: row.id,
        title: row.name,
        href: `/admin/popups/${row.id}`,
      });
    }
    for (const row of galleryHits) {
      usages.push({
        type: "Work gallery",
        id: row.id,
        title: row.alt?.trim() || "Gallery image",
        href: "/admin/work-gallery",
      });
    }

    return { success: true, usages };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to find media usages" };
  }
}

export async function deleteMedia(id: string): Promise<MediaActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canUseMedia(session)) {
      return { success: false, error: "Forbidden" };
    }

    const [existing] = await getDb()
      .select()
      .from(media)
      .where(eq(media.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Media not found" };
    }

    const key = getR2KeyFromUrl(existing.url);

    if (key) {
      await deleteFromR2(key);
    }

    await getDb().delete(media).where(eq(media.id, id));

    revalidatePath("/admin/media");

    await audit({
      action: "delete",
      entityType: "media",
      entityId: existing.id,
      meta: { url: existing.url },
    });

    return {
      success: true,
      id: existing.id,
      url: existing.url,
      width: existing.width,
      height: existing.height,
      alt: existing.alt,
      mimeType: existing.mimeType,
      filename: existing.filename,
    };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }

    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to delete media" };
  }
}
