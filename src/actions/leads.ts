"use server";

import { beginAdminMutation, RateLimitedError } from "@/lib/admin/mutation-guard";
import { requireRole } from "@/lib/authz";
import { getDb } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const leadStatusSchema = z.enum(["new", "contacted", "closed"]);

type ActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

function escapeCsv(value: string | null | undefined): string {
  const text = value ?? "";
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function updateLeadStatus(
  id: string,
  status: z.input<typeof leadStatusSchema>,
): Promise<ActionResult> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireRole(session, ["admin", "editor"]);
    const parsedId = z.string().uuid().parse(id);
    const parsedStatus = leadStatusSchema.parse(status);

    const [existing] = await getDb()
      .select({ id: leads.id })
      .from(leads)
      .where(eq(leads.id, parsedId))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Lead not found" };
    }

    await getDb()
      .update(leads)
      .set({ status: parsedStatus })
      .where(eq(leads.id, parsedId));

    await audit({
      action: "update",
      entityType: "lead",
      entityId: parsedId,
      meta: { status: parsedStatus },
    });

    revalidatePath("/admin/leads");
    return { success: true, id: parsedId };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Invalid status",
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
    return { success: false, error: "Failed to update lead status" };
  }
}

export async function exportLeadsCsv(): Promise<
  { success: true; csv: string; filename: string } | { success: false; error: string }
> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireRole(session, ["admin"]);

    const rows = await getDb()
      .select()
      .from(leads)
      .orderBy(desc(leads.createdAt));

    const header = [
      "Name",
      "Email",
      "Company",
      "Source",
      "Path",
      "Status",
      "Message",
      "Created At",
    ];
    const lines = rows.map((row) =>
      [
        escapeCsv(row.name),
        escapeCsv(row.email),
        escapeCsv(row.company),
        escapeCsv(row.source),
        escapeCsv(row.path),
        escapeCsv(row.status),
        escapeCsv(row.message),
        escapeCsv(row.createdAt?.toISOString() ?? ""),
      ].join(","),
    );

    const csv = [header.join(","), ...lines].join("\n");
    const filename = `leads-${new Date().toISOString().slice(0, 10)}.csv`;

    await audit({
      action: "export",
      entityType: "lead",
      meta: { count: rows.length, filename },
    });

    return { success: true, csv, filename };
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

    return { success: false, error: "Failed to export leads" };
  }
}

export async function deleteLead(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireRole(session, ["admin", "editor"]);
    const parsedId = z.string().uuid().parse(id);

    const [existing] = await getDb()
      .select({
        id: leads.id,
        email: leads.email,
        source: leads.source,
      })
      .from(leads)
      .where(eq(leads.id, parsedId))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Lead not found" };
    }

    await getDb().delete(leads).where(eq(leads.id, parsedId));

    await audit({
      action: "delete",
      entityType: "lead",
      entityId: parsedId,
      meta: { email: existing.email, source: existing.source },
    });

    revalidatePath("/admin/leads");
    return { success: true };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Invalid lead id",
      };
    }
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete lead" };
  }
}

export async function deleteLeads(
  ids: string[],
): Promise<
  { success: true; count: number } | { success: false; error: string }
> {
  try {
    const { audit, session } = await beginAdminMutation();
    requireRole(session, ["admin", "editor"]);
    const parsedIds = z.array(z.string().uuid()).min(1).parse(ids);

    const existing = await getDb()
      .select({
        id: leads.id,
        email: leads.email,
        source: leads.source,
      })
      .from(leads)
      .where(inArray(leads.id, parsedIds));

    if (existing.length === 0) {
      return { success: false, error: "No matching leads found" };
    }

    const deleteIds = existing.map((row) => row.id);
    await getDb().delete(leads).where(inArray(leads.id, deleteIds));

    await audit({
      action: "delete",
      entityType: "lead",
      meta: {
        count: deleteIds.length,
        ids: deleteIds,
        emails: existing.map((row) => row.email),
      },
    });

    revalidatePath("/admin/leads");
    return { success: true, count: deleteIds.length };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message ?? "Invalid lead ids",
      };
    }
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete leads" };
  }
}
