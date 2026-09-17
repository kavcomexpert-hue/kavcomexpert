import { getDb } from "@/lib/db";
import { pages, services, user } from "@/lib/db/schema";
import { asc, desc, eq, ne } from "drizzle-orm";

export type AdminPageListItem = {
  id: string;
  title: string;
  slug: string;
  path: string | null;
  status: string | null;
  publishedAt: Date | null;
  scheduledFor: Date | null;
  updatedAt: Date | null;
  metaTitle: string;
  metaDescription: string;
  authorId: string | null;
  authorName: string | null;
  authorEmail: string | null;
  showCta: boolean | null;
  parentId: string | null;
  parentServiceId: string | null;
  template: string | null;
};

export async function getAdminPages(): Promise<AdminPageListItem[]> {
  return getDb()
    .select({
      id: pages.id,
      title: pages.title,
      slug: pages.slug,
      path: pages.path,
      status: pages.status,
      publishedAt: pages.publishedAt,
      scheduledFor: pages.scheduledFor,
      updatedAt: pages.updatedAt,
      metaTitle: pages.metaTitle,
      metaDescription: pages.metaDescription,
      authorId: pages.authorId,
      authorName: user.name,
      authorEmail: user.email,
      showCta: pages.showCta,
      parentId: pages.parentId,
      parentServiceId: pages.parentServiceId,
      template: pages.template,
    })
    .from(pages)
    .leftJoin(user, eq(pages.authorId, user.id))
    .orderBy(desc(pages.updatedAt));
}

export async function getAdminPageById(id: string) {
  const [page] = await getDb().select().from(pages).where(eq(pages.id, id)).limit(1);
  return page ?? null;
}

export async function getAdminPageAuthors() {
  const rows = await getDb()
    .selectDistinct({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(pages)
    .innerJoin(user, eq(pages.authorId, user.id));

  return rows;
}

export async function getAdminPageParentOptions(excludeId?: string) {
  const query = getDb()
    .select({
      id: pages.id,
      title: pages.title,
      slug: pages.slug,
      path: pages.path,
    })
    .from(pages)
    .orderBy(asc(pages.title));

  if (excludeId) {
    return query.where(ne(pages.id, excludeId));
  }

  return query;
}

export async function getAdminServiceParentOptions() {
  return getDb()
    .select({
      id: services.id,
      name: services.name,
      slug: services.slug,
    })
    .from(services)
    .orderBy(asc(services.sortOrder), asc(services.name));
}
