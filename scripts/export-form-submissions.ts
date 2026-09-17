import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

config({ path: ".env.local" });

async function exportForms() {
  const { db } = await import("../src/lib/db/index");
  const { sql } = await import("drizzle-orm");

  const tableExists = async (name: string) => {
    const res = await db.execute(
      sql`SELECT to_regclass(${`public.${name}`}) AS reg`,
    );
    return res.rows[0]?.reg !== null;
  };

  const forms = (await tableExists("forms"))
    ? await db.execute(sql`SELECT * FROM forms ORDER BY created_at`)
    : { rows: [] as Record<string, unknown>[] };
  const submissions = (await tableExists("form_submissions"))
    ? await db.execute(sql`SELECT * FROM form_submissions ORDER BY created_at`)
    : { rows: [] as Record<string, unknown>[] };

  const dir = join(process.cwd(), "exports");
  mkdirSync(dir, { recursive: true });

  const date = new Date().toISOString().slice(0, 10);
  const file = join(dir, `form-submissions-${date}.json`);
  writeFileSync(
    file,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        forms: forms.rows,
        submissions: submissions.rows,
      },
      null,
      2,
    ),
  );

  console.log(
    `Exported ${forms.rows.length} forms and ${submissions.rows.length} submissions to ${file}`,
  );
}

exportForms()
  .catch((error) => {
    console.error("Export failed:", error);
    process.exit(1);
  })
  .finally(() => process.exit(0));
