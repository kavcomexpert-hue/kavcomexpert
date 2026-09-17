import { requirePageRoles } from "@/lib/admin/session";
import { TestimonialEditor } from "@/components/admin/testimonial-editor";

export default async function NewTestimonialPage() {
  await requirePageRoles(["admin", "editor"]);

  return (
    <TestimonialEditor
      initialData={{
        clientName: "",
        company: "",
        role: "",
        quote: "",
        rating: 5,
        headshot: "",
        videoUrl: "",
        featured: false,
        status: "draft",
      }}
    />
  );
}
