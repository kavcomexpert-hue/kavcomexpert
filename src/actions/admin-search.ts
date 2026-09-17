"use server";

import { requireSession } from "@/lib/admin/session";
import { getDb } from "@/lib/db";
import {
  caseStudies,
  leads,
  media,
  pages,
  posts,
  services,
  testimonials,
} from "@/lib/db/schema";
import { and, eq, ilike, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { servicePath } from "@/lib/paths";

export type AdminSearchGroup = {
  type:
    | "posts"
    | "pages"
    | "services"
    | "caseStudies"
    | "testimonials"
    | "media"
    | "leads";
  label: string;
  items: { id: string; title: string; href: string; meta?: string }[];
};

export type AdminSearchResult =
  | { success: true; groups: AdminSearchGroup[] }
  | { success: false; error: string };

const querySchema = z.string().trim().min(1).max(120);

function pattern(q: string) {
  return `%${q.replace(/[%_]/g, "\\$&")}%`;
}

export async function adminGlobalSearch(
  rawQuery: string,
  options?: { publishedOnly?: boolean },
): Promise<AdminSearchResult> {
  try {
    await requireSession();
    const q = querySchema.parse(rawQuery);
    const like = pattern(q);
    const db = getDb();
    const publishedOnly = options?.publishedOnly === true;

    const [
      postRows,
      pageRows,
      serviceRows,
      caseRows,
      testimonialRows,
      mediaRows,
      leadRows,
    ] = await Promise.all([
      db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
        })
        .from(posts)
        .where(
          publishedOnly
            ? and(
                eq(posts.status, "published"),
                or(ilike(posts.title, like), ilike(posts.slug, like)),
              )
            : or(ilike(posts.title, like), ilike(posts.slug, like)),
        )
        .limit(8),
      db
        .select({
          id: pages.id,
          title: pages.title,
          slug: pages.slug,
          path: pages.path,
        })
        .from(pages)
        .where(
          publishedOnly
            ? and(
                eq(pages.status, "published"),
                or(
                  ilike(pages.title, like),
                  ilike(pages.slug, like),
                  ilike(pages.path, like),
                ),
              )
            : or(
                ilike(pages.title, like),
                ilike(pages.slug, like),
                ilike(pages.path, like),
              ),
        )
        .limit(8),
      db
        .select({
          id: services.id,
          name: services.name,
          slug: services.slug,
          parentId: services.parentId,
        })
        .from(services)
        .where(
          publishedOnly
            ? and(
                eq(services.status, "published"),
                or(ilike(services.name, like), ilike(services.slug, like)),
              )
            : or(ilike(services.name, like), ilike(services.slug, like)),
        )
        .limit(8),
      db
        .select({
          id: caseStudies.id,
          client: caseStudies.client,
          slug: caseStudies.slug,
        })
        .from(caseStudies)
        .where(
          publishedOnly
            ? and(
                eq(caseStudies.status, "published"),
                or(
                  ilike(caseStudies.client, like),
                  ilike(caseStudies.slug, like),
                ),
              )
            : or(
                ilike(caseStudies.client, like),
                ilike(caseStudies.slug, like),
              ),
        )
        .limit(8),
      publishedOnly
        ? Promise.resolve([])
        : db
            .select({
              id: testimonials.id,
              clientName: testimonials.clientName,
              company: testimonials.company,
            })
            .from(testimonials)
            .where(
              or(
                ilike(testimonials.clientName, like),
                ilike(testimonials.company, like),
              ),
            )
            .limit(8),
      publishedOnly
        ? Promise.resolve([])
        : db
            .select({
              id: media.id,
              alt: media.alt,
              filename: media.filename,
            })
            .from(media)
            .where(
              or(
                ilike(media.alt, like),
                ilike(media.filename, like),
                ilike(media.url, like),
              ),
            )
            .limit(8),
      publishedOnly
        ? Promise.resolve([])
        : db
            .select({
              id: leads.id,
              email: leads.email,
              name: leads.name,
            })
            .from(leads)
            .where(or(ilike(leads.email, like), ilike(leads.name, like)))
            .limit(8),
    ]);

    const groups: AdminSearchGroup[] = [];

    if (postRows.length > 0) {
      groups.push({
        type: "posts",
        label: "Posts",
        items: postRows.map((row) => ({
          id: row.id,
          title: row.title,
          href: `/admin/posts/${row.id}`,
          meta: row.slug,
        })),
      });
    }

    if (pageRows.length > 0) {
      groups.push({
        type: "pages",
        label: "Pages",
        items: pageRows.map((row) => ({
          id: row.id,
          title: row.title,
          href: `/admin/pages/${row.id}`,
          meta: row.path || `/${row.slug}`,
        })),
      });
    }

    if (serviceRows.length > 0) {
      const parentIds = [
        ...new Set(
          serviceRows
            .map((row) => row.parentId)
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      const parentSlugById = new Map<string, string>();
      if (parentIds.length > 0) {
        const parentRows = await db
          .select({ id: services.id, slug: services.slug })
          .from(services)
          .where(inArray(services.id, parentIds));
        for (const parent of parentRows) {
          parentSlugById.set(parent.id, parent.slug);
        }
      }

      groups.push({
        type: "services",
        label: "Services",
        items: serviceRows.map((row) => {
          const parentSlug = row.parentId
            ? parentSlugById.get(row.parentId) ?? null
            : null;
          // Nested path without /services/ prefix so publicPathFromAdminHref
          // can rebuild via servicePath; top-level is bare slug.
          const meta = servicePath({ slug: row.slug, parentSlug }).replace(
            /^\/services\//,
            "",
          );
          return {
            id: row.id,
            title: row.name,
            href: `/admin/services/${row.id}`,
            meta,
          };
        }),
      });
    }

    if (caseRows.length > 0) {
      groups.push({
        type: "caseStudies",
        label: "Case studies",
        items: caseRows.map((row) => ({
          id: row.id,
          title: row.client,
          href: `/admin/case-studies/${row.id}`,
          meta: row.slug,
        })),
      });
    }

    if (testimonialRows.length > 0) {
      groups.push({
        type: "testimonials",
        label: "Testimonials",
        items: testimonialRows.map((row) => ({
          id: row.id,
          title: row.clientName,
          href: `/admin/testimonials/${row.id}`,
          meta: row.company ?? undefined,
        })),
      });
    }

    if (mediaRows.length > 0) {
      groups.push({
        type: "media",
        label: "Media",
        items: mediaRows.map((row) => ({
          id: row.id,
          title: row.alt || row.filename || "Untitled media",
          href: `/admin/media?q=${encodeURIComponent(q)}`,
          meta: row.filename ?? undefined,
        })),
      });
    }

    if (leadRows.length > 0) {
      groups.push({
        type: "leads",
        label: "Leads",
        items: leadRows.map((row) => ({
          id: row.id,
          title: row.email,
          href: `/admin/leads`,
          meta: row.name ?? undefined,
        })),
      });
    }

    return { success: true, groups };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: true, groups: [] };
    }
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Search failed" };
  }
}
