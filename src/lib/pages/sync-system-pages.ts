import { getDb } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { emptyPageSectionsForSlug } from "@/lib/pages/page-section-schemas";
import { ensureSystemRedirects } from "@/lib/pages/sync-system-redirects";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

type SystemPageSeed = {
  slug: string;
  title: string;
  path: string;
  metaTitle: string;
  metaDescription: string;
  heroEyebrow?: string;
  heroSubtext?: string;
};

const SYSTEM_PAGES: SystemPageSeed[] = [
  {
    slug: "home",
    title: "Home",
    path: "/",
    metaTitle: "Kavcom Expert | Web, Apps & Growth",
    metaDescription:
      "Kavcom Expert builds high-performing websites, apps, and growth systems for ambitious brands.",
    heroEyebrow: "Kavcom Expert",
    heroSubtext: "Websites, apps, and growth systems that convert.",
  },
  {
    slug: "about-us",
    title: "About us",
    path: "/about-us",
    metaTitle: "About Us | Kavcom Expert",
    metaDescription:
      "Learn about Kavcom Expert — the team behind websites, apps, and growth systems that perform.",
    heroEyebrow: "About",
    heroSubtext: "The team behind work that converts.",
  },
  {
    slug: "contact-us",
    title: "Contact us",
    path: "/contact-us",
    metaTitle: "Contact Us | Kavcom Expert",
    metaDescription:
      "Get in touch with Kavcom Expert to discuss your next website, app, or growth project.",
    heroEyebrow: "Contact",
    heroSubtext: "Tell us what you are building.",
  },
  {
    slug: "careers",
    title: "Careers",
    path: "/careers",
    metaTitle: "Careers | Kavcom Expert",
    metaDescription:
      "Join Kavcom Expert — roles across design, engineering, and growth.",
  },
  {
    slug: "work",
    title: "Work",
    path: "/work",
    metaTitle: "Work | Kavcom Expert",
    metaDescription: "Selected work from Kavcom Expert.",
  },
  {
    slug: "blog",
    title: "Blog",
    path: "/blog",
    metaTitle: "Blog | Kavcom Expert",
    metaDescription:
      "Insights on SEO, web development, e-commerce, and digital marketing from the Kavcom Expert team.",
  },
  {
    slug: "services",
    title: "Services",
    path: "/services",
    metaTitle: "Services | Kavcom Expert",
    metaDescription:
      "Web development, digital marketing, and cloud services from Kavcom Expert — built for performance, growth, and measurable results.",
    heroEyebrow: "21 services, one expert team",
    heroSubtext:
      "From development to marketing to cloud, complete digital solutions designed to build brands, drive growth, and deliver measurable results.",
  },
];

/**
 * Ensure core marketing routes exist as editable CMS pages.
 * Seeds them as published because the matching App Router pages are already live.
 * Does not overwrite existing titles/content/sections or force-publish drafts.
 */
export async function ensureSystemPages(): Promise<{
  created: number;
  published: number;
}> {
  await ensureSystemRedirects();

  const existing = await getDb()
    .select({
      id: pages.id,
      slug: pages.slug,
      path: pages.path,
      status: pages.status,
      publishedAt: pages.publishedAt,
    })
    .from(pages);

  const bySlug = new Map(existing.map((row) => [row.slug, row]));
  let created = 0;
  let published = 0;
  const now = new Date();

  for (const seed of SYSTEM_PAGES) {
    const row = bySlug.get(seed.slug);

    if (!row) {
      await getDb().insert(pages).values({
        slug: seed.slug,
        path: seed.path,
        title: seed.title,
        content: { type: "doc", content: [] },
        pageSections: emptyPageSectionsForSlug(seed.slug),
        heroEyebrow: seed.heroEyebrow ?? null,
        heroSubtext: seed.heroSubtext ?? null,
        showCta: true,
        template: "sections",
        status: "published",
        publishedAt: now,
        metaTitle: seed.metaTitle,
        metaDescription: seed.metaDescription,
        focusKeyword: seed.title,
        schemaType: "WebPage",
        noIndex: false,
        sitemapInclude: true,
        sitemapPriority: seed.slug === "home" ? "1.0" : "0.7",
        updatedAt: now,
      });
      created += 1;
      published += 1;
      continue;
    }

    // Existing rows: only repair missing path. Never force-publish drafts or
    // overwrite title/content/pageSections — admin CMS is the source of truth.
    if (!row.path) {
      await getDb()
        .update(pages)
        .set({ path: seed.path, updatedAt: now })
        .where(eq(pages.id, row.id));
    }
  }

  if (created > 0 || published > 0) {
    revalidateTag("pages", "max");
    revalidatePath("/admin/pages");
    for (const seed of SYSTEM_PAGES) {
      revalidatePath(seed.path === "/" ? "/" : seed.path);
    }
  }

  return { created, published };
}
