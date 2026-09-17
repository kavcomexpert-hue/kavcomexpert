import { getDb } from "@/lib/db";
import { posts, user } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export type AdminPostListItem = {
  id: string;
  title: string;
  slug: string;
  status: string | null;
  category: string | null;
  tags: string[] | null;
  publishedAt: Date | null;
  scheduledFor: Date | null;
  updatedAt: Date | null;
  metaTitle: string;
  metaDescription: string;
  coverImage: string | null;
  authorId: string | null;
  authorName: string | null;
  authorEmail: string | null;
  tldr: string | null;
  keyTakeaways: unknown;
};

export async function getAdminPosts(): Promise<AdminPostListItem[]> {
  const rows = await getDb()
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      status: posts.status,
      category: posts.category,
      tags: posts.tags,
      publishedAt: posts.publishedAt,
      scheduledFor: posts.scheduledFor,
      updatedAt: posts.updatedAt,
      metaTitle: posts.metaTitle,
      metaDescription: posts.metaDescription,
      coverImage: posts.coverImage,
      authorId: posts.authorId,
      authorName: user.name,
      authorEmail: user.email,
      tldr: posts.tldr,
      keyTakeaways: posts.keyTakeaways,
    })
    .from(posts)
    .leftJoin(user, eq(posts.authorId, user.id))
    .orderBy(desc(posts.updatedAt));

  return rows.map((row) => ({
    ...row,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : null,
  }));
}

export async function getAdminPostById(id: string) {
  const [post] = await getDb().select().from(posts).where(eq(posts.id, id)).limit(1);
  return post ?? null;
}

export async function getAdminPostAuthors() {
  const rows = await getDb()
    .selectDistinct({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(posts)
    .innerJoin(user, eq(posts.authorId, user.id));

  return rows;
}
