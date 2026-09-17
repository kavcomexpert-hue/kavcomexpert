import { BlogHeroIllustration } from "@/components/site/blog/blog-hero-illustration";
import { Ambient } from "@/components/site/home/motion/ambient";
import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import { blogIndexPath, categoryPath } from "@/lib/paths";
import { formatPostCategory } from "@/lib/posts/constants";
import { Search } from "lucide-react";
import Link from "next/link";

type CategoryChip = {
  value: string;
  count: number;
  label?: string;
};

export function BlogHero({
  categories,
  activeCategory,
  searchQuery,
  total,
  eyebrow = "Kavcom Journal",
  headline = "Learn what actually grows a business online",
  subtext = "Straightforward guides on websites, SEO, e-commerce and marketing, written from real client work.",
  searchLabel = "Search articles",
  searchPlaceholder = "Search articles by title or topic…",
  searchButton = "Search",
  allCategoryLabel = "All",
}: {
  categories: CategoryChip[];
  activeCategory?: string;
  searchQuery?: string;
  total: number;
  eyebrow?: string;
  headline?: string;
  subtext?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  searchButton?: string;
  allCategoryLabel?: string;
}) {
  const visibleCategories = categories.slice(0, 8);

  return (
    <section className="relative overflow-clip border-b border-border bg-background">
      <Ambient />
      <div className="relative mx-auto max-w-[1120px] px-6 pb-10 pt-16 md:pb-12 md:pt-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
          <BlurReveal>
            <p className="text-sm font-medium text-accent">{eyebrow}</p>
            <h1 className="mt-4 max-w-xl text-balance text-[clamp(2.5rem,5.5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-foreground">
              {headline}
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted md:text-lg">
              {subtext}
              {total > 0 ? ` ${total} published articles` : ""}
            </p>
          </BlurReveal>

          <BlurReveal delay={0.1} className="hidden lg:block">
            <BlogHeroIllustration />
          </BlurReveal>
        </div>

        <BlurReveal delay={0.12} className="mt-10 md:mt-12">
          <div className="rounded-default border border-border bg-surface p-4 shadow-soft dark:shadow-none md:p-5">
            <form
              action={blogIndexPath}
              method="get"
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              {activeCategory ? (
                <input type="hidden" name="category" value={activeCategory} />
              ) : null}
              <label htmlFor="blog-search" className="sr-only">
                {searchLabel}
              </label>
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <input
                  id="blog-search"
                  name="q"
                  type="search"
                  defaultValue={searchQuery ?? ""}
                  placeholder={searchPlaceholder}
                  className="h-12 w-full rounded-default border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface transition-opacity hover:opacity-90"
              >
                {searchButton}
              </button>
            </form>

            <nav
              aria-label="Filter posts by category"
              data-lenis-prevent-horizontal
              className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <Link
                href={
                  searchQuery
                    ? `${blogIndexPath}?q=${encodeURIComponent(searchQuery)}`
                    : blogIndexPath
                }
                className={`inline-flex h-9 shrink-0 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors ${
                  !activeCategory
                    ? "bg-accent text-surface"
                    : "bg-background text-muted ring-1 ring-border hover:text-foreground"
                }`}
              >
                {allCategoryLabel}
              </Link>
              {visibleCategories.map((item) => {
                const active = activeCategory === item.value;
                const href = searchQuery
                  ? `${categoryPath(item.value)}&q=${encodeURIComponent(searchQuery)}`
                  : categoryPath(item.value);
                return (
                  <Link
                    key={item.value}
                    href={href}
                    className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors ${
                      active
                        ? "bg-accent text-surface"
                        : "bg-background text-muted ring-1 ring-border hover:text-foreground"
                    }`}
                  >
                    {item.label ?? formatPostCategory(item.value)}
                    <span
                      className={`font-mono text-[0.65rem] ${
                        active ? "text-surface/70" : "text-muted"
                      }`}
                    >
                      {item.count}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </BlurReveal>
      </div>
    </section>
  );
}
