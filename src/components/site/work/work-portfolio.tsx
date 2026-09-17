"use client";

import { SafeImage } from "@/components/site/safe-image";
import { ArrowUpRight } from "lucide-react";
import { Ambient } from "@/components/site/home/motion/ambient";
import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import { MediaPreviewModal } from "@/components/site/media-preview-modal";
import { GeneralGallerySlider } from "@/components/site/work/general-gallery-slider";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { CaseStudySummary } from "@/lib/queries/case-studies";
import type { WorkGalleryItem } from "@/lib/queries/work-gallery";
import { caseStudyPath } from "@/lib/paths";
import {
  parseGallery,
  type GalleryItem,
} from "@/lib/site/content-parsers";
import { AnimatePresence } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 6;
const CARD_CYCLE_MS = 4000;

/** Map missing seed paths onto a real public asset so cards/previews aren't blank. */
function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (
    trimmed.startsWith("/images/") ||
    trimmed.startsWith("/og/") ||
    trimmed === "null" ||
    trimmed === "undefined"
  ) {
    return null;
  }
  return trimmed;
}

function coverFor(study: CaseStudySummary) {
  const fromOg = resolveMediaUrl(study.ogImage);
  if (fromOg) return fromOg;
  const gallery = parseGallery(study.gallery);
  return resolveMediaUrl(gallery[0]?.url ?? null);
}

function galleryFor(study: CaseStudySummary): GalleryItem[] {
  const parsed = parseGallery(study.gallery).flatMap((item) => {
    const url = resolveMediaUrl(item.url);
    if (!url) return [];
    return [{ ...item, url }];
  });
  const og = resolveMediaUrl(study.ogImage);
  if (og && !parsed.some((item) => item.url === og)) {
    return [{ url: og, alt: study.client, kind: "image" }, ...parsed];
  }
  return parsed;
}

function cardImages(study: CaseStudySummary): GalleryItem[] {
  return galleryFor(study).filter((item) => item.kind === "image");
}

