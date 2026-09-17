import { getDb } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";

let cache: boolean | null = null;
let cachedAt = 0;

const TTL_MS = 60_000; // 60s — was 15s; reduces Neon stampedes after restarts

export async function getCachedMaintenanceMode(): Promise<boolean> {
  const now = Date.now();
  if (cache !== null && now - cachedAt < TTL_MS) {
    return cache;
  }

  try {
    const [row] = await getDb()
      .select({ maintenanceMode: siteSettings.maintenanceMode })
      .from(siteSettings)
      .limit(1);
    cache = Boolean(row?.maintenanceMode);
    cachedAt = now;
    return cache;
  } catch {
    return cache ?? false;
  }
}

export function clearMaintenanceCache(): void {
  cache = null;
  cachedAt = 0;
}
