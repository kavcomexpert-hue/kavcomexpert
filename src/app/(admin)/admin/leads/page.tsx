import { LeadsTable } from "@/components/admin/leads-table";
import { PageHeader } from "@/components/admin/page-header";
import { requirePageRoles } from "@/lib/admin/session";
import { canExportLeadsCsv } from "@/lib/authz";
import { getAdminLeads } from "@/lib/queries/admin-content";

export default async function AdminLeadsPage() {
  const session = await requirePageRoles(["admin", "editor"]);
  const leads = await getAdminLeads();

  return (
    <>
      <PageHeader title="Leads" />
      <LeadsTable leads={leads} canExportCsv={canExportLeadsCsv(session)} />
    </>
  );
}
