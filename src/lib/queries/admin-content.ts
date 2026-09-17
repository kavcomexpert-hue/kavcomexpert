import { getDb } from "@/lib/db";
import {
  caseStudies,
  leads,
  redirects,
  services,
  siteSettings,
  testimonials,
  user,
} from "@/lib/db/schema";
import { asc, desc, eq } from "drizzle-orm";

export type AdminCaseStudyListItem = {
  id: string;
  slug: string;
  client: string;
  industry: string | null;
  status: string | null;
  focusKeyword: string | null;
  metaTitle: string;
  metaDescription: string;
  publishedAt: Date | null;
  scheduledFor: Date | null;
  updatedAt: Date | null;
  authorId: string | null;
  authorName: string | null;
  authorEmail: string | null;
};

export async function getAdminTestimonials() {
  return getDb()
    .select()
    .from(testimonials)
    .orderBy(asc(testimonials.sortOrder));
}

export async function getAdminTestimonialById(id: string) {
  const [row] = await getDb()
    .select()
    .from(testimonials)
    .where(eq(testimonials.id, id))
    .limit(1);
  return row ?? null;
}

export async function getAdminCaseStudies(): Promise<AdminCaseStudyListItem[]> {
  return getDb()
    .select({
      id: caseStudies.id,
      slug: caseStudies.slug,
      client: caseStudies.client,
      industry: caseStudies.industry,
      status: caseStudies.status,
      focusKeyword: caseStudies.focusKeyword,
      metaTitle: caseStudies.metaTitle,
      metaDescription: caseStudies.metaDescription,
      publishedAt: caseStudies.publishedAt,
      scheduledFor: caseStudies.scheduledFor,
      updatedAt: caseStudies.updatedAt,
      authorId: caseStudies.authorId,
      authorName: user.name,
      authorEmail: user.email,
    })
    .from(caseStudies)
    .leftJoin(user, eq(caseStudies.authorId, user.id))
    .orderBy(desc(caseStudies.updatedAt));
}

export async function getAdminCaseStudyAuthors() {
  return getDb()
    .selectDistinct({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(caseStudies)
    .innerJoin(user, eq(caseStudies.authorId, user.id));
}

export async function getAdminCaseStudyById(id: string) {
  const [row] = await getDb()
    .select()
    .from(caseStudies)
    .where(eq(caseStudies.id, id))
    .limit(1);
  return row ?? null;
}

export async function getAdminServices() {
  return getDb()
    .select({
      id: services.id,
      slug: services.slug,
      name: services.name,
      status: services.status,
      sortOrder: services.sortOrder,
      publishedAt: services.publishedAt,
      scheduledFor: services.scheduledFor,
      parentId: services.parentId,
    })
    .from(services)
    .orderBy(asc(services.sortOrder));
}

export async function getAdminServiceById(id: string) {
  const [row] = await getDb().select().from(services).where(eq(services.id, id)).limit(1);
  return row ?? null;
}

export async function getAdminServiceParentOptions(excludeId?: string) {
  const rows = await getDb()
    .select({
      id: services.id,
      name: services.name,
      slug: services.slug,
    })
    .from(services)
    .orderBy(asc(services.sortOrder), asc(services.name));

  if (!excludeId) return rows;
  return rows.filter((row) => row.id !== excludeId);
}

export async function getAdminLeads() {
  return getDb().select().from(leads).orderBy(desc(leads.createdAt));
}

export async function getAdminRedirects() {
  return getDb().select().from(redirects).orderBy(asc(redirects.fromPath));
}

export async function getSiteSettings() {
  const [row] = await getDb().select().from(siteSettings).limit(1);
  return row ?? null;
}
