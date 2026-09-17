import { SafeImage } from "@/components/site/safe-image";
import {
  IconFacebook,
  IconInstagram,
  IconLinkedIn,
} from "@/components/site/social-icons";
import { categoryPath, postPath } from "@/lib/paths";
import { formatPostCategory } from "@/lib/posts/constants";
import type { PublishedPostSummary } from "@/lib/queries/posts";
import type { SocialLinks } from "@/lib/queries/site-settings";
import { formatShortDate as formatDate } from "@/lib/site/format-date";
import Link from "next/link";

type CategoryItem = {
  value: string;
  count: number;
  label?: string;
};

export function PostSidebar({
  categories,
  recentPosts,
  activeCategory,
  tags,
  socialLinks,
}: {
  categories: CategoryItem[];
  recentPosts: PublishedPostSummary[];
  activeCategory?: string | null;
  tags?: string[];
  socialLinks?: SocialLinks;
}) {
  const social = [
    { label: "LinkedIn", href: socialLinks?.linkedin, icon: IconLinkedIn },
    { label: "Facebook", href: socialLinks?.facebook, icon: IconFacebook },
    { label: "Instagram", href: socialLinks?.instagram, icon: IconInstagram },
  ].filter((item) => Boolean(item.href));

  return (
    <aside className="space-y-10 self-start lg:sticky lg:top-28">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Latest Post
        </h2>
        <ul className="mt-5 space-y-5">
          {recentPosts.map((post) => {
            const date = formatDate(post.publishedAt);
            return (
              <li key={post.id}>
                <Link href={postPath(post.slug)} className="group flex gap-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-surface">
                    {post.coverImage ? (
                      <SafeImage
                        src={post.coverImage}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 opacity-40"
                        style={{
                          backgroundImage:
                            "radial-gradient(circle at 30% 30%, var(--accent), transparent 60%)",
                        }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
                      {post.title}
                    </p>
                    {date ? (
                      <p className="mt-1.5 text-xs text-muted">{date}</p>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Categories
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.slice(0, 10).map((item) => {
            const active = activeCategory === item.value;
            return (
              <Link
                key={item.value}
                href={categoryPath(item.value)}
                className={`inline-flex h-9 items-center rounded-full px-3.5 text-sm transition-colors ${
                  active
                    ? "bg-accent text-surface"
                    : "bg-surface text-muted ring-1 ring-border hover:text-foreground"
                }`}
              >
                {item.label ?? formatPostCategory(item.value)}
              </Link>
            );
          })}
        </div>
      </div>

      {tags && tags.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Popular Tags
          </h2>
          <ul className="mt-4 space-y-2.5">
            {tags.slice(0, 8).map((tag) => (
              <li key={tag}>
                <span className="text-sm text-muted transition-colors hover:text-accent">
                  #{tag.replace(/\s+/g, "")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {social.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Social Media
          </h2>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {social.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
                className="inline-flex size-10 items-center justify-center rounded-full bg-accent text-surface transition-transform duration-300 hover:scale-105"
              >
                <item.icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
