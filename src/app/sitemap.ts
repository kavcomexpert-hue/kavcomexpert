import { getSitemapEntries } from "@/lib/seo/sitemap-data";
import { absoluteUrl } from "@/lib/seo/constants";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const entries = await getSitemapEntries();

    return entries.map((entry) => ({
      url: absoluteUrl(entry.path),
      lastModified: entry.lastModified,
      priority: entry.priority,
      ...(entry.path === "/cpa-marketing-agency-houston"
        ? { changeFrequency: "weekly" as const }
        : {}),
      ...(entry.images && entry.images.length > 0
        ? { images: entry.images }
        : {}),
      ...(entry.videos && entry.videos.length > 0
        ? { videos: entry.videos }
        : {}),
    }));
  } catch (error) {
    console.warn("[sitemap] generation failed; returning empty.", error);
    return [];
  }
}
