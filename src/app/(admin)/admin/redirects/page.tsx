import { PageHeader } from "@/components/admin/page-header";
import { RedirectsManager } from "@/components/admin/redirects-manager";
import { requireAdminPageSession } from "@/lib/admin/session";
import { withDbFallback } from "@/lib/db/retry";
import { getAdminRedirects } from "@/lib/queries/admin-content";
import {
  getAdminMenuLinkOptions,
  type MenuLinkOption,
} from "@/lib/queries/menus";

export default async function AdminRedirectsPage() {
  await requireAdminPageSession();

  const emptyLinks: MenuLinkOption[] = [];
  const [items, linkOptions] = await Promise.all([
    getAdminRedirects(),
    withDbFallback(() => getAdminMenuLinkOptions(), emptyLinks),
  ]);

  return (
    <>
      <PageHeader
        title="Redirects"
        description="Map old paths to live pages, posts, services, or careers. Use Pick content to choose a destination."
      />
      <RedirectsManager items={items} linkOptions={linkOptions} />
    </>
  );
}
