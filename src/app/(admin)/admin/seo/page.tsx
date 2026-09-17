import { requirePageRoles } from "@/lib/admin/session";
import { PageHeader } from "@/components/admin/page-header";
import { SeoAdminClient } from "@/components/admin/seo-admin-client";
import { getDb } from "@/lib/db";
import { pages, posts } from "@/lib/db/schema";
import { getSeoAuditRows } from "@/lib/queries/admin-seo";
import { getSiteSettings } from "@/lib/queries/site-settings";
import { buildAeoPostRows } from "@/lib/seo/aeo-audit";
import { getSitemapAdminRows } from "@/lib/seo/sitemap-data";
import { summarizeSeoAudit } from "@/lib/seo/audit";
import { and, eq } from "drizzle-orm";

export default async function AdminSeoPage() {
  await requirePageRoles(["admin", "editor"]);

  const [rows, sitemapRows, settings, publishedPosts, homePage] =
    await Promise.all([
      getSeoAuditRows(),
      getSitemapAdminRows(),
      getSiteSettings(),
      getDb()
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          tldr: posts.tldr,
          keyTakeaways: posts.keyTakeaways,
          postFaqs: posts.postFaqs,
          updatedAt: posts.updatedAt,
        })
        .from(posts)
        .where(eq(posts.status, "published")),
      getDb()
        .select({ id: pages.id })
        .from(pages)
        .where(and(eq(pages.slug, "home"), eq(pages.status, "published")))
        .limit(1)
        .then((result) => result[0] ?? null),
    ]);
  const summary = summarizeSeoAudit(rows);
  const aeoRows = buildAeoPostRows(publishedPosts);

  return (
    <>
      <PageHeader
        title="SEO"
        description="Health audit, sitemap controls, and AEO readiness for answer engines."
      />
      <SeoAdminClient
        rows={rows}
        summary={summary}
        sitemapRows={sitemapRows}
        excludedPaths={settings.sitemapExcludedPaths}
        aeoRows={aeoRows}
        homepageEditorHref={
          homePage ? `/admin/pages/${homePage.id}` : "/admin/pages"
        }
      />
    </>
  );
}
