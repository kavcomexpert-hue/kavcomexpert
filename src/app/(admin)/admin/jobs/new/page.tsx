import { requirePageRoles } from "@/lib/admin/session";
import { JobEditor } from "@/components/admin/job-editor";

export default async function NewJobPage() {
  await requirePageRoles(["admin", "editor"]);

  return (
    <JobEditor
      initialData={{
        slug: "",
        title: "",
        department: "",
        location: "",
        employmentType: "full-time",
        description: { type: "doc", content: [] },
        requirements: "",
        salaryRange: "",
        status: "draft",
        metaTitle: "",
        metaDescription: "",
        ogImage: "",
        canonicalUrl: "",
        noIndex: false,
      }}
    />
  );
}
