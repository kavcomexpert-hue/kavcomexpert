import { PostEditor } from "@/components/admin/post-editor";
import { requirePageSession } from "@/lib/admin/session";
import { canEditEntity, canPublish } from "@/lib/authz";
import { getAdminPostById } from "@/lib/queries/admin-posts";
import { getPostCategorySlugs } from "@/lib/posts/sync-taxonomy";
import {
  POST_SCHEMA_TYPES,
  type PostSchemaType,
} from "@/lib/posts/constants";
import { getAdminCategories, getAdminTags } from "@/lib/queries/taxonomy";
import { notFound, redirect } from "next/navigation";

type EditPostPageProps = {
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

export default async function EditPostPage({ params }: EditPostPageProps) {
  const session = await requirePageSession();

  const { id } = await params;
  const [post, categories, tags] = await Promise.all([
    getAdminPostById(id),
    getAdminCategories(),
    getAdminTags(),
  ]);

  if (!post) {
    notFound();
  }

  if (!canEditEntity(session, { authorId: post.authorId })) {
    redirect("/admin/posts");
  }

  const categorySlugs = await getPostCategorySlugs(post.id, post.category);

  return (
    <PostEditor
      canPublish={canPublish(session)}
      categories={categories}
      tags={tags}
      initialData={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        category: categorySlugs[0] ?? post.category ?? "",
        categories: categorySlugs,
        tags: Array.isArray(post.tags) ? (post.tags as string[]) : [],
        coverImage: post.coverImage ?? "",
        content: post.content ?? { type: "doc", content: [] },
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        focusKeyword: post.focusKeyword ?? "",
        secondaryKeywords: post.secondaryKeywords ?? "",
        schemaType: isSchemaType(post.schemaType) ? post.schemaType : "BlogPosting",
        schemaJson:
          post.schemaJson && typeof post.schemaJson === "object"
            ? JSON.stringify(post.schemaJson, null, 2)
            : "",
        ogImage: post.ogImage ?? "",
        canonicalUrl: post.canonicalUrl ?? "",
        noIndex: post.noIndex ?? false,
        socialTitle: post.socialTitle ?? "",
        socialDescription: post.socialDescription ?? "",
        noFollow: post.noFollow ?? false,
        noArchive: post.noArchive ?? false,
        sitemapInclude: post.sitemapInclude ?? true,
        sitemapPriority: post.sitemapPriority ?? "0.7",
        status: normalizeStatus(post.status),
        scheduledFor: post.scheduledFor
          ? post.scheduledFor.toISOString()
          : "",
        tldr: post.tldr ?? "",
        keyTakeaways: Array.isArray(post.keyTakeaways)
          ? (post.keyTakeaways as string[])
          : ["", "", ""],
        postFaqs: Array.isArray(post.postFaqs)
          ? (post.postFaqs as { q: string; a: string }[])
          : [],
      }}
    />
  );
}
