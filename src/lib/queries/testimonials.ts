import { getDb } from "@/lib/db";
import { testimonials } from "@/lib/db/schema";
import { mapVideoUrlToTestimonialVideo } from "@/lib/site/map-video-testimonial";
import type { TestimonialVideo } from "@/components/site/testimonial-videos";
import { and, asc, eq, isNotNull, ne, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export type TestimonialSummary = {
  id: string;
  clientName: string;
  company: string | null;
  role: string | null;
  quote: string;
  rating: number | null;
  resultMetric: string | null;
  headshot: string | null;
  videoUrl: string | null;
  serviceTag: string | null;
  featured: boolean | null;
  sortOrder: number | null;
};

const testimonialColumns = {
  id: testimonials.id,
  clientName: testimonials.clientName,
  company: testimonials.company,
  role: testimonials.role,
  quote: testimonials.quote,
  rating: testimonials.rating,
  resultMetric: testimonials.resultMetric,
  headshot: testimonials.headshot,
  videoUrl: testimonials.videoUrl,
  serviceTag: testimonials.serviceTag,
  featured: testimonials.featured,
  sortOrder: testimonials.sortOrder,
};

/** Text review cards: published rows with a non-empty quote. */
const hasQuote = sql`length(trim(${testimonials.quote})) > 0`;

async function fetchFeaturedTestimonials() {
  return getDb()
    .select(testimonialColumns)
    .from(testimonials)
    .where(
      and(
        eq(testimonials.status, "published"),
        eq(testimonials.featured, true),
        hasQuote,
      ),
    )
    .orderBy(asc(testimonials.sortOrder));
}

export function getFeaturedTestimonials() {
  return unstable_cache(
    async () => {
      try {
        return await fetchFeaturedTestimonials();
      } catch (error) {
        console.warn("[testimonials] featured fetch failed; returning empty.", error);
        return [];
      }
    },
    ["featured-testimonials-quotes"],
    {
      tags: ["testimonials"],
    },
  )();
}

async function fetchAllTestimonials() {
  return getDb()
    .select(testimonialColumns)
    .from(testimonials)
    .where(and(eq(testimonials.status, "published"), hasQuote))
    .orderBy(asc(testimonials.sortOrder));
}

export function getAllTestimonials() {
  return unstable_cache(
    async () => {
      try {
        return await fetchAllTestimonials();
      } catch (error) {
        console.warn("[testimonials] all fetch failed; returning empty.", error);
        return [];
      }
    },
    ["all-testimonials-quotes"],
    {
      tags: ["testimonials"],
    },
  )();
}

async function fetchVideoTestimonials(): Promise<TestimonialVideo[]> {
  const rows = await getDb()
    .select(testimonialColumns)
    .from(testimonials)
    .where(
      and(
        eq(testimonials.status, "published"),
        isNotNull(testimonials.videoUrl),
        ne(testimonials.videoUrl, ""),
      ),
    )
    .orderBy(asc(testimonials.sortOrder));

  return rows.flatMap((row) => {
    if (!row.videoUrl) return [];
    const mapped = mapVideoUrlToTestimonialVideo({
      id: row.id,
      clientName: row.clientName,
      company: row.company,
      videoUrl: row.videoUrl,
      headshot: row.headshot,
    });
    return mapped ? [mapped] : [];
  });
}

/** Published testimonials that have a videoUrl, mapped for the video slider. */
export function getVideoTestimonials() {
  return unstable_cache(
    async () => {
      try {
        return await fetchVideoTestimonials();
      } catch (error) {
        console.warn("[testimonials] video list fetch failed; returning empty.", error);
        return [];
      }
    },
    ["video-testimonials"],
    {
      tags: ["testimonials"],
    },
  )();
}
