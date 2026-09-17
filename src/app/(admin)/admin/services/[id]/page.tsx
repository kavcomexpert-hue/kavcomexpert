import { requirePageRoles } from "@/lib/admin/session";
import { ServiceEditor } from "@/components/admin/service-editor";
import {
  getAdminServiceById,
  getAdminServiceParentOptions,
} from "@/lib/queries/admin-content";
import { POST_SCHEMA_TYPES, type PostSchemaType } from "@/lib/posts/constants";
import {
  emptyServicePageSections,
  parseServiceHeroVisual,
  parseServicePageSections,
  staticPageToSections,
} from "@/lib/services/page-sections";
import { getStaticServicePage } from "@/lib/site/service-pages";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

function schemaJsonString(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

export default async function EditServicePage({ params }: PageProps) {
  await requirePageRoles(["admin", "editor"]);

  const { id } = await params;
  const row = await getAdminServiceById(id);
  if (!row) notFound();

  const parentServices = await getAdminServiceParentOptions(id);

  const schemaType = POST_SCHEMA_TYPES.includes(row.schemaType as PostSchemaType)
    ? (row.schemaType as PostSchemaType)
    : "Service";

  const parsedSections = parseServicePageSections(row.pageSections);
  const staticFallback = getStaticServicePage(row.slug);
  const pageSections =
    parsedSections ??
    (staticFallback
      ? staticPageToSections(staticFallback)
      : emptyServicePageSections());

  return (
    <ServiceEditor
      parentServices={parentServices}
      initialData={{
        id: row.id,
        slug: row.slug,
        name: row.name,
        shortPitch: row.shortPitch ?? "",
        heroVisual: parseServiceHeroVisual(row.heroVisual) ?? { mode: "animation" },
        pageSections,
        parentId: row.parentId,
        metaTitle: row.metaTitle,
        metaDescription: row.metaDescription,
        focusKeyword: row.focusKeyword ?? "",
        secondaryKeywords: row.secondaryKeywords ?? "",
        schemaType,
        schemaJson: schemaJsonString(row.schemaJson),
        ogImage: row.ogImage ?? "",
        canonicalUrl: row.canonicalUrl ?? "",
        noIndex: row.noIndex ?? false,
        socialTitle: row.socialTitle ?? "",
        socialDescription: row.socialDescription ?? "",
        noFollow: row.noFollow ?? false,
        noArchive: row.noArchive ?? false,
        sitemapInclude: row.sitemapInclude ?? true,
        sitemapPriority: String(row.sitemapPriority ?? "0.7"),
        status:
          row.status === "published" ||
          row.status === "scheduled" ||
          row.status === "trashed"
            ? row.status
            : "draft",
        scheduledFor: row.scheduledFor
          ? row.scheduledFor.toISOString()
          : undefined,
      }}
    />
  );
}