function CaseStudyCardMedia({
  study,
  priority,
  onPreview,
}: {
  study: CaseStudySummary;
  priority: boolean;
  onPreview: (items: GalleryItem[], startIndex: number) => void;
}) {
  const reducedMotion = useReducedMotion();
  const images = cardImages(study);
  const fallbackCover = coverFor(study) ?? "/logo.png";
  const slides =
    images.length > 0
      ? images
      : [{ url: fallbackCover, alt: study.client, kind: "image" as const }];
  // Cards are keyed by project id in the list, so a study change remounts
  // this component and activeIndex starts at 0 naturally.
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reducedMotion || paused || slides.length <= 1) return;

    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, CARD_CYCLE_MS);

    return () => window.clearInterval(id);
  }, [reducedMotion, paused, slides.length]);

  const previewItems =
    galleryFor(study).length > 0 ? galleryFor(study) : slides;

  return (
    <>
      {slides.map((slide, index) => (
        <SafeImage
          key={`${slide.url}-${index}`}
          src={slide.url}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05] ${
            index === activeIndex ? "opacity-100" : "opacity-0"
          }`}
          priority={priority && index === 0}
        />
      ))}
      <button
        type="button"
        aria-label={`Preview ${study.client} gallery`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          // slides is images-only while previewItems may include videos, so
          // activeIndex must be mapped to the matching item by URL.
          const activeUrl = slides[activeIndex]?.url;
          const startIndex = previewItems.findIndex(
            (item) => item.url === activeUrl,
          );
          onPreview(previewItems, Math.max(0, startIndex));
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className="absolute inset-0 z-[1] cursor-zoom-in"
      />
    </>
  );
}

export function WorkPortfolio({
  projects,
  hero,
  galleryCopy,
  generalGallery = [],
}: {
  projects: CaseStudySummary[];
  hero?: {
    eyebrow: string;
    headline: string;
    subtext: string;
  };
  galleryCopy?: {
    eyebrow: string;
    headline: string;
    subtext: string;
  };
  generalGallery?: WorkGalleryItem[];
}) {
  const industries = useMemo(() => {
    const set = new Set<string>();
    for (const project of projects) {
      if (project.industry?.trim()) set.add(project.industry.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<{
    items: GalleryItem[];
    clientName: string;
    initialIndex: number;
  } | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return projects;
    return projects.filter((project) => project.industry?.trim() === filter);
  }, [filter, projects]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function setFilterAndReset(next: string) {
    setFilter(next);
    setPage(1);
  }

  return (
    <div className="relative overflow-clip">
      <Ambient />

      <header className="relative mx-auto max-w-[1120px] px-6 pb-12 pt-6 text-center md:pb-16 md:pt-10">
        <BlurReveal>
          <p className="text-sm font-medium text-accent">
            {hero?.eyebrow ?? "Work"}
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-balance text-[clamp(2.5rem,7vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.045em] text-foreground">
            {hero?.headline ?? "Work that moved the needle"}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg">
            {hero?.subtext ??
              "Real projects for real clients, with the numbers to prove it. Browse the case studies, or dip into the gallery below."}
          </p>
        </BlurReveal>

        {industries.length > 0 ? (
          <BlurReveal delay={0.08} className="mt-10">
            <div
              role="tablist"
              aria-label="Filter by industry"
              className="flex flex-wrap justify-center gap-2"
            >
              <button
                type="button"
                role="tab"
                aria-selected={filter === "all"}
                onClick={() => setFilterAndReset("all")}
                className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-medium transition-colors ${
                  filter === "all"
                    ? "bg-accent text-surface"
                    : "border border-border bg-surface text-muted hover:text-foreground"
                }`}
              >
                All work
              </button>
              {industries.map((industry) => (
                <button
                  key={industry}
                  type="button"
                  role="tab"
                  aria-selected={filter === industry}
                  onClick={() => setFilterAndReset(industry)}
                  className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-medium transition-colors ${
                    filter === industry
                      ? "bg-accent text-surface"
                      : "border border-border bg-surface text-muted hover:text-foreground"
                  }`}
                >
                  {industry}
                </button>
              ))}
            </div>
          </BlurReveal>
        ) : null}
      </header>

      <div className="relative mx-auto max-w-[1120px] px-6 pb-16 md:pb-20">
        {visible.length === 0 ? (
          <p className="rounded-default border border-border bg-surface p-8 text-center text-sm text-muted">
            No published projects in this filter yet.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((project, index) => {
              const metric = project.infoHeadlineValue?.trim() || null;
              const absoluteIndex = (currentPage - 1) * PAGE_SIZE + index;

              return (
                <li key={project.id}>
                  <BlurReveal delay={Math.min(index * 0.05, 0.2)}>
                    <article className="group relative flex h-full flex-col overflow-hidden rounded-default border border-border bg-surface transition-[border-color,transform,box-shadow] duration-500 hover:-translate-y-1 hover:border-accent hover:shadow-soft dark:hover:shadow-glow">
                      <div className="relative aspect-[4/3] overflow-hidden bg-background">
                        <CaseStudyCardMedia
                          study={project}
                          priority={index < 3}
                          onPreview={(items, startIndex) =>
                            setPreview({
                              items,
                              clientName: project.client,
                              initialIndex: startIndex,
                            })
                          }
                        />
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-80"
                        />
                        <span className="pointer-events-none absolute left-4 top-4 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-foreground backdrop-blur">
                          {String(absoluteIndex + 1).padStart(2, "0")}
                        </span>
                        {project.industry ? (
                          <span className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-border/60 bg-background/75 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
                            {project.industry}
                          </span>
                        ) : null}
                      </div>

                      <Link
                        href={caseStudyPath(project.slug)}
                        className="flex flex-1 flex-col p-6"
                      >
                        <h2 className="text-balance text-xl font-semibold leading-snug tracking-[-0.02em] text-foreground transition-colors duration-300 group-hover:text-accent">
                          {project.client}
                        </h2>
                        {project.challenge ? (
                          <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
                            {project.challenge}
                          </p>
                        ) : (
                          <span className="flex-1" />
                        )}

                        <div className="mt-5 flex items-end justify-between gap-3 border-t border-border pt-4">
                          {metric ? (
                            <div>
                              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                                {project.infoHeadlineLabel?.trim() || "Highlight"}
                              </p>
                              <p className="mt-1 text-lg font-semibold text-accent">
                                {metric}
                              </p>
                            </div>
                          ) : (
                            <span />
                          )}
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                            View
                            <span
                              aria-hidden="true"
                              className="inline-flex size-7 items-center justify-center rounded-full bg-accent/10 text-accent transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-45"
                            >
                              <ArrowUpRight
                                className="size-4"
                                strokeWidth={1.5}
                                aria-hidden="true"
                              />
                            </span>
                          </span>
                        </div>
                      </Link>
                    </article>
                  </BlurReveal>
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 ? (
          <nav
            aria-label="Work pagination"
            className="mt-12 flex flex-wrap items-center justify-center gap-2"
          >
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-35"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                aria-current={n === currentPage ? "page" : undefined}
                onClick={() => setPage(n)}
                className={`inline-flex size-11 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  n === currentPage
                    ? "bg-accent text-surface"
                    : "border border-border text-foreground hover:border-accent hover:text-accent"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-35"
            >
              Next
            </button>
          </nav>
        ) : null}
      </div>

      <GeneralGallerySlider
        items={generalGallery}
        eyebrow={galleryCopy?.eyebrow}
        headline={galleryCopy?.headline}
        subtext={galleryCopy?.subtext}
      />

      <AnimatePresence>
        {preview ? (
          <MediaPreviewModal
            items={preview.items}
            initialIndex={preview.initialIndex}
            title={preview.clientName}
            onClose={() => setPreview(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
