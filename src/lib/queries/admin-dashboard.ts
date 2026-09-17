import { getDb } from "@/lib/db";
import { withDbFallback, withDbRetry } from "@/lib/db/retry";
import {
  auditLog,
  caseStudies,
  leads,
  media,
  pages,
  posts,
  services,
  testimonials,
  user,
} from "@/lib/db/schema";
import { and, count, desc, eq, gte, lt, or, sql } from "drizzle-orm";

function startOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - diff);
  return start;
}

const emptyStats = {
  publishedPosts: 0,
  publishedPages: 0,
  publishedCaseStudies: 0,
  leadsThisWeek: 0,
  draftPosts: 0,
  scheduledPosts: 0,
  publishedServices: 0,
  publishedTestimonials: 0,
};

export async function getDashboardStats() {
  return withDbFallback(async () => {
    const weekStart = startOfWeek();

    const [
      publishedPosts,
      publishedPages,
      publishedCaseStudies,
      leadsThisWeek,
      draftPosts,
      scheduledPosts,
      publishedServices,
      publishedTestimonials,
    ] = await Promise.all([
      getDb().select({ value: count() }).from(posts).where(eq(posts.status, "published")),
      getDb().select({ value: count() }).from(pages).where(eq(pages.status, "published")),
      getDb()
        .select({ value: count() })
        .from(caseStudies)
        .where(eq(caseStudies.status, "published")),
      getDb().select({ value: count() }).from(leads).where(gte(leads.createdAt, weekStart)),
      getDb().select({ value: count() }).from(posts).where(eq(posts.status, "draft")),
      getDb().select({ value: count() }).from(posts).where(eq(posts.status, "scheduled")),
      getDb()
        .select({ value: count() })
        .from(services)
        .where(eq(services.status, "published")),
      getDb()
        .select({ value: count() })
        .from(testimonials)
        .where(eq(testimonials.status, "published")),
    ]);

    return {
      publishedPosts: publishedPosts[0]?.value ?? 0,
      publishedPages: publishedPages[0]?.value ?? 0,
      publishedCaseStudies: publishedCaseStudies[0]?.value ?? 0,
      leadsThisWeek: leadsThisWeek[0]?.value ?? 0,
      draftPosts: draftPosts[0]?.value ?? 0,
      scheduledPosts: scheduledPosts[0]?.value ?? 0,
      publishedServices: publishedServices[0]?.value ?? 0,
      publishedTestimonials: publishedTestimonials[0]?.value ?? 0,
    };
  }, emptyStats);
}

export async function getRecentAuditActivity(limit = 12) {
  return withDbFallback(
    () =>
      withDbRetry(() =>
        getDb()
          .select({
            id: auditLog.id,
            userId: auditLog.userId,
            action: auditLog.action,
            entityType: auditLog.entityType,
            entityId: auditLog.entityId,
            meta: auditLog.meta,
            createdAt: auditLog.createdAt,
            userName: user.name,
            userEmail: user.email,
          })
          .from(auditLog)
          .leftJoin(user, eq(auditLog.userId, user.id))
          .orderBy(desc(auditLog.createdAt))
          .limit(limit),
      ),
    [],
  );
}

export async function getGlanceCounts() {
  const stats = await getDashboardStats();
  return [
    {
      label: "Posts",
      href: "/admin/posts",
      published: stats.publishedPosts,
      draft: stats.draftPosts,
      scheduled: stats.scheduledPosts,
    },
    {
      label: "Pages",
      href: "/admin/pages",
      published: stats.publishedPages,
      draft: null,
      scheduled: null,
    },
    {
      label: "Case studies",
      href: "/admin/case-studies",
      published: stats.publishedCaseStudies,
      draft: null,
      scheduled: null,
    },
    {
      label: "Services",
      href: "/admin/services",
      published: stats.publishedServices,
      draft: null,
      scheduled: null,
    },
    {
      label: "Testimonials",
      href: "/admin/testimonials",
      published: stats.publishedTestimonials,
      draft: null,
      scheduled: null,
    },
  ] as const;
}

export type NeedsAttentionItem = {
  label: string;
  count: number;
  href: string;
  detail: string;
};

const emptyNeedsAttention: NeedsAttentionItem[] = [];

/** Lightweight CMS hygiene signals for the admin dashboard. */
export async function getNeedsAttention(staleDraftDays = 14) {
  return withDbFallback(async () => {
    const staleCutoff = new Date();
    staleCutoff.setDate(staleCutoff.getDate() - staleDraftDays);
    const recentCutoff = new Date();
    recentCutoff.setDate(recentCutoff.getDate() - 7);

    const emptySeo = or(
      sql`coalesce(trim(${posts.metaTitle}), '') = ''`,
      sql`coalesce(trim(${posts.metaDescription}), '') = ''`,
    );
    const emptyPageSeo = or(
      sql`coalesce(trim(${pages.metaTitle}), '') = ''`,
      sql`coalesce(trim(${pages.metaDescription}), '') = ''`,
    );

    const [
      staleDrafts,
      missingAlt,
      emptyPostSeo,
      emptyPageSeoCount,
      recentDraftEdits,
    ] = await Promise.all([
      getDb()
        .select({ value: count() })
        .from(posts)
        .where(
          and(
            eq(posts.status, "draft"),
            lt(posts.updatedAt, staleCutoff),
          ),
        ),
      getDb()
        .select({ value: count() })
        .from(media)
        .where(sql`coalesce(trim(${media.alt}), '') = ''`),
      getDb()
        .select({ value: count() })
        .from(posts)
        .where(and(eq(posts.status, "published"), emptySeo)),
      getDb()
        .select({ value: count() })
        .from(pages)
        .where(
          and(
            eq(pages.status, "published"),
            emptyPageSeo,
          ),
        ),
      getDb()
        .select({ value: count() })
        .from(posts)
        .where(
          and(
            eq(posts.status, "draft"),
            gte(posts.updatedAt, recentCutoff),
          ),
        ),
    ]);

    const items: NeedsAttentionItem[] = [
      {
        label: "Stale drafts",
        count: staleDrafts[0]?.value ?? 0,
        href: "/admin/posts",
        detail: `Draft posts not updated in ${staleDraftDays}+ days`,
      },
      {
        label: "Recent draft edits",
        count: recentDraftEdits[0]?.value ?? 0,
        href: "/admin/posts",
        detail: "Unpublished posts edited in the last 7 days",
      },
      {
        label: "Missing alt text",
        count: missingAlt[0]?.value ?? 0,
        href: "/admin/media",
        detail: "Media files with empty alt",
      },
      {
        label: "Empty post SEO",
        count: emptyPostSeo[0]?.value ?? 0,
        href: "/admin/posts",
        detail: "Published posts missing title or description",
      },
      {
        label: "Empty page SEO",
        count: emptyPageSeoCount[0]?.value ?? 0,
        href: "/admin/pages",
        detail: "Published pages missing title or description",
      },
    ];

    return items.filter((item) => item.count > 0);
  }, emptyNeedsAttention);
}
