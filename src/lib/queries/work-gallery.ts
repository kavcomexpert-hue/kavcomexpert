import { getDb } from "@/lib/db";
import { workGallery } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export type WorkGalleryItem = {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
};

/** Real public assets so the Work page gallery is never empty before admin edit. */
export const DEFAULT_WORK_GALLERY_SEEDS: Omit<
  WorkGalleryItem,
  "id"
>[] = [
  {
    url: "/blog-media/Dashboard-115d51468c2350a5.png",
    alt: "Product dashboard interface",
    sortOrder: 0,
  },
  {
    url: "/blog-media/Ecommerce-trends-2026-3409a684abc83b91.png",
    alt: "E-commerce campaign visual",
    sortOrder: 1,
  },
  {
    url: "/blog-media/Landing-Page-Conversions-60ec93aba9667350.png",
    alt: "Landing page conversion layout",
    sortOrder: 2,
  },
  {
    url: "/blog-media/Ai-in-Digital-Marketing-Kavcom-Expert-6b56f27f749f114e.png",
    alt: "Digital marketing creative",
    sortOrder: 3,
  },
  {
    url: "/logos/client-01.png",
    alt: "Brand mark treatment",
    sortOrder: 4,
  },
  {
    url: "/logos/bertram-financial.webp",
    alt: "Financial services brand graphic",
    sortOrder: 5,
  },
];

function defaultWorkGalleryItems(): WorkGalleryItem[] {
  return DEFAULT_WORK_GALLERY_SEEDS.map((item, index) => ({
    id: `fallback-${index}`,
    ...item,
  }));
}

// Read paths must never write to the DB: seeding inside unstable_cache caused
// duplicate rows on concurrent cold requests and re-inserted defaults whenever
// an admin emptied the gallery. Defaults are now an in-memory fallback only.
async function fetchWorkGallery() {
  return getDb()
    .select({
      id: workGallery.id,
      url: workGallery.url,
      alt: workGallery.alt,
      sortOrder: workGallery.sortOrder,
    })
    .from(workGallery)
    .orderBy(asc(workGallery.sortOrder), asc(workGallery.createdAt));
}

export function getWorkGallery() {
  return unstable_cache(
    async () => {
      try {
        const rows = await fetchWorkGallery();
        return rows.length > 0 ? rows : defaultWorkGalleryItems();
      } catch (error) {
        console.warn("[work-gallery] fetch failed; returning defaults.", error);
        return defaultWorkGalleryItems();
      }
    },
    ["work-gallery-items-v2"],
    { tags: ["work-gallery"] },
  )();
}

export async function getAdminWorkGallery() {
  return fetchWorkGallery().catch(() => []);
}
