import { requirePageRoles } from "@/lib/admin/session";
import { JobEditor, type JobEditorData } from "@/components/admin/job-editor";
import { ApplicationsTable } from "@/components/admin/applications-table";
import { getAdminJobById } from "@/lib/queries/jobs";
import { getApplicationsByJobId } from "@/lib/queries/job-applications";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditJobPage({ params }: PageProps) {
  await requirePageRoles(["admin", "editor"]);

  const { id } = await params;
  const [row, applications] = await Promise.all([
    getAdminJobById(id),
    getApplicationsByJobId(id),
  ]);

  if (!row) notFound();

  const initialData: JobEditorData = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    department: row.department ?? "",
    location: row.location ?? "",
    employmentType: (row.employmentType as JobEditorData["employmentType"]) ?? "full-time",
    description: row.description ?? { type: "doc", content: [] },
    requirements: row.requirements ?? "",
    salaryRange: row.salaryRange ?? "",
    status: row.status === "published" ? "published" : "draft",
    metaTitle: row.metaTitle ?? "",
    metaDescription: row.metaDescription ?? "",
    ogImage: row.ogImage ?? "",
    canonicalUrl: row.canonicalUrl ?? "",
    noIndex: row.noIndex ?? false,
  };

  return (
    <div className="space-y-12">
      <JobEditor initialData={initialData} />

      <section>
        <div className="mb-6 flex items-center justify-between border-t border-border pt-10">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Applications
            </h2>
            <p className="mt-1 text-sm text-muted">
              {applications.length === 0
                ? "No applications received yet."
                : `${applications.length} application${applications.length === 1 ? "" : "s"} received.`}
            </p>
          </div>
          <Link
            href="/admin/applications"
            className="text-sm font-medium text-accent hover:opacity-80"
          >
            View all →
          </Link>
        </div>
        <ApplicationsTable items={applications} showJobColumn={false} />
      </section>
    </div>
  );
}
