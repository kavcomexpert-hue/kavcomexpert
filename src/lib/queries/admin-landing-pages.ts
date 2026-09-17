import { getDb } from "@/lib/db";
import { landingPages, user } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export type AdminLandingPageListItem = {
  id: string;
  title: string;
  slug: string;
  path: string | null;
  status: string | null;
  layoutKind: string | null;
  publishedAt: Date | null;
  scheduledFor: Date | null;
  updatedAt: Date | null;
  metaTitle: string;
  metaDescription: string;
  authorId: string | null;
  authorName: string | null;
  authorEmail: string | null;
};

export async function getAdminLandingPages(): Promise<AdminLandingPageListItem[]> {
  return getDb()
    .select({
      id: landingPages.id,
      title: landingPages.title,
      slug: landingPages.slug,
      path: landingPages.path,
      status: landingPages.status,
      layoutKind: landingPages.layoutKind,
      publishedAt: landingPages.publishedAt,
      scheduledFor: landingPages.scheduledFor,
      updatedAt: landingPages.updatedAt,
      metaTitle: landingPages.metaTitle,
      metaDescription: landingPages.metaDescription,
      authorId: landingPages.authorId,
      authorName: user.name,
      authorEmail: user.email,
    })
    .from(landingPages)
    .leftJoin(user, eq(landingPages.authorId, user.id))
    .orderBy(desc(landingPages.updatedAt));
}

export async function getAdminLandingPageById(id: string) {
  const [page] = await getDb()
    .select()
    .from(landingPages)
    .where(eq(landingPages.id, id))
    .limit(1);
  return page ?? null;
}

export async function getAdminLandingPageAuthors() {
  const rows = await getDb()
    .selectDistinct({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(landingPages)
    .innerJoin(user, eq(landingPages.authorId, user.id));

  return rows;
}
