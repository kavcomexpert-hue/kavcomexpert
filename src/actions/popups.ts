"use server";

import { beginAdminMutation, RateLimitedError } from "@/lib/admin/mutation-guard";
import { requireContentManager } from "@/lib/authz";
import { getDb } from "@/lib/db";
import {
  popups,
  type PopupAudience,
  type PopupContent,
  type PopupTrigger,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

const popupTypeSchema = z.enum([
  "exit-intent",
  "timed",
  "scroll-percentage",
  "slide-in",
]);

const popupStatusSchema = z.enum(["active", "paused"]);

const popupFrequencySchema = z.enum([
  "once-per-session",
  "once-per-visitor-30d",
  "every-visit",
]);

const popupInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required"),
  status: popupStatusSchema,
  type: popupTypeSchema,
  delaySeconds: z.number().int().min(0).optional(),
  scrollPercent: z.number().int().min(0).max(100).optional(),
  pages: z.array(z.string().trim().min(1)).default([]),
  devices: z.enum(["all", "desktop", "mobile"]).default("all"),
  frequency: popupFrequencySchema,
  priority: z.number().int().default(0),
  heading: z.string().trim().min(1, "Heading is required"),
  body: z.string().trim().min(1, "Body is required"),
  imageUrl: z.string().trim().optional(),
  ctaLabel: z.string().trim().optional(),
  ctaHref: z.string().trim().optional(),
  formEnabled: z.boolean().default(false),
  formSource: z.string().trim().optional(),
  displayFrom: z.string().optional().nullable(),
  displayUntil: z.string().optional().nullable(),
});

type ActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

function parseOptionalDate(value: string | null | undefined): Date | null {
  if (!value || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new z.ZodError([
      {
        code: "custom",
        path: ["displayFrom"],
        message: "Invalid date",
      },
    ]);
  }
  return date;
}

function revalidatePopups() {
  revalidateTag("popups", "max");
  revalidatePath("/admin/popups");
  revalidatePath("/admin/popups/new");
}

export async function savePopup(
  input: z.input<typeof popupInputSchema>,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);
    const parsed = popupInputSchema.parse(input);

    const trigger: PopupTrigger = {};
    if (parsed.type === "timed") {
      trigger.delaySeconds = parsed.delaySeconds ?? 5;
    } else if (parsed.type === "scroll-percentage") {
      trigger.scrollPercent = parsed.scrollPercent ?? 60;
    } else if (parsed.type === "slide-in") {
      if (parsed.delaySeconds != null) {
        trigger.delaySeconds = parsed.delaySeconds;
      }
      if (parsed.scrollPercent != null) {
        trigger.scrollPercent = parsed.scrollPercent;
      }
      if (trigger.delaySeconds == null && trigger.scrollPercent == null) {
        trigger.scrollPercent = 60;
      }
    }

    const audience: PopupAudience = {
      pages: parsed.pages,
      devices: parsed.devices,
    };

    const content: PopupContent = {
      heading: parsed.heading,
      body: parsed.body,
      imageUrl: parsed.imageUrl?.trim() || undefined,
      ctaLabel: parsed.ctaLabel?.trim() || undefined,
      ctaHref: parsed.ctaHref?.trim() || undefined,
      formEnabled: parsed.formEnabled,
      formSource:
        parsed.formSource?.trim() ||
        (parsed.formEnabled ? `popup:${parsed.name}` : undefined),
    };

    const values = {
      name: parsed.name,
      status: parsed.status,
      type: parsed.type,
      trigger,
      audience,
      frequency: parsed.frequency,
      priority: parsed.priority,
      content,
      displayFrom: parseOptionalDate(parsed.displayFrom),
      displayUntil: parseOptionalDate(parsed.displayUntil),
    };

    if (parsed.id) {
      const [existing] = await getDb()
        .select({ id: popups.id })
        .from(popups)
        .where(eq(popups.id, parsed.id))
        .limit(1);

      if (!existing) {
        return { success: false, error: "Popup not found" };
      }

      await getDb().update(popups).set(values).where(eq(popups.id, parsed.id));

      revalidatePopups();
      revalidatePath(`/admin/popups/${parsed.id}`);

      await audit({
        action: "update",
        entityType: "popup",
        entityId: parsed.id,
        meta: { status: parsed.status, type: parsed.type },
      });

      return { success: true, id: parsed.id };
    }

    const [created] = await getDb()
      .insert(popups)
      .values(values)
      .returning({ id: popups.id });

    revalidatePopups();
    revalidatePath(`/admin/popups/${created.id}`);

    await audit({
      action: "create",
      entityType: "popup",
      entityId: created.id,
      meta: { status: parsed.status, type: parsed.type },
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

    return { success: false, error: "Failed to save popup" };
  }
}

export async function togglePopupStatus(
  id: string,
  status: "active" | "paused",
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    const parsedStatus = popupStatusSchema.parse(status);
    const parsedId = z.string().uuid().parse(id);

    const [existing] = await getDb()
      .select({ id: popups.id })
      .from(popups)
      .where(eq(popups.id, parsedId))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Popup not found" };
    }

    await getDb()
      .update(popups)
      .set({ status: parsedStatus })
      .where(eq(popups.id, parsedId));

    revalidatePopups();
    revalidatePath(`/admin/popups/${parsedId}`);

    await audit({
      action: "update",
      entityType: "popup",
      entityId: parsedId,
      meta: { status: parsedStatus },
    });

    return { success: true, id: parsedId };
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

    return { success: false, error: "Failed to update popup status" };
  }
}

export async function deletePopup(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireContentManager(session);

    const parsedId = z.string().uuid().parse(id);

    const [existing] = await getDb()
      .select({ id: popups.id })
      .from(popups)
      .where(eq(popups.id, parsedId))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Popup not found" };
    }

    await getDb().delete(popups).where(eq(popups.id, parsedId));

    revalidatePopups();

    await audit({
      action: "delete",
      entityType: "popup",
      entityId: parsedId,
    });

    return { success: true, id: parsedId };
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

    return { success: false, error: "Failed to delete popup" };
  }
}
