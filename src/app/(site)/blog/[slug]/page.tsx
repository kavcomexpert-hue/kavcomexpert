import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { BlogArticleCard } from "@/components/site/blog/blog-cards";
import { BlogNewsletterSection } from "@/components/site/blog/blog-newsletter-section";
import { PostSidebar } from "@/components/site/blog/post-sidebar";
import { ShareButtons } from "@/components/site/blog/share-buttons";
import { Ambient } from "@/components/site/home/motion/ambient";
import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import { FaqAccordion } from "@/components/site/faq-accordion";
import { PostTableOfContents } from "@/components/site/post-table-of-contents";
import { RichText } from "@/components/site/rich-text";
import { SectionErrorBoundary } from "@/components/site/section-error-boundary";
import { SITE_AUTHOR_NAME } from "@/lib/author/constants";
import { parseKeyTakeaways, parsePostFaqs, postFaqsToFaqItems } from "@/lib/posts/aeo";
import {
  createHeadingIdRegistry,
  extractHeadings,
} from "@/lib/posts/headings";
import { formatPostCategory } from "@/lib/posts/constants";
import { getBlogPageSections } from "@/lib/pages/system-page-content";
import { getPostBySlug,
  getPublishedCategories,
  getPublishedPostSlugs,
  getRecentPosts,
  getRelatedPosts,
} from "@/lib/queries/posts";
import { safePublicQuery } from "@/lib/queries/safe-fetch";
import { getPostCategorySlugs } from "@/lib/posts/sync-taxonomy";
import { resolvePostPreview } from "@/lib/preview/access";
import { getAllTags } from "@/lib/queries/taxonomy";
import { getSiteSettings } from "@/lib/queries/site-settings";
import { getTurnstileSiteKey } from "@/lib/security/turnstile-config";
import {
  buildBlogPostingSchema,
  buildDefaultPostOgImageUrl,
  buildPostFaqPageSchema,
} from "@/lib/schema/blog-posting";
import { buildBreadcrumbListSchema } from "@/lib/schema/breadcrumbs";
import { buildContentMetadataFromSettings } from "@/lib/seo/metadata";
import { SafeImage } from "@/components/site/safe-image";
import { SiteLinkButton } from "@/components/site/site-link-button";
import { absoluteUrl } from "@/lib/seo/constants";
import { getLinkButton } from "@/lib/queries/content-blocks";
import { blogIndexPath, categoryPath, postPath } from "@/lib/paths";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatPostDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return dateFormatter.format(date);
}

