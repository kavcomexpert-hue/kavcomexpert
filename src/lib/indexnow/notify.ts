import { SITE_URL } from "@/lib/seo/constants";

export type IndexNowResult = {
  attempted: boolean;
  ok: boolean;
  status?: number;
  error?: string;
  skipped?: "no_key" | "invalid_url";
  keyLocation?: string;
};

/**
 * Resolve IndexNow key: site settings first, then env.
 * Never throws.
 */
export async function resolveIndexNowKey(): Promise<string | undefined> {
  try {
    const { getSiteSettings } = await import("@/lib/queries/site-settings");
    const settings = await getSiteSettings();
    const fromSettings = settings.indexNowKey?.trim();
    if (fromSettings) {
      return fromSettings;
    }
  } catch {
    // Fall through to env.
  }

  const fromEnv = process.env.INDEXNOW_KEY?.trim();
  return fromEnv || undefined;
}

/**
 * POST to IndexNow. Never throws. Safe to await after a successful save
 * so the outcome can be stored in audit meta without failing the mutation.
 */
export async function notifyIndexNow(url: string): Promise<IndexNowResult> {
  try {
    const key = await resolveIndexNowKey();

    if (!key) {
      return { attempted: false, ok: false, skipped: "no_key" };
    }

    let host: string;
    try {
      host = new URL(SITE_URL).hostname;
      new URL(url);
    } catch {
      return { attempted: false, ok: false, skipped: "invalid_url" };
    }

    const keyLocation = `${SITE_URL.replace(/\/$/, "")}/${key}.txt`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host,
          key,
          keyLocation,
          urlList: [url],
        }),
        signal: controller.signal,
      });

      return {
        attempted: true,
        ok: response.ok || response.status === 202,
        status: response.status,
        keyLocation,
      };
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    return {
      attempted: true,
      ok: false,
      error: error instanceof Error ? error.message : "IndexNow request failed",
    };
  }
}

/** Fire-and-forget wrapper for scheduled sweeps (no audit context). */
export function notifyIndexNowBackground(url: string): void {
  void notifyIndexNow(url);
}
