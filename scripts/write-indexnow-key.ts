import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });

/**
 * Writes public/{key}.txt for local/dev deploys.
 * Production also serves the key via /api/indexnow-key rewrite to /{key}.txt
 * using settings.indexNowKey with INDEXNOW_KEY as fallback.
 */
async function main() {
  let key = process.env.INDEXNOW_KEY?.trim();

  if (!key) {
    try {
      const { db } = await import("../src/lib/db/index");
      const { siteSettings } = await import("../src/lib/db/schema");
      const [row] = await db.select().from(siteSettings).limit(1);
      key = row?.indexNowKey?.trim() || undefined;
    } catch {
      // DB optional for this script
    }
  }

  if (!key) {
    console.log(
      "No IndexNow key in INDEXNOW_KEY or site_settings — skipping key file.",
    );
    process.exit(0);
  }

  const publicDir = join(process.cwd(), "public");
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  const filePath = join(publicDir, `${key}.txt`);
  writeFileSync(filePath, key, "utf8");
  console.log(`IndexNow key file written to public/${key}.txt`);
}

void main();