/** Allow on-demand generation when build-time DB is unavailable. */
export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const posts = await getPublishedPostSlugs();
    return posts.map((post) => ({ slug: post.slug }));
  } catch (error) {
    console.warn(
      "[blog] generateStaticParams failed; building with zero paths.",
      error,
    );
    return [];
  }
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const preview = await resolvePostPreview(slug);
  const post =
    preview ??
    (await safePublicQuery(`blog/${slug}`, () => getPostBySlug(slug)));

  if (!post) {
    return {};
  }

  const ogImage =
    post.ogImage ||
    buildDefaultPostOgImageUrl(
      post.title,
      formatPostCategory(post.category),
    );

  const socialTitle = post.socialTitle?.trim() || post.metaTitle;
  const socialDescription =
    post.socialDescription?.trim() || post.metaDescription;

  const metadata = await buildContentMetadataFromSettings({
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    canonicalUrl: post.canonicalUrl,
    path: postPath(post.slug),
    noIndex: post.noIndex,
    ogImage,
    coverImage: post.coverImage,
    openGraphType: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    alternateMarkdown: absoluteUrl(`${postPath(post.slug)}/md`),
  });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      title: socialTitle,
      description: socialDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: socialDescription,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: {
      index: !post.noIndex,
      follow: !(post.noFollow ?? false),
      nocache: Boolean(post.noArchive),
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const preview = await resolvePostPreview(slug);
  const turnstileSiteKey = getTurnstileSiteKey();
  const [published, settings, categories, recentPosts, allTags, newsletterSections, viewAllCta] =
    await Promise.all([
      preview
        ? Promise.resolve(null)
        : safePublicQuery(`blog/${slug}`, () => getPostBySlug(slug)),
      getSiteSettings(),
      getPublishedCategories().catch(() => []),
      getRecentPosts(5, slug).catch(() => []),
      getAllTags(),
      getBlogPageSections(),
      getLinkButton("blog.post.view_all"),
    ]);

  const post = preview ?? published;

  if (!post) {
    notFound();
  }

  const postCategories = await getPostCategorySlugs(post.id, post.category);
  const relatedPosts = postCategories[0]
    ? await getRelatedPosts(postCategories[0], post.slug, 3).catch(() => [])
    : [];

  const headingIds = createHeadingIdRegistry(post.content);
  const headings = extractHeadings(post.content);
  const takeaways = parseKeyTakeaways(post.keyTakeaways);
  const faqs = postFaqsToFaqItems(parsePostFaqs(post.postFaqs));
  const publishedDate = formatPostDate(post.publishedAt);
  const updatedDate = formatPostDate(post.updatedAt);
  const postTags = Array.isArray(post.tags) ? (post.tags as string[]) : [];
  const sidebarTags =
    postTags.length > 0
      ? postTags
      : allTags.slice(0, 8).map((tag) => tag.name);
  const shareUrl = absoluteUrl(postPath(post.slug));
  const breadcrumbItems = [
    { label: "Blog", href: blogIndexPath },
    { label: post.title },
  ];

  const faqSchema = buildPostFaqPageSchema(post, settings.organizationName);
  const schemaGraph: Record<string, unknown>[] = [
    buildBlogPostingSchema(
      post,
      settings.organizationName,
      settings.socialLinks,
      settings.defaultOgImage,
    ),
    ...(faqSchema ? [faqSchema] : []),
  ];

  return (
    <>
      <JsonLd data={schemaGraph} />
      <JsonLd data={buildBreadcrumbListSchema([
        { label: "Home", href: "/" },
        ...breadcrumbItems,
      ])} />

      <article className="bg-background">
        <div className="mx-auto w-[90%] max-w-none py-12 md:py-16">
          <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-20">
            <div className="min-w-0">
              <Breadcrumbs
                items={[
                  { label: "Home", href: "/" },
                  ...breadcrumbItems,
                ]}
              />

              <header className="mt-6 space-y-5">
                <h1 className="text-balance text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.1] tracking-[-0.035em] text-foreground">
                  {post.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                  <span className="inline-flex size-9 items-center justify-center overflow-hidden rounded-full border border-border bg-surface">
                    <SafeImage
                      src="/logo.png"
                      alt=""
                      width={28}
                      height={28}
                      className="size-7 object-contain"
                    />
                  </span>
                  <span className="font-medium text-foreground">
                    {SITE_AUTHOR_NAME}
                  </span>
                  {(postCategories.length
                    ? postCategories
                    : post.category
                      ? [post.category]
                      : []
                  ).map((cat) => (
                    <span key={cat} className="contents">
                      <span aria-hidden="true" className="text-border">
                        ·
                      </span>
                      <Link
                        href={categoryPath(cat)}
                        className="text-accent hover:underline"
                      >
                        {formatPostCategory(cat)}
                      </Link>
                    </span>
                  ))}
                  {publishedDate ? (
                    <>
                      <span aria-hidden="true" className="text-border">
                        ·
                      </span>
                      <span>
                        Published{" "}
                        <time
                          dateTime={
                            post.publishedAt
                              ? new Date(post.publishedAt).toISOString()
                              : undefined
                          }
                        >
                          {publishedDate}
                        </time>
                      </span>
                    </>
                  ) : null}
                  {updatedDate ? (
                    <>
                      <span aria-hidden="true" className="text-border">
                        ·
                      </span>
                      <span>
                        Updated{" "}
                        <time
                          dateTime={
                            post.updatedAt
                              ? new Date(post.updatedAt).toISOString()
                              : undefined
                          }
                        >
                          {updatedDate}
                        </time>
                      </span>
                    </>
                  ) : null}
                  <span aria-hidden="true" className="text-border">
                    ·
                  </span>
                  <span>{post.readingMinutes ?? 1} min read</span>
                </div>
              </header>

              {post.tldr ? (
                <div className="mt-8 rounded-[1.25rem] border border-border bg-surface p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-accent">
                    Quick answer
                  </p>
                  <p className="mt-2 text-base leading-relaxed text-foreground">
                    {post.tldr}
                  </p>
                </div>
              ) : null}

              <div className="mt-8 lg:hidden">
                <PostTableOfContents headings={headings} mode="mobile" />
              </div>

              {post.coverImage ? (
                <figure className="mt-8 overflow-hidden rounded-default border border-border bg-surface">
                  <SafeImage
                    src={post.coverImage}
                    alt={post.title}
                    width={1400}
                    height={788}
                    sizes="(max-width: 1280px) 100vw, 900px"
                    className="aspect-[16/9] h-auto w-full object-contain"
                    priority
                  />
                </figure>
              ) : null}

              {takeaways.length > 0 ? (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    Key takeaways
                  </h2>
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-muted">
                    {takeaways.map((item) => (
                      <li key={item} className="text-foreground">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-10">
                <RichText content={post.content} headingIds={headingIds} />
              </div>

              {faqs.length > 0 ? (
                <section className="mt-12">
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    Frequently asked questions
                  </h2>
                  <div className="mt-6">
                    <FaqAccordion items={faqs} />
                  </div>
                </section>
              ) : null}

              <div className="mt-10">
                <ShareButtons url={shareUrl} title={post.title} />
              </div>
            </div>

            <div className="space-y-8 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
              <SectionErrorBoundary label="post-toc">
                <div className="hidden lg:block">
                  <PostTableOfContents headings={headings} mode="desktop" />
                </div>
              </SectionErrorBoundary>
              <SectionErrorBoundary label="post-sidebar">
                <PostSidebar
                  categories={categories}
                  recentPosts={recentPosts}
                  activeCategory={post.category}
                  tags={sidebarTags}
                  socialLinks={settings.socialLinks}
                />
              </SectionErrorBoundary>
            </div>
          </div>
        </div>
      </article>

      <SectionErrorBoundary label="post-related">
      {relatedPosts.length > 0 ? (
        <section className="relative overflow-clip border-t border-border bg-surface py-20 md:py-28">
          <Ambient flip />
          <div className="relative mx-auto w-[90%]">
            <div className="mb-12 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
              <BlurReveal>
                <p className="text-sm font-medium text-accent">
                  More from the blog
                </p>
                <h2 className="mt-4 max-w-xl text-balance text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground">
                  Keep reading
                </h2>
              </BlurReveal>
              <BlurReveal delay={0.1}>
                <SiteLinkButton
                  button={viewAllCta}
                  className="group inline-flex h-12 shrink-0 items-center justify-center gap-3 rounded-full border border-border bg-background py-3 pl-6 pr-3 text-sm font-medium text-foreground transition-colors duration-300 hover:border-accent hover:text-accent"
                >
                  <>
                    {viewAllCta.label}
                    <span
                      aria-hidden="true"
                      className="flex size-7 items-center justify-center rounded-full bg-accent/10 text-accent transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-45"
                    >
                      <ArrowUpRight
                        className="size-4"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </span>
                  </>
                </SiteLinkButton>
              </BlurReveal>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((related, index) => (
                <BlurReveal
                  key={related.id}
                  delay={index * 0.06}
                  className="h-full"
                >
                  <BlogArticleCard post={related} index={index} />
                </BlurReveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      </SectionErrorBoundary>

      <SectionErrorBoundary label="post-newsletter">
        <BlogNewsletterSection
          eyebrow={newsletterSections.newsletterEyebrow}
          headline={newsletterSections.newsletterHeadline}
          body={newsletterSections.newsletterBody}
          perk1={newsletterSections.newsletterPerk1}
          perk2={newsletterSections.newsletterPerk2}
          perk3={newsletterSections.newsletterPerk3}
          button={newsletterSections.newsletterButton}
          success={newsletterSections.newsletterSuccess}
          turnstileSiteKey={turnstileSiteKey}
        />
      </SectionErrorBoundary>
    </>
  );
}
