import { PostEditor } from "@/components/admin/post-editor";
import { requirePageSession } from "@/lib/admin/session";
import { canPublish } from "@/lib/authz";
import { getAdminCategories, getAdminTags } from "@/lib/queries/taxonomy";

export default async function NewPostPage() {
  const session = await requirePageSession();

  const [categories, tags] = await Promise.all([
    getAdminCategories(),
    getAdminTags(),
  ]);

  return (
    <PostEditor
      canPublish={canPublish(session)}
      categories={categories}
      tags={tags}
      initialData={{
        title: "",
        slug: "",
        excerpt: "",
        category: "",
        tags: [],
        coverImage: "",
        content: { type: "doc", content: [] },
        metaTitle: "",
        metaDescription: "",
        focusKeyword: "",
        schemaType: "BlogPosting",
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
        tldr: "",
        keyTakeaways: ["", "", ""],
        postFaqs: [],
      }}
    />
  );
}
