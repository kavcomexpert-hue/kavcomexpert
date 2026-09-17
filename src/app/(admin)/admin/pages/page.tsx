import { requirePageRoles } from "@/lib/admin/session";
import { PageHeader } from "@/components/admin/page-header";
import { PagesTable } from "@/components/admin/pages-table";
import { SystemPagesSyncControls } from "@/components/admin/system-pages-sync";
import {
  getAdminPageAuthors,
  getAdminPages,
} from "@/lib/queries/admin-pages";
import { ensureSystemPages } from "@/lib/pages/sync-system-pages";
import Link from "next/link";

export default async function AdminPagesPage() {
  await requirePageRoles(["admin", "editor"]);

  let autoSyncResult: { created: number; published: number } | null = null;
  try {
    const result = await ensureSystemPages();
    if (result.created > 0 || result.published > 0) {
      autoSyncResult = result;
    }
  } catch {
    // DB may be unavailable during build; list still attempts below.
  }

  const [pages, authors] = await Promise.all([
    getAdminPages(),
    getAdminPageAuthors(),
  ]);

  return (
    <>
      <PageHeader
        title="Pages"
        action={
          <Link
            href="/admin/pages/new"
            className="inline-flex h-11 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            New page
          </Link>
        }
      />
      <SystemPagesSyncControls autoSyncResult={autoSyncResult} />
      <PagesTable pages={pages} authors={authors} />
    </>
  );
}
