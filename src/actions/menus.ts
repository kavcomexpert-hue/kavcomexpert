"use server";

import { beginAdminMutation, RateLimitedError } from "@/lib/admin/mutation-guard";
import { requireContentManager } from "@/lib/authz";
import { getDb } from "@/lib/db";
import { menus } from "@/lib/db/schema";
import {
  MENU_LOCATIONS,
  type MenuJsonItem,
} from "@/lib/queries/menus";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

const menuChildSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(120),
  href: z
    .string()
    .trim()
    .min(1, "URL is required")
    .max(500)
    .refine(
      (value) => value.startsWith("/") || value.startsWith("https://"),
      "Href must start with / or https://",
    ),
  order: z.number().int().min(0),
});

const menuItemSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(120),
  href: z
    .string()
    .trim()
    .min(1, "URL is required")
    .max(500)
    .refine(
      (value) => value.startsWith("/") || value.startsWith("https://"),
      "Href must start with / or https://",
    ),
  order: z.number().int().min(0),
  children: z.array(menuChildSchema).max(40).optional(),
});

const saveMenuSchema = z.object({
  location: z.enum(MENU_LOCATIONS),
  items: z.array(menuItemSchema).max(80),
});

type ActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

function revalidateMenus() {
  revalidateTag("menus", "max");
  revalidatePath("/admin/menus");
  revalidatePath("/");
}

function normalizeItems(items: MenuJsonItem[]): MenuJsonItem[] {
  return items
    .map((item, index) => ({
      label: item.label.trim(),
      href: item.href.trim(),
      order: index,
      children: (item.children ?? [])
        .map((child, childIndex) => ({
          label: child.label.trim(),
          href: child.href.trim(),
          order: childIndex,
        }))
        .filter((child) => child.label && child.href),
    }))
    .filter((item) => item.label && item.href);
}

export async function saveMenu(
  input: z.input<typeof saveMenuSchema>,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);
    const parsed = saveMenuSchema.parse(input);
    const items = normalizeItems(parsed.items);
    const now = new Date();

    const [existing] = await getDb()
      .select({ id: menus.id })
      .from(menus)
      .where(eq(menus.location, parsed.location))
      .limit(1);

    if (existing) {
      await getDb()
        .update(menus)
        .set({ items, updatedAt: now })
        .where(eq(menus.id, existing.id));

      await audit({
        action: "update",
        entityType: "menu",
        entityId: existing.id,
        meta: { location: parsed.location, count: items.length },
      });

      revalidateMenus();
      return { success: true, id: existing.id };
    }

    const [created] = await getDb()
      .insert(menus)
      .values({
        location: parsed.location,
        items,
        updatedAt: now,
      })
      .returning({ id: menus.id });

    await audit({
      action: "create",
      entityType: "menu",
      entityId: created.id,
      meta: { location: parsed.location, count: items.length },
    });

    revalidateMenus();
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
    return { success: false, error: "Failed to save menu" };
  }
}
