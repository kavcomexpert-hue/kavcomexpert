import { getFeedPosts } from "@/lib/queries/posts";
import { blogIndexPath, postPath } from "@/lib/paths";
import { postToMarkdown } from "@/lib/posts/markdown";
import { absoluteUrl, SITE_URL } from "@/lib/seo/constants";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  let posts: Awaited<ReturnType<typeof getFeedPosts>> = [];
  try {
    posts = await getFeedPosts();
  } catch (error) {
    console.warn("[feed] GET failed; returning empty channel.", error);
  }

  const items = posts
    .map((post) => {
      const link = absoluteUrl(postPath(post.slug));
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt).toUTCString()
        : new Date().toUTCString();
      const content = postToMarkdown(post);

      return `<item>
<title>${escapeXml(post.title)}</title>
<link>${link}</link>
<guid isPermaLink="true">${link}</guid>
<pubDate>${pubDate}</pubDate>
<description>${escapeXml(post.tldr ?? post.excerpt ?? post.metaDescription)}</description>
<content:encoded><![CDATA[${content}]]></content:encoded>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
<title>Kavcom Expert Blog</title>
<link>${SITE_URL}${blogIndexPath}</link>
<description>SEO, web development, and AEO insights for professional services firms.</description>
<language>en-us</language>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
