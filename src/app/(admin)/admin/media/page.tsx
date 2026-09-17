import { MediaLibrary } from "@/components/admin/media-library";
import { PageHeader } from "@/components/admin/page-header";
import { requirePageSession } from "@/lib/admin/session";
import { getAdminMedia } from "@/lib/queries/admin-media";

export default async function AdminMediaPage() {
  await requirePageSession();

  const items = await getAdminMedia();

  return (
    <>
      <PageHeader title="Media" />
      <MediaLibrary initialItems={items} />
    </>
  );
}
