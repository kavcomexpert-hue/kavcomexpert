import { requirePageRoles } from "@/lib/admin/session";
import { PageEditor } from "@/components/admin/page-editor";
import {
  getAdminPageParentOptions,
  getAdminServiceParentOptions,
} from "@/lib/queries/admin-pages";
import { emptyMarketingPageSections } from "@/lib/services/page-sections";

export default async function NewPagePage() {
  await requirePageRoles(["admin", "editor"]);

  const [parentPages, parentServices] = await Promise.all([
    getAdminPageParentOptions(),
    getAdminServiceParentOptions(),
  ]);

  return (
    <PageEditor
      parentPages={parentPages}
      parentServices={parentServices}
      initialData={{
        title: "",
        slug: "",
        heroEyebrow: "",
        heroSubtext: "",
        heroVisual: { mode: "animation" },
        content: { type: "doc", content: [] },
        pageSections: emptyMarketingPageSections(),
        showCta: true,
        template: "marketing",
        parentId: null,
        parentServiceId: null,
        metaTitle: "",
        metaDescription: "",
        focusKeyword: "",
        secondaryKeywords: "",
        schemaType: "WebPage",
        schemaJson: "",
        ogImage: "",
        canonicalUrl: "",
        noIndex: false,
        sitemapInclude: true,
        sitemapPriority: "0.7",
        status: "draft",
      }}
    />
  );
}
