/**
 * Re-check every media row: HEAD/GET the stored URL, report broken ones,
 * and try to repair R2 keys whose public base URL drifted.
 *
 * Run: npx tsx scripts/repair-media.ts
 * Optional: --fix to write repaired URLs back to the DB.
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

for (const file of [".env.local", ".env.production", ".env"]) {
  const path = resolve(process.cwd(), file);
  if (existsSync(path)) {
    config({ path, quiet: true });
  }
}

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

const shouldFix = process.argv.includes("--fix");

async function probe(url: string): Promise<{ ok: boolean; status: number | null }> {
  try {
    const head = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (head.ok) return { ok: true, status: head.status };

    const get = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      redirect: "follow",
    });
    return { ok: get.ok || get.status === 206, status: get.status };
  } catch {
    return { ok: false, status: null };
  }
}

function candidateUrls(url: string, publicBase: string): string[] {
  const out = new Set<string>([url]);
  const base = publicBase.replace(/\/+$/, "");

  try {
    const parsed = new URL(url);
    const key = parsed.pathname.replace(/^\/+/, "");
    if (key) {
      out.add(`${base}/${key}`);
      if (key.startsWith("media/")) {
        out.add(`${base}/${key}`);
      } else {
        out.add(`${base}/media/${key}`);
      }
    }
  } catch {
    /* ignore */
  }

  return [...out];
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const publicBase = process.env.R2_PUBLIC_URL?.trim().replace(/\/+$/, "");

  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }
  if (!publicBase) {
    console.error("R2_PUBLIC_URL is required");
    process.exit(1);
  }

  const db = drizzle(neon(databaseUrl), { schema });
  const rows = await db
    .select({
      id: schema.media.id,
      url: schema.media.url,
      alt: schema.media.alt,
      filename: schema.media.filename,
    })
    .from(schema.media);

  console.log(`Checking ${rows.length} media rows (fix=${shouldFix})…\n`);

  let okCount = 0;
  let brokenCount = 0;
  let fixedCount = 0;

  for (const row of rows) {
    const label = row.filename || row.alt || row.id;
    const primary = await probe(row.url);

    if (primary.ok) {
      okCount += 1;
      console.log(`OK   ${label}`);
      console.log(`     ${row.url}`);
      continue;
    }

    brokenCount += 1;
    console.log(`FAIL ${label} (status=${primary.status ?? "error"})`);
    console.log(`     ${row.url}`);

    let repaired: string | null = null;
    for (const candidate of candidateUrls(row.url, publicBase)) {
      if (candidate === row.url) continue;
      const result = await probe(candidate);
      if (result.ok) {
        repaired = candidate;
        break;
      }
    }

    if (repaired) {
      console.log(`     → candidate OK: ${repaired}`);
      if (shouldFix) {
        await db
          .update(schema.media)
          .set({ url: repaired })
          .where(eq(schema.media.id, row.id));
        fixedCount += 1;
        console.log(`     → updated DB row`);
      } else {
        console.log(`     → run with --fix to update this row`);
      }
    } else {
      console.log(`     → no working candidate under ${publicBase}`);
    }
  }

  console.log(
    `\nDone. ok=${okCount} broken=${brokenCount} fixed=${fixedCount}`,
  );
  process.exit(brokenCount > 0 && fixedCount === 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
