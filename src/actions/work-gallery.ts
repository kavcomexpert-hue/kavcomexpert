"use server";

import { beginAdminMutation, RateLimitedError } from "@/lib/admin/mutation-guard";
import { requireSession } from "@/lib/admin/session";
import { canAccessOwnedContent } from "@/lib/authz";
import { getDb } from "@/lib/db";
import { workGallery } from "@/lib/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

const workGalleryInputSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().trim().min(1, "Image URL is required"),
  alt: z.string().default(""),
});

type ActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

function revalidateWorkGallery() {
  revalidateTag("work-gallery", "max");
  revalidatePath("/admin/work-gallery");
  revalidatePath("/work");
}

export async function addWorkGalleryItem(
  input: z.input<typeof workGalleryInputSchema>,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }

    const parsed = workGalleryInputSchema.parse(input);

    const [maxOrder] = await getDb()
      .select({ sortOrder: workGallery.sortOrder })
      .from(workGallery)
      .orderBy(desc(workGallery.sortOrder))
      .limit(1);

    const [created] = await getDb()
      .insert(workGallery)
      .values({
        url: parsed.url,
        alt: parsed.alt.trim(),
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      })
      .returning({ id: workGallery.id });

    revalidateWorkGallery();

    await audit({
      action: "create",
      entityType: "work_gallery",
      entityId: created.id,
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
    return { success: false, error: "Failed to add gallery item" };
  }
}

export async function updateWorkGalleryItem(
  input: z.input<typeof workGalleryInputSchema> & { id: string },
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }

    const parsed = workGalleryInputSchema.extend({ id: z.string().uuid() }).parse(input);

    const [existing] = await getDb()
      .select({ id: workGallery.id })
      .from(workGallery)
      .where(eq(workGallery.id, parsed.id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Gallery item not found" };
    }

    await getDb()
      .update(workGallery)
      .set({
        url: parsed.url,
        alt: parsed.alt.trim(),
      })
      .where(eq(workGallery.id, parsed.id));

    revalidateWorkGallery();

    await audit({
      action: "update",
      entityType: "work_gallery",
      entityId: parsed.id,
    });

    return { success: true, id: parsed.id };
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
    return { success: false, error: "Failed to update gallery item" };
  }
}

export async function deleteWorkGalleryItem(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }

    const [existing] = await getDb()
      .select({ id: workGallery.id })
      .from(workGallery)
      .where(eq(workGallery.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Gallery item not found" };
    }

    await getDb().delete(workGallery).where(eq(workGallery.id, id));

    revalidateWorkGallery();

    await audit({
      action: "delete",
      entityType: "work_gallery",
      entityId: id,
    });

    return { success: true, id };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete gallery item" };
  }
}

export async function reorderWorkGallery(
  orderedIds: string[],
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canAccessOwnedContent(session)) {
      return { success: false, error: "Forbidden" };
    }

    await Promise.all(
      orderedIds.map((id, index) =>
        getDb()
          .update(workGallery)
          .set({ sortOrder: index })
          .where(eq(workGallery.id, id)),
      ),
    );

    revalidateWorkGallery();

    await audit({
      action: "reorder",
      entityType: "work_gallery",
      meta: { count: orderedIds.length },
    });

    return { success: true, id: orderedIds[0] ?? "" };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to reorder gallery" };
  }
}

export async function moveWorkGalleryItem(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  try {
    await requireSession();
    const rows = await getDb()
      .select({ id: workGallery.id })
      .from(workGallery)
      .orderBy(asc(workGallery.sortOrder), asc(workGallery.createdAt));

    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) {
      return { success: false, error: "Gallery item not found" };
    }

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= rows.length) {
      return { success: true, id };
    }

    const orderedIds = rows.map((row) => row.id);
    [orderedIds[index], orderedIds[swapIndex]] = [
      orderedIds[swapIndex],
      orderedIds[index],
    ];

    return reorderWorkGallery(orderedIds);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { success: false, error: "Unauthorized" };
    }
    return { success: false, error: "Failed to move gallery item" };
  }
}
