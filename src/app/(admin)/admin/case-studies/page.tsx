import { CaseStudiesTable } from "@/components/admin/case-studies-table";
import { PageHeader } from "@/components/admin/page-header";
import { requirePageSession } from "@/lib/admin/session";
import { canPublish, sessionRole } from "@/lib/authz";
import {
  getAdminCaseStudies,
  getAdminCaseStudyAuthors,
} from "@/lib/queries/admin-content";
import Link from "next/link";

export default async function AdminCaseStudiesPage() {
  const session = await requirePageSession();
  const role = sessionRole(session);

  const [items, authors] = await Promise.all([
    getAdminCaseStudies(),
    getAdminCaseStudyAuthors(),
  ]);

  const caseStudies =
    role === "author"
      ? items.filter((item) => item.authorId === session.user.id)
      : items;

  return (
    <>
      <PageHeader
        title="Work"
        action={
          <Link
            href="/admin/case-studies/new"
            className="inline-flex h-11 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface"
          >
            New project
          </Link>
        }
      />
      <CaseStudiesTable
        caseStudies={caseStudies}
        authors={authors}
        currentUserId={session.user.id}
        role={role}
        canPublish={canPublish(session)}
      />
    </>
  );
}
