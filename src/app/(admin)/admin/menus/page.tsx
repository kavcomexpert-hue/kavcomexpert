import { PageHeader } from "@/components/admin/page-header";
import { MenusManager } from "@/components/admin/menus-manager";
import { requirePageRoles } from "@/lib/admin/session";
import { withDbFallback } from "@/lib/db/retry";
import {
  getAdminMenuLinkOptions,
  getAdminMenusByLocation,
  type MenuLinkOption,
} from "@/lib/queries/menus";

export default async function AdminMenusPage() {
  await requirePageRoles(["admin", "editor"]);

  const emptyLinks: MenuLinkOption[] = [];

  const [header, footerServices, footerGrowth, footerCompany, linkOptions] =
    await Promise.all([
      withDbFallback(() => getAdminMenusByLocation("header"), []),
      withDbFallback(() => getAdminMenusByLocation("footer-services"), []),
      withDbFallback(() => getAdminMenusByLocation("footer-growth"), []),
      withDbFallback(() => getAdminMenusByLocation("footer-company"), []),
      withDbFallback(() => getAdminMenuLinkOptions(), emptyLinks),
    ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Menus"
        description="Edit header and footer link trees. Drag to reorder, nest one level of children, then save."
      />
      <MenusManager
        menusByLocation={{
          header,
          "footer-services": footerServices,
          "footer-growth": footerGrowth,
          "footer-company": footerCompany,
        }}
        linkOptions={linkOptions}
      />
    </div>
  );
}
