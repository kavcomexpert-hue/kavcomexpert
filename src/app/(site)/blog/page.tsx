import { BlogArticleCard, BlogPagination } from "@/components/site/blog/blog-cards";
import { BlogHero } from "@/components/site/blog/blog-hero";
import { BlogNewsletterSection } from "@/components/site/blog/blog-newsletter-section";
import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import { HomeCtaSection } from "@/components/site/home/home-cta-section";
import { BLOG_PAGE_SIZE } from "@/lib/posts/constants";
import {
  getBlogPageSections,
  systemPageMetadata,
} from "@/lib/pages/system-page-content";
import {
  getPublishedCategories,
  getPublishedPostsPage,
} from "@/lib/queries/posts";
import { getTurnstileSiteKey } from "@/lib/security/turnstile-config";
import { buildStaticMetaFromKey } from "@/lib/seo/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return systemPageMetadata("blog", "/blog", () => buildStaticMetaFromKey("blog"));
}

type BlogIndexPageProps = {
  searchParams: Promise<{ category?: string; page?: string; q?: string }>;
};

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const params = await searchParams;
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const searchQuery = params.q?.trim() || undefined;
  const turnstileSiteKey = getTurnstileSiteKey();
  const [categories, blogSections] = await Promise.all([
    getPublishedCategories(),
    getBlogPageSections(),
  ]);
  const activeCategory =
    params.category &&
    categories.some((item) => item.value === params.category)
      ? params.category
      : undefined;

  const { posts, total, page, totalPages } = await getPublishedPostsPage(
    requestedPage,
    BLOG_PAGE_SIZE,
    activeCategory,
    searchQuery,
  );

  // 2 featured on top, then remaining (up to 9) in the service-style grid
  const largePosts = posts.slice(0, 2);
  const gridPosts = posts.slice(2);

  return (
    <>
      <BlogHero
        categories={categories}
        activeCategory={activeCategory}
        searchQuery={searchQuery}
        total={total}
        eyebrow={blogSections.heroEyebrow}
        headline={blogSections.heroHeadline}
        subtext={blogSections.heroSubtext}
        searchLabel={blogSections.searchLabel}
        searchPlaceholder={blogSections.searchPlaceholder}
        searchButton={blogSections.searchButton}
        allCategoryLabel={blogSections.allCategoryLabel}
      />

      <section className="bg-background py-14 md:py-20">
        <div className="mx-auto max-w-[1120px] px-6">
          {posts.length === 0 ? (
            <p className="rounded-default border border-border bg-surface p-8 text-center text-sm text-muted">
              No published posts match your filters.
            </p>
          ) : (
            <>
              {largePosts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 md:gap-5">
                  {largePosts.map((post, index) => (
                    <BlurReveal key={post.id} delay={index * 0.06} className="h-full">
                      <BlogArticleCard post={post} size="large" index={index} />
                    </BlurReveal>
                  ))}
                </div>
              ) : null}

              {gridPosts.length > 0 ? (
                <div
                  className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
                    largePosts.length > 0 ? "mt-4 md:mt-5" : ""
                  }`}
                >
                  {gridPosts.map((post, index) => (
                    <BlurReveal
                      key={post.id}
                      delay={Math.min(index * 0.05, 0.3)}
                      className="h-full"
                    >
                      <BlogArticleCard
                        post={post}
                        index={largePosts.length + index}
                      />
                    </BlurReveal>
                  ))}
                </div>
              ) : null}

              <BlogPagination
                page={page}
                totalPages={totalPages}
                category={activeCategory}
                query={searchQuery}
              />
            </>
          )}
        </div>
      </section>

      <BlogNewsletterSection
        eyebrow={blogSections.newsletterEyebrow}
        headline={blogSections.newsletterHeadline}
        body={blogSections.newsletterBody}
        perk1={blogSections.newsletterPerk1}
        perk2={blogSections.newsletterPerk2}
        perk3={blogSections.newsletterPerk3}
        button={blogSections.newsletterButton}
        success={blogSections.newsletterSuccess}
        turnstileSiteKey={turnstileSiteKey}
      />
      <HomeCtaSection />
    </>
  );
}
