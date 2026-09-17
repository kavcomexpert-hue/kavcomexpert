import { requirePageRoles } from "@/lib/admin/session";
import { TestimonialEditor } from "@/components/admin/testimonial-editor";
import { getAdminTestimonialById } from "@/lib/queries/admin-content";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditTestimonialPage({ params }: PageProps) {
  await requirePageRoles(["admin", "editor"]);

  const { id } = await params;
  const row = await getAdminTestimonialById(id);
  if (!row) notFound();

  return (
    <TestimonialEditor
      initialData={{
        id: row.id,
        clientName: row.clientName,
        company: row.company ?? "",
        role: row.role ?? "",
        quote: row.quote,
        rating: row.rating ?? 5,
        headshot: row.headshot ?? "",
        videoUrl: row.videoUrl ?? "",
        featured: Boolean(row.featured),
        status: row.status === "published" ? "published" : "draft",
      }}
    />
  );
}
