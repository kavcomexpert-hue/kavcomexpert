/**
 * Import WordPress WXR export into posts table.
 *
 * Usage: npx tsx scripts/import-wordpress.ts
 *
 * - Keeps post slugs unchanged
 * - Imports categories (primary) + tags
 * - Downloads images into public/blog-media and rewrites URLs
 */

import { createHash } from "crypto";
import { config } from "dotenv";
import { mkdir, writeFile, access } from "fs/promises";
import path from "path";
import { eq } from "drizzle-orm";
import { extractPlainText, htmlToTiptap } from "./html-to-tiptap";

config({ path: ".env.local" });

const XML_PATH = path.resolve(
  process.cwd(),
  "kavcomexpert.WordPress.2026-07-10.xml",
);
const MEDIA_DIR = path.resolve(process.cwd(), "public/blog-media");
const MEDIA_PUBLIC_PREFIX = "/blog-media";
const CONCURRENCY = 6;

type WpCategory = { domain: string; nicename: string; name: string };
type WpAttachment = { id: string; url: string; title: string };
type WpPost = {
  id: string;
  title: string;
  slug: string;
  status: string;
  dateGmt: string;
  excerpt: string;
  content: string;
  categories: WpCategory[];
  tags: WpCategory[];
  thumbnailId: string | null;
};

