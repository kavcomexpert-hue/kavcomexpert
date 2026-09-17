import { requirePageRoles } from "@/lib/admin/session";
import { PageHeader } from "@/components/admin/page-header";
import { PopupsTable } from "@/components/admin/popups-table";
import { getAdminPopups } from "@/lib/queries/popups";
import Link from "next/link";

export default async function AdminPopupsPage() {
  await requirePageRoles(["admin", "editor"]);

  const items = await getAdminPopups();

  return (
    <>
      <PageHeader
        title="Popups"
        description="Exit-intent, timed, scroll, and slide-in offers. Only one popup shows per pageview, highest priority first."
        action={
          <Link
            href="/admin/popups/new"
            className="inline-flex h-11 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface"
          >
            New popup
          </Link>
        }
      />
      <PopupsTable
        items={items.map((item) => ({
          id: item.id,
          name: item.name,
          status: item.status,
          type: item.type,
          priority: item.priority,
          frequency: item.frequency,
        }))}
      />
    </>
  );
}
