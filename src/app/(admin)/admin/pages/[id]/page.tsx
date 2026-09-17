import { requirePageRoles } from "@/lib/admin/session";
import { PageEditor } from "@/components/admin/page-editor";
import {
  getAdminPageById,
  getAdminPageParentOptions,
  getAdminServiceParentOptions,
} from "@/lib/queries/admin-pages";
import {
  POST_SCHEMA_TYPES,
  type PostSchemaType,
} from "@/lib/posts/constants";
import { isSystemSectionPage, parsePageSectionsForSlug } from "@/lib/pages/page-section-schemas";
import { getAdminContentBlocks } from "@/lib/queries/content-blocks";
import {
  emptyMarketingPageSections,
  parseMarketingPageSections,
  parseServiceHeroVisual,
} from "@/lib/services/page-sections";
import { notFound } from "next/navigation";

type EditPagePageProps = {
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

export default async function EditPagePage({ params }: EditPagePageProps) {
  await requirePageRoles(["admin", "editor"]);

  const { id } = await params;
  const page = await getAdminPageById(id);

  if (!page) {
    notFound();
  }

  const [parentPages, parentServices, contentBlockRows] = await Promise.all([
    getAdminPageParentOptions(id),
    getAdminServiceParentOptions(),
    getAdminContentBlocks(),
  ]);

  const pageSections = isSystemSectionPage(page.slug)
    ? ((parsePageSectionsForSlug(page.slug, page.pageSections) ??
        parsePageSectionsForSlug(page.slug, {})) as Record<string, unknown>)
    : (parseMarketingPageSections(page.pageSections) ??
      emptyMarketingPageSections());

  const contentBlocks = contentBlockRows.map((row) => ({
    key: row.key,
    label: row.label,
    type: row.type,
    value: row.value,
  }));

  return (
    <PageEditor
      parentPages={parentPages}
      parentServices={parentServices}
      contentBlocks={contentBlocks}
      initialData={{
        id: page.id,
        title: page.title,
        slug: page.slug,
        path: page.path ?? undefined,
        heroEyebrow: page.heroEyebrow ?? "",
        heroSubtext: page.heroSubtext ?? "",
        heroVisual: parseServiceHeroVisual(page.heroVisual) ?? {
          mode: "animation",
        },
        content: page.content ?? { type: "doc", content: [] },
        pageSections,
        showCta: page.showCta ?? true,
        template:
          page.template === "article" ? "article" : "marketing",
        parentId: page.parentId,
        parentServiceId: page.parentServiceId,
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
