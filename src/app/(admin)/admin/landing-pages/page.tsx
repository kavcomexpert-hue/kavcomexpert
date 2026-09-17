import { requirePageRoles } from "@/lib/admin/session";
import { PageHeader } from "@/components/admin/page-header";
import { LandingPagesTable } from "@/components/admin/landing-pages-table";
import { ensureHoustonLandingPage } from "@/lib/landing-pages/ensure-houston";
import {
  getAdminLandingPageAuthors,
  getAdminLandingPages,
} from "@/lib/queries/admin-landing-pages";
import Link from "next/link";

export default async function AdminLandingPagesPage() {
  await requirePageRoles(["admin", "editor"]);

  try {
    await ensureHoustonLandingPage();
  } catch {
    // DB may be unavailable during build; list still attempts below.
  }

  const [pages, authors] = await Promise.all([
    getAdminLandingPages(),
    getAdminLandingPageAuthors(),
  ]);

  return (
    <>
      <PageHeader
        title="Landing pages"
        action={
          <Link
            href="/admin/landing-pages/new"
            className="inline-flex h-11 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            New landing page
          </Link>
        }
      />
      <LandingPagesTable pages={pages} authors={authors} />
    </>
  );
}
