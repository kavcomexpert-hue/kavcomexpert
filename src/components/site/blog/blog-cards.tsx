import { SafeImage } from "@/components/site/safe-image";
import { blogIndexPath, postPath } from "@/lib/paths";
import { formatPostCategory } from "@/lib/posts/constants";
import type { PublishedPostSummary } from "@/lib/queries/posts";
import { formatShortDate as formatDate } from "@/lib/site/format-date";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function BlogArticleCard({
  post,
  size = "default",
  index,
}: {
  post: PublishedPostSummary;
  size?: "large" | "default";
  index?: number;
}) {
  const date = formatDate(post.publishedAt);
  const isLarge = size === "large";

  return (
    <Link
      href={postPath(post.slug)}
      className="group relative flex h-full flex-col overflow-hidden rounded-default border border-border bg-background p-5 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-soft dark:hover:shadow-glow md:p-6"
    >
      <div
        aria-hidden="true"
        className="absolute -right-12 -top-12 size-32 rounded-full bg-accent-lime/0 blur-2xl transition-[background-color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-125 group-hover:bg-accent-lime/20 dark:group-hover:bg-accent/15"
      />

      <div
        className={`relative overflow-hidden rounded-2xl border border-border bg-surface ${
          isLarge ? "aspect-[16/10]" : "aspect-[16/10]"
        }`}
      >
        {post.coverImage ? (
          <SafeImage
            src={post.coverImage}
            alt=""
            fill
            sizes={
              isLarge
                ? "(max-width: 768px) 100vw, 50vw"
                : "(max-width: 768px) 100vw, 33vw"
            }
            className="object-contain p-2 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]"
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 30%, var(--accent) 0%, transparent 50%), radial-gradient(circle at 80% 70%, var(--accent-lime) 0%, transparent 45%)",
              opacity: 0.22,
            }}
          />
        )}
      </div>

      <div className="relative mt-5 flex items-start justify-between gap-3">
        <p className="text-sm text-muted">
          <span className="text-foreground/80">
            {formatPostCategory(post.category)}
          </span>
          {date ? <span> · {date}</span> : null}
        </p>
        {typeof index === "number" ? (
          <span className="text-sm tabular-nums text-muted/60">
            {String(index + 1).padStart(2, "0")}
          </span>
        ) : null}
      </div>

      <h2
        className={`relative mt-3 font-semibold leading-[1.25] tracking-[-0.02em] text-foreground transition-colors duration-300 group-hover:text-accent ${
          isLarge ? "text-xl md:text-2xl" : "text-lg md:text-xl"
        }`}
      >
        {post.title}
      </h2>

      {post.excerpt ? (
        <p className="relative mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
          {post.excerpt}
        </p>
      ) : null}

      <p className="relative mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground">
        Learn more
        <span
          aria-hidden="true"
          className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1"
        ><ChevronRight className="size-4" strokeWidth={1.5} aria-hidden="true" /></span>
      </p>
    </Link>
  );
}

export function BlogPagination({
  page,
  totalPages,
  category,
  query,
}: {
  page: number;
  totalPages: number;
  category?: string;
  query?: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  function hrefFor(target: number) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (query) params.set("q", query);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `${blogIndexPath}?${qs}` : blogIndexPath;
  }

  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav
      aria-label="Blog pagination"
      className="mt-14 flex flex-wrap items-center justify-center gap-2"
    >
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`inline-flex h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-medium transition-colors ${
          page <= 1
            ? "pointer-events-none opacity-35"
            : "bg-surface text-foreground hover:border-accent hover:text-accent"
        }`}
      >
        Previous
      </Link>

      {start > 1 ? (
        <>
          <Link
            href={hrefFor(1)}
            className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            1
          </Link>
          {start > 2 ? (
            <span className="px-1 text-muted" aria-hidden="true">
              …
            </span>
          ) : null}
        </>
      ) : null}

      {pages.map((n) => (
        <Link
          key={n}
          href={hrefFor(n)}
          aria-current={n === page ? "page" : undefined}
          className={`inline-flex size-11 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
            n === page
              ? "border-accent bg-accent text-surface"
              : "border-border bg-surface text-foreground hover:border-accent hover:text-accent"
          }`}
        >
          {n}
        </Link>
      ))}

      {end < totalPages ? (
        <>
          {end < totalPages - 1 ? (
            <span className="px-1 text-muted" aria-hidden="true">
              …
            </span>
          ) : null}
          <Link
            href={hrefFor(totalPages)}
            className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            {totalPages}
          </Link>
        </>
      ) : null}

      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`inline-flex h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-medium transition-colors ${
          page >= totalPages
            ? "pointer-events-none opacity-35"
            : "bg-surface text-foreground hover:border-accent hover:text-accent"
        }`}
      >
        Next
      </Link>
    </nav>
  );
}
