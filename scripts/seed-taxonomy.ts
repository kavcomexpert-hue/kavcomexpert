/**
 * Seed categories & tags tables from existing posts (WordPress import).
 * Usage: npx tsx scripts/seed-taxonomy.ts
 */

import { config } from "dotenv";
import { eq } from "drizzle-orm";

config({ path: ".env.local" });

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function humanize(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part, i) =>
      i === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part,
    )
    .join(" ");
}

async function main() {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL!);

  await sql`CREATE TABLE IF NOT EXISTS categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
  )`;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS social_title text`;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS social_description text`;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS no_follow boolean DEFAULT false`;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS no_archive boolean DEFAULT false`;
  await sql`ALTER TABLE media ADD COLUMN IF NOT EXISTS mime_type text`;
  await sql`ALTER TABLE media ADD COLUMN IF NOT EXISTS filename text`;
  await sql`ALTER TABLE media ADD COLUMN IF NOT EXISTS size_bytes integer`;

  const { db } = await import("../src/lib/db/index");
  const { posts, categories, tags, media } = await import(
    "../src/lib/db/schema"
  );

  const allPosts = await db
    .select({
      category: posts.category,
      tags: posts.tags,
      coverImage: posts.coverImage,
      title: posts.title,
    })
    .from(posts);

  const categoryMap = new Map<string, string>();
  const tagMap = new Map<string, string>();

  for (const post of allPosts) {
    if (post.category) {
      const slug = slugify(post.category);
      if (!categoryMap.has(slug)) {
        categoryMap.set(slug, humanize(post.category));
      }
    }

    for (const tag of post.tags ?? []) {
      const name = tag.trim();
      if (!name) continue;
      const slug = slugify(name);
      if (!tagMap.has(slug)) {
        tagMap.set(slug, name);
      }
    }
  }

  let cats = 0;
  for (const [slug, name] of categoryMap) {
    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    if (existing) continue;
    await db.insert(categories).values({ name, slug });
    cats += 1;
  }

  let tagCount = 0;
  for (const [slug, name] of tagMap) {
    const [existing] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1);
    if (existing) continue;
    await db.insert(tags).values({ name, slug });
    tagCount += 1;
  }

  // Register local blog-media covers in media library
  let mediaCount = 0;
  for (const post of allPosts) {
    const url = post.coverImage;
    if (!url?.startsWith("/blog-media/")) continue;
    const [existing] = await db
      .select({ id: media.id })
      .from(media)
      .where(eq(media.url, url))
      .limit(1);
    if (existing) continue;
    const filename = url.split("/").pop() ?? "image";
    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "gif"
            ? "image/gif"
            : ext === "avif"
              ? "image/avif"
              : "image/jpeg";
    await db.insert(media).values({
      url,
      alt: post.title,
      width: 1200,
      height: 675,
      mimeType: mime,
      filename,
    });
    mediaCount += 1;
  }

  console.log(
    `Seeded ${cats} categories, ${tagCount} tags, ${mediaCount} media rows.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
