import { PageHeader } from "@/components/admin/page-header";
import { PostsTable } from "@/components/admin/posts-table";
import { requirePageSession } from "@/lib/admin/session";
import { canPublish, sessionRole } from "@/lib/authz";
import {
  getAdminPostAuthors,
  getAdminPosts,
} from "@/lib/queries/admin-posts";
import { getAdminCategories } from "@/lib/queries/taxonomy";
import Link from "next/link";

export default async function AdminPostsPage() {
  const session = await requirePageSession();
  const role = sessionRole(session);

  const [allPosts, categories, authors] = await Promise.all([
    getAdminPosts(),
    getAdminCategories(),
    getAdminPostAuthors(),
  ]);

  const posts =
    role === "author"
      ? allPosts.filter((p) => p.authorId === session.user.id)
      : allPosts;

  return (
    <>
      <PageHeader
        title="Posts"
        action={
          <Link
            href="/admin/posts/new"
            className="inline-flex h-11 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface transition-opacity hover:opacity-90"
          >
            New post
          </Link>
        }
      />
      <PostsTable
        posts={posts}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        authors={authors}
        currentUserId={session.user.id}
        role={role}
        canPublish={canPublish(session)}
      />
    </>
  );
}
