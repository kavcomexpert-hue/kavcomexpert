import { PageHeader } from "@/components/admin/page-header";
import { ApplicationsTable } from "@/components/admin/applications-table";
import { requirePageRoles } from "@/lib/admin/session";
import { getAllApplications } from "@/lib/queries/job-applications";

export default async function AdminApplicationsPage() {
  await requirePageRoles(["admin", "editor"]);

  const items = await getAllApplications();

  return (
    <>
      <PageHeader
        title="Applications"
        description="All job applications across every role. Update status and download resumes."
      />
      <ApplicationsTable items={items} showJobColumn />
    </>
  );
}
