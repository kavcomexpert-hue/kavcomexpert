"use server";

import { beginAdminMutation, RateLimitedError } from "@/lib/admin/mutation-guard";
import { requireRole } from "@/lib/authz";
import { getDb } from "@/lib/db";
import { redirects } from "@/lib/db/schema";
import { clearRedirectCache } from "@/lib/redirects/middleware-cache";
import { eq, ne } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

const redirectInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    fromPath: z.string().trim().min(1),
    toPath: z.string().trim().min(1),
    permanent: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (!data.fromPath.startsWith("/")) {
      ctx.addIssue({
        code: "custom",
        message: "From path must start with /",
        path: ["fromPath"],
      });
    }

    if (data.fromPath === data.toPath) {
      ctx.addIssue({
        code: "custom",
        message: "From and to paths must be different",
        path: ["toPath"],
      });
    }
  });

type ActionResult =
  | { success: true; id: string; warning?: string }
  | { success: false; error: string };

function revalidateRedirects() {
  clearRedirectCache();
  revalidateTag("redirects", "max");
  revalidatePath("/admin/redirects");
}

async function findChainWarning(
  toPath: string,
  excludeId?: string,
): Promise<string | undefined> {
  const rows = excludeId
    ? await getDb()
        .select({ fromPath: redirects.fromPath })
        .from(redirects)
        .where(ne(redirects.id, excludeId))
    : await getDb().select({ fromPath: redirects.fromPath }).from(redirects);

  const match = rows.find((row) => row.fromPath === toPath);
  if (!match) return undefined;
  return `Warning: ${toPath} is also a redirect source. This may create a redirect chain.`;
}

export async function saveRedirect(
  input: z.input<typeof redirectInputSchema>,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireRole(session, ["admin"]);
    const parsed = redirectInputSchema.parse(input);

    const values = {
      fromPath: parsed.fromPath,
      toPath: parsed.toPath,
      permanent: parsed.permanent,
    };

    const warning = await findChainWarning(parsed.toPath, parsed.id);

    if (parsed.id) {
      const [existing] = await getDb()
        .select({ id: redirects.id })
        .from(redirects)
        .where(eq(redirects.id, parsed.id))
        .limit(1);

      if (!existing) {
        return { success: false, error: "Redirect not found" };
      }

      await getDb()
        .update(redirects)
        .set(values)
        .where(eq(redirects.id, parsed.id));

      revalidateRedirects();

      await audit({
        action: "update",
        entityType: "redirect",
        entityId: parsed.id,
        meta: { fromPath: parsed.fromPath, toPath: parsed.toPath, warning },
      });

      return { success: true, id: parsed.id, warning };
    }

    const [created] = await getDb()
      .insert(redirects)
      .values(values)
      .returning({ id: redirects.id });

    revalidateRedirects();

    await audit({
      action: "create",
      entityType: "redirect",
      entityId: created.id,
      meta: { fromPath: parsed.fromPath, toPath: parsed.toPath, warning },
    });

    return { success: true, id: created.id, warning };
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

    if (error instanceof Error && error.message === "Forbidden") {
      return { success: false, error: "Forbidden" };
    }

    if (
      error instanceof Error &&
      error.message.includes("unique constraint")
    ) {
      return { success: false, error: "That from path is already in use" };
    }

    return { success: false, error: "Failed to save redirect" };
  }
}

export async function deleteRedirect(id: string): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireRole(session, ["admin"]);

    await getDb().delete(redirects).where(eq(redirects.id, id));
    revalidateRedirects();

    await audit({
      action: "delete",
      entityType: "redirect",
      entityId: id,
    });

    return { success: true, id };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }

    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return { success: false, error: error.message };
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return { success: false, error: "Forbidden" };
    }

    return { success: false, error: "Failed to delete redirect" };
  }
}
