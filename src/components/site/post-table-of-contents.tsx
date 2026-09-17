"use client";

import { scrollToAnchor } from "@/components/site/lenis-provider";
import type { ContentHeading } from "@/lib/posts/headings";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

type PostTableOfContentsProps = {
  headings: ContentHeading[];
  /** Render only mobile accordion, only desktop sticky, or both. */
  mode?: "all" | "mobile" | "desktop";
};

export function PostTableOfContents({
  headings,
  mode = "all",
}: PostTableOfContentsProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    function syncFromHash() {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash && headings.some((heading) => heading.id === hash)) {
        setActiveId(hash);
      }
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [headings]);

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target;
        if (top?.id) {
          setActiveId(top.id);
        }
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0, 0.25, 0.5, 1],
      },
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) {
    return null;
  }

  function handleClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) {
    event.preventDefault();
    setActiveId(id);
    setMobileOpen(false);
    const scrolled = scrollToAnchor(`#${id}`);
    if (!scrolled) {
      // Retry once after layout/images settle (Lenis resize).
      window.requestAnimationFrame(() => {
        scrollToAnchor(`#${id}`);
      });
    }
  }

  const list = (
    <ul className="space-y-2">
      {headings.map((heading) => {
        const isActive = activeId === heading.id;
        return (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(event) => handleClick(event, heading.id)}
              className={`block text-sm transition-colors ${
                isActive
                  ? "font-medium text-accent"
                  : "text-muted hover:text-accent"
              }`}
              aria-current={isActive ? "location" : undefined}
            >
              {heading.text}
            </a>
          </li>
        );
      })}
    </ul>
  );

  const showDesktop = mode === "all" || mode === "desktop";
  const showMobile = mode === "all" || mode === "mobile";

  return (
    <>
      {showDesktop ? (
        <aside className={mode === "desktop" ? "block" : "hidden lg:block"}>
          <nav
            aria-label="Table of contents"
            className="sticky top-24 rounded-default border border-border bg-surface p-4"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
              On this page
            </p>
            <div className="mt-3">{list}</div>
          </nav>
        </aside>
      ) : null}

      {showMobile ? (
        <div className={mode === "mobile" ? "mb-8" : "mb-8 lg:hidden"}>
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="flex w-full items-center justify-between rounded-default border border-border bg-surface px-4 py-3 text-left text-sm font-medium text-foreground"
            aria-expanded={mobileOpen}
          >
            On this page
            <ChevronDown
              className={`size-4 text-muted transition-transform ${mobileOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
          {mobileOpen ? (
            <nav
              aria-label="Table of contents"
              className="mt-2 rounded-default border border-border bg-surface p-4"
            >
              {list}
            </nav>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
