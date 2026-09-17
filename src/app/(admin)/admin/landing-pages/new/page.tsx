import { requirePageRoles } from "@/lib/admin/session";
import { LandingPageEditor } from "@/components/admin/landing-page-editor";
import { emptyMarketingPageSections } from "@/lib/services/page-sections";

export default async function NewLandingPagePage() {
  await requirePageRoles(["admin", "editor"]);

  return (
    <LandingPageEditor
      initialData={{
        title: "",
        slug: "",
        heroVisual: { mode: "animation" },
        content: { type: "doc", content: [] },
        pageSections: emptyMarketingPageSections(),
        layoutKind: "marketing",
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
