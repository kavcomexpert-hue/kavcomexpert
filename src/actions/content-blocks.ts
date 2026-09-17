"use server";

import { beginAdminMutation, RateLimitedError } from "@/lib/admin/mutation-guard";
import { requireRole } from "@/lib/authz";
import { getContentBlockDef } from "@/lib/content/blocks";
import { updateContentBlockValue } from "@/lib/queries/content-blocks";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

const saveSchema = z.object({
  key: z.string().min(1),
  type: z.enum(["text", "richtext", "image", "linkbutton"]),
  text: z.string().optional(),
  url: z.string().optional(),
  alt: z.string().optional(),
  label: z.string().optional(),
  href: z.string().optional(),
  enabled: z.boolean().optional(),
});

type ActionResult =
  | { success: true }
  | { success: false; error: string };

export async function saveContentBlock(
  input: z.input<typeof saveSchema>,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireRole(session, ["admin", "editor"]);
    const parsed = saveSchema.parse(input);
    const def = getContentBlockDef(parsed.key);
    if (!def) {
      return { success: false, error: "Unknown content block" };
    }

    const value =
      parsed.type === "image"
        ? { url: parsed.url?.trim() || "", alt: parsed.alt?.trim() || "" }
        : parsed.type === "linkbutton"
          ? {
              label: parsed.label?.trim() || "",
              href: parsed.href?.trim() || "/",
              enabled: parsed.enabled ?? true,
            }
          : { text: parsed.text ?? "" };

    const row = await updateContentBlockValue(parsed.key, value);
    if (!row) {
      return { success: false, error: "Block not found. Refresh and try again." };
    }

    // Keep type in sync when upgrading legacy text CTAs.
    if (def.type === "linkbutton") {
      const { getDb } = await import("@/lib/db");
      const { contentBlocks } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      await getDb()
        .update(contentBlocks)
        .set({ type: "linkbutton" })
        .where(eq(contentBlocks.key, parsed.key));
    }

    revalidateTag("content-blocks", "max");
    revalidatePath("/admin/settings");
    revalidatePath("/");
    // about.* blocks render on /about-us, which has its own full-route cache.
    revalidatePath("/about-us");

    await audit({
      action: "content_block_update",
      entityType: "content_block",
      entityId: parsed.key,
    });

    return { success: true };
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
    return { success: false, error: "Failed to save content block" };
  }
}
