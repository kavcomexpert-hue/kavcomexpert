import { getPostBySlug, getPublishedPostSlugs } from "@/lib/queries/posts";
import { postToMarkdown } from "@/lib/posts/markdown";
import { notFound } from "next/navigation";

type MarkdownRouteProps = {
  params: Promise<{ slug: string }>;
};

/** Never prerender at build from DB — generate on demand. */
export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const posts = await getPublishedPostSlugs();
    return posts.map((post) => ({ slug: post.slug }));
  } catch (error) {
    console.warn(
      "[blog/md] generateStaticParams failed; building with zero paths.",
      error,
    );
    return [];
  }
}

export async function GET(
  _request: Request,
  { params }: MarkdownRouteProps,
) {
  try {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
      notFound();
    }

    const markdown = postToMarkdown(post);

    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.warn("[blog/md] GET failed.", error);
    return new Response("", {
      status: 503,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }
}
