import { requirePageRoles } from "@/lib/admin/session";
import { LandingPageEditor } from "@/components/admin/landing-page-editor";
import {
  POST_SCHEMA_TYPES,
  type PostSchemaType,
} from "@/lib/posts/constants";
import { getAdminLandingPageById } from "@/lib/queries/admin-landing-pages";
import {
  emptyMarketingPageSections,
  parseMarketingPageSections,
  parseServiceHeroVisual,
} from "@/lib/services/page-sections";
import { notFound } from "next/navigation";

type EditLandingPageProps = {
  params: Promise<{ id: string }>;
};

function isSchemaType(value: string | null | undefined): value is PostSchemaType {
  return POST_SCHEMA_TYPES.includes(value as PostSchemaType);
}

function normalizeStatus(
  value: string | null | undefined,
): "draft" | "published" | "scheduled" | "trashed" {
  if (
    value === "published" ||
    value === "scheduled" ||
    value === "trashed" ||
    value === "draft"
  ) {
    return value;
  }
  return "draft";
}

export default async function EditLandingPagePage({
  params,
}: EditLandingPageProps) {
  await requirePageRoles(["admin", "editor"]);

  const { id } = await params;
  const page = await getAdminLandingPageById(id);

  if (!page) {
    notFound();
  }

  const pageSections =
    parseMarketingPageSections(page.pageSections) ??
    emptyMarketingPageSections();

  return (
    <LandingPageEditor
      initialData={{
        id: page.id,
        title: page.title,
        slug: page.slug,
        path: page.path ?? undefined,
        heroVisual: parseServiceHeroVisual(page.heroVisual) ?? {
          mode: "animation",
        },
        content: page.content ?? { type: "doc", content: [] },
        pageSections,
        layoutKind: page.layoutKind === "custom" ? "custom" : "marketing",
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        focusKeyword: page.focusKeyword ?? "",
        secondaryKeywords: page.secondaryKeywords ?? "",
        schemaType: isSchemaType(page.schemaType) ? page.schemaType : "WebPage",
        schemaJson: page.schemaJson
          ? JSON.stringify(page.schemaJson, null, 2)
          : "",
        ogImage: page.ogImage ?? "",
        canonicalUrl: page.canonicalUrl ?? "",
        noIndex: page.noIndex ?? false,
        sitemapInclude: page.sitemapInclude ?? true,
        sitemapPriority: page.sitemapPriority ?? "0.7",
        status: normalizeStatus(page.status),
        scheduledFor: page.scheduledFor
          ? page.scheduledFor.toISOString()
          : "",
      }}
    />
  );
}
