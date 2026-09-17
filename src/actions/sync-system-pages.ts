"use server";

import { beginAdminMutation, RateLimitedError } from "@/lib/admin/mutation-guard";
import { requireContentManager } from "@/lib/authz";
import { ensureSystemPages } from "@/lib/pages/sync-system-pages";

export type SyncSystemPagesResult =
  | { success: true; created: number; published: number }
  | { success: false; error: string };

export async function syncSystemPagesAction(): Promise<SyncSystemPagesResult> {
  try {
    const { session } = await beginAdminMutation();
    requireContentManager(session);
    const result = await ensureSystemPages();
    return { success: true, ...result };
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
    return { success: false, error: "Failed to sync system pages" };
  }
}
