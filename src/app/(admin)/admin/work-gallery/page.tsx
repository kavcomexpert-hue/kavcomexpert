import { PageHeader } from "@/components/admin/page-header";
import { WorkGalleryManager } from "@/components/admin/work-gallery-manager";
import { requirePageSession } from "@/lib/admin/session";
import { getAdminWorkGallery } from "@/lib/queries/work-gallery";

export default async function AdminWorkGalleryPage() {
  await requirePageSession();
  const items = await getAdminWorkGallery();

  return (
    <>
      <PageHeader
        title="Work gallery"
        description="Manage the General Gallery slider on the public Work page."
      />
      <WorkGalleryManager items={items} />
    </>
  );
}
