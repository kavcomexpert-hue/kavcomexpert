import { requirePageRoles } from "@/lib/admin/session";
import { PageHeader } from "@/components/admin/page-header";
import { ServicesTable } from "@/components/admin/services-table";
import { getAdminServices } from "@/lib/queries/admin-content";
import { getDb } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { ensureSystemPages } from "@/lib/pages/sync-system-pages";
import { ensureServicesFromStaticPages } from "@/lib/services/sync-from-static";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function AdminServicesPage() {
  await requirePageRoles(["admin", "editor"]);
  try {
    // Auto-seed missing system pages on empty installs; pages admin has
    // the explicit Sync UI + banner when something was created.
    await ensureSystemPages();
    await ensureServicesFromStaticPages();
  } catch {
    // Neon wake blips should not block the services list.
  }

  const [items, servicesIndexRows] = await Promise.all([
    getAdminServices(),
    getDb()
      .select({ id: pages.id })
      .from(pages)
      .where(eq(pages.slug, "services"))
      .limit(1),
  ]);
  const servicesIndexPage = servicesIndexRows[0] ?? null;

  return (
    <>
      <PageHeader
        title="Services"
        description="All public service pages. Edit content here to update /services/[slug]."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {servicesIndexPage ? (
              <Link
                href={`/admin/pages/${servicesIndexPage.id}`}
                className="inline-flex h-9 items-center justify-center rounded-default border border-border bg-background px-4 text-sm font-medium text-foreground"
              >
                Edit index page
              </Link>
            ) : null}
            <Link
              href="/admin/services/new"
              className="inline-flex h-9 items-center justify-center bg-accent px-4 text-sm font-medium text-surface"
            >
              New service
            </Link>
          </div>
        }
      />
      <ServicesTable items={items} />
    </>
  );
}
