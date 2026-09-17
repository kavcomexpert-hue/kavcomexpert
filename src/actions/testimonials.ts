"use server";

import { beginAdminMutation, RateLimitedError } from "@/lib/admin/mutation-guard";
import { requireContentManager } from "@/lib/authz";
import { getDb } from "@/lib/db";
import { testimonials } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

const testimonialInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    clientName: z.string().trim().min(1, "Client name is required"),
    company: z.string().optional(),
    role: z.string().optional(),
    // Optional: empty quote = video-only testimonial (text cards skip it).
    quote: z.string().trim().optional().default(""),
    rating: z.number().int().min(1).max(5),
    headshot: z.string().optional(),
    videoUrl: z.string().optional(),
    featured: z.boolean().default(false),
    status: z.enum(["draft", "published"]),
  })
  .superRefine((value, ctx) => {
    const hasQuote = Boolean(value.quote?.trim());
    const hasVideo = Boolean(value.videoUrl?.trim());
    if (!hasQuote && !hasVideo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add a quote for text reviews, a video URL for video testimonials, or both",
        path: ["quote"],
      });
    }
  });

type ActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

function revalidateTestimonials() {
  revalidateTag("testimonials", "max");
  revalidatePath("/admin/testimonials");
  revalidatePath("/about-us");
}

export async function saveTestimonial(
  input: z.input<typeof testimonialInputSchema>,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);
    const parsed = testimonialInputSchema.parse(input);

    const values = {
      clientName: parsed.clientName,
      company: parsed.company?.trim() || null,
      role: parsed.role?.trim() || null,
      // Column is NOT NULL — store "" for video-only rows.
      quote: parsed.quote?.trim() || "",
      rating: parsed.rating,
      headshot: parsed.headshot?.trim() || null,
      videoUrl: parsed.videoUrl?.trim() || null,
      featured: parsed.featured,
      status: parsed.status,
    };

    if (parsed.id) {
      const [existing] = await getDb()
        .select({ id: testimonials.id })
        .from(testimonials)
        .where(eq(testimonials.id, parsed.id))
        .limit(1);

      if (!existing) {
        return { success: false, error: "Testimonial not found" };
      }

      await getDb()
        .update(testimonials)
        .set(values)
        .where(eq(testimonials.id, parsed.id));

      revalidateTestimonials();

      await audit({
        action: "update",
        entityType: "testimonial",
        entityId: parsed.id,
        meta: { status: parsed.status },
      });

      return { success: true, id: parsed.id };
    }

    const [maxOrder] = await getDb()
      .select({ sortOrder: testimonials.sortOrder })
      .from(testimonials)
      .orderBy(desc(testimonials.sortOrder))
      .limit(1);

    const [created] = await getDb()
      .insert(testimonials)
      .values({
        ...values,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      })
      .returning({ id: testimonials.id });

    revalidateTestimonials();

    await audit({
      action: "create",
      entityType: "testimonial",
      entityId: created.id,
      meta: { status: parsed.status },
    });

    return { success: true, id: created.id };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Validation failed",
      };
    }

    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to save testimonial" };
  }
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    const [existing] = await getDb()
      .select({ id: testimonials.id })
      .from(testimonials)
      .where(eq(testimonials.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Testimonial not found" };
    }

    await getDb().delete(testimonials).where(eq(testimonials.id, id));
    revalidateTestimonials();

    await audit({
      action: "delete",
      entityType: "testimonial",
      entityId: id,
    });

    return { success: true, id };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to delete testimonial" };
  }
}

export async function reorderTestimonials(
  orderedIds: string[],
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    await Promise.all(
      orderedIds.map((id, index) =>
        getDb()
          .update(testimonials)
          .set({ sortOrder: index })
          .where(eq(testimonials.id, id)),
      ),
    );

    revalidateTestimonials();

    await audit({
      action: "reorder",
      entityType: "testimonial",
      meta: { count: orderedIds.length },
    });

    return { success: true, id: orderedIds[0] ?? "" };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to reorder testimonials" };
  }
}

export async function toggleTestimonialFeatured(
  id: string,
  featured: boolean,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    await getDb().update(testimonials).set({ featured }).where(eq(testimonials.id, id));
    revalidateTestimonials();

    await audit({
      action: "update",
      entityType: "testimonial",
      entityId: id,
      meta: { featured },
    });

    return { success: true, id };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to update testimonial" };
  }
}