function cdata(block: string, tag: string): string {
  const re = new RegExp(
    `<${tag}(?:\\s[^>]*)?><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
  );
  const m = block.match(re);
  return (m?.[1] ?? m?.[2] ?? "").trim();
}

function metaValue(block: string, key: string): string | null {
  const re = new RegExp(
    `<wp:meta_key><!\\[CDATA\\[${key}\\]\\]><\\/wp:meta_key>\\s*<wp:meta_value><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/wp:meta_value>`,
  );
  const m = block.match(re);
  return m?.[1] ?? null;
}

function parseCategories(block: string): WpCategory[] {
  const results: WpCategory[] = [];
  const re =
    /<category\s+domain="([^"]+)"\s+nicename="([^"]+)"[^>]*><!\[CDATA\[(.*?)\]\]><\/category>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    results.push({
      domain: m[1],
      nicename: m[2],
      name: m[3],
    });
  }
  return results;
}

function parseItems(xml: string): { posts: WpPost[]; attachments: WpAttachment[] } {
  const chunks = xml.split("<item>").slice(1);
  const posts: WpPost[] = [];
  const attachments: WpAttachment[] = [];

  for (const chunk of chunks) {
    const type = cdata(chunk, "wp:post_type");
    const id = cdata(chunk, "wp:post_id");

    if (type === "attachment") {
      attachments.push({
        id,
        url: cdata(chunk, "wp:attachment_url"),
        title: cdata(chunk, "title"),
      });
      continue;
    }

    if (type !== "post") {
      continue;
    }

    const allCats = parseCategories(chunk);
    posts.push({
      id,
      title: cdata(chunk, "title"),
      slug: cdata(chunk, "wp:post_name"),
      status: cdata(chunk, "wp:status"),
      dateGmt: cdata(chunk, "wp:post_date_gmt"),
      excerpt: cdata(chunk, "excerpt:encoded"),
      content: cdata(chunk, "content:encoded"),
      categories: allCats.filter((c) => c.domain === "category"),
      tags: allCats.filter((c) => c.domain === "post_tag"),
      thumbnailId: metaValue(chunk, "_thumbnail_id"),
    });
  }

  return { posts, attachments };
}

function extensionFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"].includes(ext)) {
      return ext === ".jpeg" ? ".jpg" : ext;
    }
  } catch {
    /* ignore */
  }
  return ".jpg";
}

function localNameForUrl(url: string): string {
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 16);
  const base = path
    .basename(new URL(url).pathname)
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 80);
  const ext = extensionFromUrl(url);
  const stem = base.replace(/\.[^.]+$/, "") || "image";
  return `${stem}-${hash}${ext}`;
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function downloadImage(
  url: string,
  cache: Map<string, string>,
): Promise<string | null> {
  if (!url || !url.startsWith("http")) {
    return url?.startsWith("/") ? url : null;
  }

  if (cache.has(url)) {
    return cache.get(url)!;
  }

  // Prefer original size over -scaled / size variants when possible
  const normalized = url.replace(/-\d+x\d+(?=\.(jpe?g|png|gif|webp))/i, "");

  const filename = localNameForUrl(normalized);
  const dest = path.join(MEDIA_DIR, filename);
  const publicPath = `${MEDIA_PUBLIC_PREFIX}/${filename}`;

  if (await fileExists(dest)) {
    cache.set(url, publicPath);
    cache.set(normalized, publicPath);
    return publicPath;
  }

  const candidates = [normalized, url].filter(
    (value, index, arr) => arr.indexOf(value) === index,
  );

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, {
        headers: { "User-Agent": "KavcomImport/1.0" },
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) {
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 100) {
        continue;
      }
      await writeFile(dest, buffer);
      cache.set(url, publicPath);
      cache.set(normalized, publicPath);
      cache.set(candidate, publicPath);
      return publicPath;
    } catch {
      /* try next */
    }
  }

  console.warn(`  ! failed image: ${url}`);
  cache.set(url, url);
  return url;
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

function collectContentImageUrls(html: string): string[] {
  const urls = new Set<string>();
  const re = /https?:\/\/[^"'>\s]+?\.(?:jpe?g|png|gif|webp|avif)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    urls.add(m[0].replace(/&amp;/g, "&"));
  }
  return [...urls];
}

function rewriteUrls(html: string, urlMap: Map<string, string>): string {
  let out = html;
  const entries = [...urlMap.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of entries) {
    if (from === to) continue;
    out = out.split(from).join(to);
  }
  return out;
}

function takeawaysFromText(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40);

  const picks = sentences.slice(0, 3);
  while (picks.length < 3) {
    picks.push(
      [
        "Practical guidance you can apply to your website and growth strategy.",
        "Clear steps that help teams move from idea to measurable results.",
        "Insights grounded in real client work across the US and Canada.",
      ][picks.length],
    );
  }
  return picks.map((s) => (s.length > 160 ? `${s.slice(0, 157)}…` : s));
}

function truncate(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

async function main() {
  const { readFile } = await import("fs/promises");
  const xml = await readFile(XML_PATH, "utf8");
  const { posts, attachments } = parseItems(xml);
  const published = posts.filter((p) => p.status === "publish" && p.slug);

  console.log(
    `Parsed ${posts.length} posts, ${attachments.length} attachments (${published.length} published)`,
  );

  await mkdir(MEDIA_DIR, { recursive: true });

  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL!);
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags jsonb`;

  const { db } = await import("../src/lib/db/index");
  const { posts: postsTable, media } = await import("../src/lib/db/schema");
  const { computeReadingMinutes } = await import("../src/lib/posts/constants");

  const attachmentById = new Map(
    attachments.map((a) => [a.id, a] as const),
  );
  const urlCache = new Map<string, string>();

  console.log("Downloading attachment images…");
  await mapPool(attachments, CONCURRENCY, async (att, index) => {
    if (!att.url) return;
    await downloadImage(att.url, urlCache);
    if ((index + 1) % 25 === 0 || index + 1 === attachments.length) {
      console.log(`  attachments ${index + 1}/${attachments.length}`);
    }
  });

  let imported = 0;
  let updated = 0;

  for (const [index, post] of published.entries()) {
    const contentUrls = collectContentImageUrls(post.content);
    await mapPool(contentUrls, CONCURRENCY, async (url) => {
      await downloadImage(url, urlCache);
    });

    let coverImage: string | null = null;
    if (post.thumbnailId && attachmentById.has(post.thumbnailId)) {
      const thumbUrl = attachmentById.get(post.thumbnailId)!.url;
      coverImage = await downloadImage(thumbUrl, urlCache);
    }

    // Fallback: first content image
    if (!coverImage && contentUrls[0]) {
      coverImage = urlCache.get(contentUrls[0]) ?? contentUrls[0];
    }

    const rewrittenHtml = rewriteUrls(post.content, urlCache);
    const content = htmlToTiptap(rewrittenHtml);
    const plain = extractPlainText(post.content);
    const excerpt =
      stripExcerpt(post.excerpt) || truncate(plain, 220) || null;
    const category =
      post.categories.find((c) => c.nicename !== "uncategorized")?.nicename ??
      post.categories[0]?.nicename ??
      null;
    const tags = post.tags.map((t) => t.name);
    const readingMinutes = computeReadingMinutes(content);
    const metaTitle = truncate(post.title, 70);
    const metaDescription = truncate(
      excerpt || plain || post.title,
      170,
    );
    const tldr = truncate(excerpt || plain || post.title, 280);
    const keyTakeaways = takeawaysFromText(plain);
    const publishedAt = post.dateGmt
      ? new Date(`${post.dateGmt.replace(" ", "T")}Z`)
      : new Date();

    const values = {
      slug: post.slug,
      title: post.title,
      excerpt,
      content,
      coverImage,
      category,
      tags,
      status: "published" as const,
      publishedAt,
      updatedAt: new Date(),
      readingMinutes,
      focusKeyword: tags[0] ?? category ?? undefined,
      tldr,
      keyTakeaways,
      postFaqs: [] as { q: string; a: string }[],
      metaTitle,
      metaDescription,
      canonicalUrl: null as string | null,
      ogImage: coverImage,
      schemaType: "BlogPosting",
      noIndex: false,
    };

    const [existing] = await db
      .select({ id: postsTable.id })
      .from(postsTable)
      .where(eq(postsTable.slug, post.slug))
      .limit(1);

    if (existing) {
      await db
        .update(postsTable)
        .set(values)
        .where(eq(postsTable.id, existing.id));
      updated += 1;
    } else {
      await db.insert(postsTable).values(values);
      imported += 1;
    }

    if (coverImage?.startsWith(MEDIA_PUBLIC_PREFIX)) {
      const [existingMedia] = await db
        .select({ id: media.id })
        .from(media)
        .where(eq(media.url, coverImage))
        .limit(1);
      if (!existingMedia) {
        await db.insert(media).values({
          url: coverImage,
          alt: post.title,
          width: 1200,
          height: 675,
        });
      }
    }

    if ((index + 1) % 10 === 0 || index + 1 === published.length) {
      console.log(
        `  posts ${index + 1}/${published.length} (+${imported} new, ~${updated} updated)`,
      );
    }
  }

  console.log(`Done. Inserted ${imported}, updated ${updated}.`);
}

function stripExcerpt(html: string): string {
  return extractPlainText(html);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
