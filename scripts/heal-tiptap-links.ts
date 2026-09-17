/**
 * One-off: heal TipTap link marks that lost their href attrs (React Flight
 * used to strip null-prototype mark.attrs). When the linked text itself is a
 * URL, restore href from the text. Bare non-URL link marks are removed.
 *
 * Usage: npx tsx scripts/heal-tiptap-links.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { toPlainTiptapJson } from "../src/lib/tiptap/serialize";
import {
  caseStudies,
  jobs,
  pages,
  posts,
} from "../src/lib/db/schema";

async function main() {
  const { db } = await import("../src/lib/db/index");

  {
    const rows = await db.select({ id: posts.id, doc: posts.content }).from(posts);
    let updated = 0;
    for (const row of rows) {
      if (!JSON.stringify(row.doc).includes('"type":"link"')) continue;
      const healed = toPlainTiptapJson(row.doc);
      if (JSON.stringify(row.doc) === JSON.stringify(healed)) continue;
      await db.update(posts).set({ content: healed }).where(eq(posts.id, row.id));
      updated += 1;
    }
    console.log(`posts.content: healed ${updated}`);
  }

  {
    const rows = await db.select({ id: pages.id, doc: pages.content }).from(pages);
    let updated = 0;
    for (const row of rows) {
      if (!JSON.stringify(row.doc).includes('"type":"link"')) continue;
      const healed = toPlainTiptapJson(row.doc);
      if (JSON.stringify(row.doc) === JSON.stringify(healed)) continue;
      await db.update(pages).set({ content: healed }).where(eq(pages.id, row.id));
      updated += 1;
    }
    console.log(`pages.content: healed ${updated}`);
  }

  {
    const rows = await db
      .select({
        id: caseStudies.id,
        approach: caseStudies.approach,
        solution: caseStudies.solution,
        clientNoticed: caseStudies.clientNoticed,
      })
      .from(caseStudies);
    let updated = 0;
    for (const row of rows) {
      const approach = toPlainTiptapJson(row.approach);
      const solution = toPlainTiptapJson(row.solution);
      const clientNoticed = toPlainTiptapJson(row.clientNoticed);
      const changed =
        JSON.stringify(row.approach) !== JSON.stringify(approach) ||
        JSON.stringify(row.solution) !== JSON.stringify(solution) ||
        JSON.stringify(row.clientNoticed) !== JSON.stringify(clientNoticed);
      if (!changed) continue;
      await db
        .update(caseStudies)
        .set({ approach, solution, clientNoticed })
        .where(eq(caseStudies.id, row.id));
      updated += 1;
    }
    console.log(`case_studies: healed ${updated}`);
  }

  {
    const rows = await db
      .select({ id: jobs.id, doc: jobs.description })
      .from(jobs);
    let updated = 0;
    for (const row of rows) {
      if (!JSON.stringify(row.doc).includes('"type":"link"')) continue;
      const healed = toPlainTiptapJson(row.doc);
      if (JSON.stringify(row.doc) === JSON.stringify(healed)) continue;
      await db
        .update(jobs)
        .set({ description: healed })
        .where(eq(jobs.id, row.id));
      updated += 1;
    }
    console.log(`jobs.description: healed ${updated}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
