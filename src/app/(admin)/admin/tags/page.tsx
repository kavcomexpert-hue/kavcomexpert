import { redirect } from "next/navigation";

export default function AdminTagsRedirectPage() {
  redirect("/admin/taxonomy");
}
