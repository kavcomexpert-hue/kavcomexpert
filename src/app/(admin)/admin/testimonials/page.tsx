import { requirePageRoles } from "@/lib/admin/session";
import { PageHeader } from "@/components/admin/page-header";
import { TestimonialsTable } from "@/components/admin/testimonials-table";
import { getAdminTestimonials } from "@/lib/queries/admin-content";
import Link from "next/link";

export default async function AdminTestimonialsPage() {
  await requirePageRoles(["admin", "editor"]);

  const items = await getAdminTestimonials();

  return (
    <>
      <PageHeader
        title="Testimonials"
        description="Published reviews appear on the About Us text review slider. Add a client photo for the circular avatar."
        action={
          <Link href="/admin/testimonials/new" className="inline-flex h-11 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface">
            New testimonial
          </Link>
        }
      />
      <TestimonialsTable items={items} />
    </>
  );
}
