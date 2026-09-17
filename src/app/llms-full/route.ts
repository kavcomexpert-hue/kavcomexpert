import { getPublishedPostsForLlms } from "@/lib/queries/posts";
import { absoluteUrl, SITE_URL } from "@/lib/seo/constants";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  let posts: Awaited<ReturnType<typeof getPublishedPostsForLlms>> = [];
  try {
    posts = await getPublishedPostsForLlms();
  } catch (error) {
    console.warn("[llms-full] GET failed; returning empty index.", error);
  }

  const lines = [
    "# Kavcom Expert — full post index for AI systems",
    "",
    `Site: ${SITE_URL}`,
    `RSS: ${absoluteUrl("/feed.xml")}`,
    `Overview: ${absoluteUrl("/llms.txt")}`,
    "",
    "Every published post URL with its TL;DR. Markdown mirrors: /blog/{slug}/md",
    "",
  ];

  for (const post of posts) {
    const summary =
      post.tldr?.trim() ||
      post.excerpt?.trim() ||
      post.metaDescription?.trim() ||
      "No TL;DR available.";

    lines.push(
      `## ${post.title}`,
      `- URL: ${absoluteUrl(`/blog/${post.slug}`)}`,
      `- Markdown: ${absoluteUrl(`/blog/${post.slug}/md`)}`,
      `- TL;DR: ${summary}`,
      "",
    );
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
