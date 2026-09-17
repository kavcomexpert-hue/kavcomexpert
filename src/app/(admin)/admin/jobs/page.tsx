import { requirePageRoles } from "@/lib/admin/session";
import { PageHeader } from "@/components/admin/page-header";
import { JobsTable } from "@/components/admin/jobs-table";
import { getAdminJobs } from "@/lib/queries/jobs";
import Link from "next/link";

export default async function AdminJobsPage() {
  await requirePageRoles(["admin", "editor"]);

  const items = await getAdminJobs();

  return (
    <>
      <PageHeader
        title="Careers"
        description="Manage job postings visible at /careers. Published jobs appear publicly and accept applications."
        action={
          <Link
            href="/admin/jobs/new"
            className="inline-flex h-11 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface"
          >
            New job
          </Link>
        }
      />
      {items.length === 0 ? (
        <div className="rounded-default border border-border bg-surface px-6 py-12 text-center text-sm text-muted">
          No job postings yet. Create your first one.
        </div>
      ) : (
        <JobsTable items={items} />
      )}
    </>
  );
}
