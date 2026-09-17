import { getDb } from "@/lib/db";
import {
  caseStudies,
  contentBlocks,
  jobApplications,
  jobs,
  leads,
  media,
  menus,
  pages,
  popups,
  posts,
  redirects,
  services,
  siteSettings,
  testimonials,
} from "@/lib/db/schema";

function jsonChunk(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v instanceof Date ? v.toISOString() : v,
  );
}

/**
 * Build a streaming JSON export of all CMS content tables.
 * Caller must already have verified admin auth.
 */
export async function createContentExportStream(): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const exportedAt = new Date().toISOString();

  return new ReadableStream({
    async start(controller) {
      const write = (chunk: string) => {
        controller.enqueue(encoder.encode(chunk));
      };

      try {
        write(`{"exportedAt":${jsonChunk(exportedAt)},"tables":{`);

        const tables: Array<{
          key: string;
          fetch: () => Promise<unknown[]>;
        }> = [
          { key: "posts", fetch: () => getDb().select().from(posts) },
          { key: "pages", fetch: () => getDb().select().from(pages) },
          { key: "services", fetch: () => getDb().select().from(services) },
          {
            key: "caseStudies",
            fetch: () => getDb().select().from(caseStudies),
          },
          {
            key: "testimonials",
            fetch: () => getDb().select().from(testimonials),
          },
          { key: "media", fetch: () => getDb().select().from(media) },
          { key: "menus", fetch: () => getDb().select().from(menus) },
          {
            key: "settings",
            fetch: () => getDb().select().from(siteSettings),
          },
          { key: "redirects", fetch: () => getDb().select().from(redirects) },
          { key: "forms", fetch: () => getDb().select().from(leads) },
          {
            key: "jobApplications",
            fetch: () => getDb().select().from(jobApplications),
          },
          { key: "jobs", fetch: () => getDb().select().from(jobs) },
          { key: "popups", fetch: () => getDb().select().from(popups) },
          {
            key: "contentBlocks",
            fetch: () => getDb().select().from(contentBlocks),
          },
        ];

        for (let i = 0; i < tables.length; i += 1) {
          const table = tables[i];
          if (i > 0) write(",");
          write(`${jsonChunk(table.key)}:`);
          const rows = await table.fetch();
          write(jsonChunk(rows));
        }

        write("}}");
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

export function contentExportFilename(date = new Date()): string {
  const stamp = date
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
  return `kavcom-content-export-${stamp}.json`;
}
