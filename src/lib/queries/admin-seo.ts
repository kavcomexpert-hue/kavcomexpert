import { plainTextAsTiptapDoc } from "@/lib/posts/constants";
import { getDb } from "@/lib/db";
import { caseStudies, pages, posts, services } from "@/lib/db/schema";
import { buildSeoAuditRow, type SeoAuditRow } from "@/lib/seo/audit";
import { eq } from "drizzle-orm";

function pageAuditContent(page: {
  slug: string;
  title: string;
  content: unknown;
  pageSections: unknown;
}) {
  if (page.content && typeof page.content === "object") {
    const doc = page.content as { content?: unknown[] };
    if (Array.isArray(doc.content) && doc.content.length > 0) {
      return page.content;
    }
  }

  const sectionText =
    page.pageSections && typeof page.pageSections === "object"
      ? JSON.stringify(page.pageSections)
      : "";

  return plainTextAsTiptapDoc(`${page.title} ${sectionText}`);
}

function serviceAuditContent(service: {
  name: string;
  shortPitch: string | null;
  body: unknown;
  pageSections: unknown;
}) {
  if (service.body && typeof service.body === "object") {
    const doc = service.body as { content?: unknown[] };
    if (Array.isArray(doc.content) && doc.content.length > 0) {
      return service.body;
    }
  }

  const sectionText =
    service.pageSections && typeof service.pageSections === "object"
      ? JSON.stringify(service.pageSections)
      : "";
  const pitch = service.shortPitch?.trim() ?? "";

  return plainTextAsTiptapDoc(`${service.name} ${pitch} ${sectionText}`);
}

/** Column sets for SEO audit — avoid loading unused revision/media blobs. */
const postAuditColumns = {
  id: posts.id,
  slug: posts.slug,
  title: posts.title,
  metaTitle: posts.metaTitle,
  metaDescription: posts.metaDescription,
  focusKeyword: posts.focusKeyword,
  secondaryKeywords: posts.secondaryKeywords,
  content: posts.content,
  coverImage: posts.coverImage,
  ogImage: posts.ogImage,
  tldr: posts.tldr,
  keyTakeaways: posts.keyTakeaways,
  postFaqs: posts.postFaqs,
  updatedAt: posts.updatedAt,
  noIndex: posts.noIndex,
};

const pageAuditColumns = {
  id: pages.id,
  slug: pages.slug,
  title: pages.title,
  metaTitle: pages.metaTitle,
  metaDescription: pages.metaDescription,
  focusKeyword: pages.focusKeyword,
  secondaryKeywords: pages.secondaryKeywords,
  content: pages.content,
  pageSections: pages.pageSections,
  ogImage: pages.ogImage,
  updatedAt: pages.updatedAt,
  noIndex: pages.noIndex,
};

const serviceAuditColumns = {
  id: services.id,
  slug: services.slug,
  parentId: services.parentId,
  name: services.name,
  shortPitch: services.shortPitch,
  metaTitle: services.metaTitle,
  metaDescription: services.metaDescription,
  focusKeyword: services.focusKeyword,
  secondaryKeywords: services.secondaryKeywords,
  body: services.body,
  pageSections: services.pageSections,
  ogImage: services.ogImage,
  faqs: services.faqs,
  updatedAt: services.updatedAt,
  noIndex: services.noIndex,
};

const caseStudyAuditColumns = {
  id: caseStudies.id,
  slug: caseStudies.slug,
  client: caseStudies.client,
  metaTitle: caseStudies.metaTitle,
  metaDescription: caseStudies.metaDescription,
  focusKeyword: caseStudies.focusKeyword,
  secondaryKeywords: caseStudies.secondaryKeywords,
  solution: caseStudies.solution,
  ogImage: caseStudies.ogImage,
  updatedAt: caseStudies.updatedAt,
  noIndex: caseStudies.noIndex,
};

export async function getSeoAuditRows(): Promise<SeoAuditRow[]> {
  const [publishedPosts, publishedPages, publishedServices, publishedCaseStudies] =
    await Promise.all([
      getDb()
        .select(postAuditColumns)
        .from(posts)
        .where(eq(posts.status, "published")),
      getDb()
        .select(pageAuditColumns)
        .from(pages)
        .where(eq(pages.status, "published")),
      getDb()
        .select(serviceAuditColumns)
        .from(services)
        .where(eq(services.status, "published")),
      getDb()
        .select(caseStudyAuditColumns)
        .from(caseStudies)
        .where(eq(caseStudies.status, "published")),
    ]);

  const parentSlugById = new Map(
    publishedServices
      .filter((row) => !row.parentId)
      .map((row) => [row.id, row.slug]),
  );

  const rows: SeoAuditRow[] = [
    ...publishedPosts.map((post) =>
      buildSeoAuditRow({
        id: post.id,
        slug: post.slug,
        type: "post",
        title: post.title,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        focusKeyword: post.focusKeyword,
        secondaryKeywords: post.secondaryKeywords,
        content: post.content,
        coverImage: post.coverImage,
        ogImage: post.ogImage,
        tldr: post.tldr,
        keyTakeaways: post.keyTakeaways,
        postFaqs: post.postFaqs,
        updatedAt: post.updatedAt,
        noIndex: post.noIndex,
      }),
    ),
    ...publishedPages.map((page) =>
      buildSeoAuditRow({
        id: page.id,
        slug: page.slug,
        type: "page",
        title: page.title,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        focusKeyword: page.focusKeyword,
        secondaryKeywords: page.secondaryKeywords,
        content: pageAuditContent(page),
        ogImage: page.ogImage,
        updatedAt: page.updatedAt,
        noIndex: page.noIndex,
      }),
    ),
    ...publishedServices.map((service) => {
      const parentSlug = service.parentId
        ? parentSlugById.get(service.parentId) ?? null
        : null;
      const displaySlug = parentSlug
        ? `${parentSlug}/${service.slug}`
        : service.slug;

      return buildSeoAuditRow({
        id: service.id,
        slug: displaySlug,
        type: "service",
        title: service.name,
        metaTitle: service.metaTitle,
        metaDescription: service.metaDescription,
        focusKeyword: service.focusKeyword,
        secondaryKeywords: service.secondaryKeywords,
        content: serviceAuditContent(service),
        ogImage: service.ogImage,
        serviceFaqs: service.faqs,
        updatedAt: service.updatedAt,
        noIndex: service.noIndex,
      });
    }),
    ...publishedCaseStudies.map((caseStudy) =>
      buildSeoAuditRow({
        id: caseStudy.id,
        slug: caseStudy.slug,
        type: "case-study",
        title: caseStudy.client,
        metaTitle: caseStudy.metaTitle,
        metaDescription: caseStudy.metaDescription,
        focusKeyword: caseStudy.focusKeyword,
        secondaryKeywords: caseStudy.secondaryKeywords,
        content: caseStudy.solution,
        ogImage: caseStudy.ogImage,
        updatedAt: caseStudy.updatedAt,
        noIndex: caseStudy.noIndex,
      }),
    ),
  ];

  return rows.sort((a, b) => {
    if (a.slug === "home") return -1;
    if (b.slug === "home") return 1;
    if (a.type !== b.type) {
      const order = { page: 0, post: 1, service: 2, "case-study": 3 } as const;
      return order[a.type] - order[b.type];
    }
    return a.title.localeCompare(b.title);
  });
}
