import { CaseStudyEditor } from "@/components/admin/case-study-editor";
import type { GalleryItem } from "@/components/admin/media-gallery-picker";
import { requirePageSession } from "@/lib/admin/session";
import { canEditEntity, canPublish } from "@/lib/authz";
import { parseSectionLabels } from "@/lib/case-studies/section-labels";
import {
  getAdminCaseStudyById,
  getAdminServices,
} from "@/lib/queries/admin-content";
import { POST_SCHEMA_TYPES, type PostSchemaType } from "@/lib/posts/constants";
import { notFound, redirect } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

function parseGallery(value: unknown): GalleryItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "object" && item !== null && "url" in item)
    .map((item) => ({
      url: String((item as { url: string }).url),
      alt: (item as { alt?: string }).alt,
    }));
}

function parseClientQuote(value: unknown): {
  quote: string;
  name: string;
  role: string;
  videoUrl: string;
} {
  if (!value || typeof value !== "object") {
    return { quote: "", name: "", role: "", videoUrl: "" };
  }
  const record = value as Record<string, unknown>;
  return {
    quote: typeof record.quote === "string" ? record.quote : "",
    name: typeof record.name === "string" ? record.name : "",
    role: typeof record.role === "string" ? record.role : "",
    videoUrl: typeof record.videoUrl === "string" ? record.videoUrl : "",
  };
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

export default async function EditCaseStudyPage({ params }: PageProps) {
  const session = await requirePageSession();

  const { id } = await params;
  const [row, services] = await Promise.all([
    getAdminCaseStudyById(id),
    getAdminServices(),
  ]);
  if (!row) notFound();

  if (!canEditEntity(session, { authorId: row.authorId })) {
    redirect("/admin/case-studies");
  }

  const schemaType = POST_SCHEMA_TYPES.includes(row.schemaType as PostSchemaType)
    ? (row.schemaType as PostSchemaType)
    : "Article";

  return (
    <CaseStudyEditor
      canPublish={canPublish(session)}
      services={services.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
      }))}
      initialData={{
        id: row.id,
        slug: row.slug,
        client: row.client,
        pageHeading: row.pageHeading ?? "",
        industry: row.industry ?? "",
        website: row.website ?? "",
        engagementType: row.engagementType ?? "",
        servicesProvided: row.servicesProvided ?? "",
        location: row.location ?? "",
        platformStack: row.platformStack ?? "",
        infoHeadlineLabel: row.infoHeadlineLabel ?? "",
        infoHeadlineValue: row.infoHeadlineValue ?? "",
        challenge: row.challenge ?? "",
        challengeMedia: row.challengeMedia ?? "",
        approach: row.approach ?? { type: "doc", content: [] },
        approachMedia: row.approachMedia ?? "",
        solution: row.solution ?? { type: "doc", content: [] },
        solutionMedia: row.solutionMedia ?? "",
        clientNoticed: row.clientNoticed ?? { type: "doc", content: [] },
        clientNoticedMedia: row.clientNoticedMedia ?? "",
        sectionLabels: parseSectionLabels(row.sectionLabels),
        gallery: parseGallery(row.gallery),
        clientQuote: parseClientQuote(row.clientQuote),
        serviceSlugs: Array.isArray(row.serviceSlugs)
          ? (row.serviceSlugs as string[])
          : [],
        metaTitle: row.metaTitle,
        metaDescription: row.metaDescription,
        focusKeyword: row.focusKeyword ?? "",
        schemaType,
        ogImage: row.ogImage ?? "",
        canonicalUrl: row.canonicalUrl ?? "",
        noIndex: row.noIndex ?? false,
        sitemapInclude: row.sitemapInclude ?? true,
        sitemapPriority: row.sitemapPriority ?? "0.7",
        status: normalizeStatus(row.status),
        scheduledFor: row.scheduledFor
          ? row.scheduledFor.toISOString()
          : "",
      }}
    />
  );
}
