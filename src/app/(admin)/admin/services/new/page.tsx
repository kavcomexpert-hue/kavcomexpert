import { requirePageRoles } from "@/lib/admin/session";
import { ServiceEditor } from "@/components/admin/service-editor";
import { getAdminServiceParentOptions } from "@/lib/queries/admin-content";
import { emptyServicePageSections } from "@/lib/services/page-sections";

export default async function NewServicePage() {
  await requirePageRoles(["admin", "editor"]);

  const parentServices = await getAdminServiceParentOptions();

  return (
    <ServiceEditor
      parentServices={parentServices}
      initialData={{
        slug: "",
        name: "",
        shortPitch: "",
        heroVisual: { mode: "animation" },
        pageSections: emptyServicePageSections(),
        parentId: null,
        metaTitle: "",
        metaDescription: "",
        focusKeyword: "",
        secondaryKeywords: "",
        schemaType: "Service",
        schemaJson: "",
        ogImage: "",
        canonicalUrl: "",
        noIndex: false,
        socialTitle: "",
        socialDescription: "",
        noFollow: false,
        noArchive: false,
        sitemapInclude: true,
        sitemapPriority: "0.7",
        status: "draft",
        scheduledFor: "",
      }}
    />
  );
}
