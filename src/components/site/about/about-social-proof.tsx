"use client";

import { SafeImage } from "@/components/site/safe-image";

import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Ambient } from "@/components/site/home/motion/ambient";
import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import {
  lockPageScroll,
  unlockPageScroll,
} from "@/components/site/lenis-provider";
import { motionEase } from "@/components/site/motion/reveal";
import {
  testimonialVideos,
  type TestimonialVideo,
} from "@/components/site/testimonial-videos";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { TestimonialSummary } from "@/lib/queries/testimonials";
import {
  YOUTUBE_IFRAME_ALLOW,
  youtubeEmbedSrc,
  youtubePosterUrl,
} from "@/lib/site/video-embed";
import { AnimatePresence, motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

const AUTO_MS = 5500;
const PREVIEW_CHARS = 150;
const GAP_PX = 16;
const VISIBLE_DESKTOP = 3;

const lightCard =
  "border-review-border bg-review-card text-review-ink shadow-soft";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function QuoteMark() {
  return (
    <svg
      viewBox="0 0 48 36"
      className="size-10 text-accent/25 md:size-11"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M0 36V20.4C0 9.12 5.76 1.92 17.28 0l2.4 4.8C13.44 6.72 10.08 11.04 10.08 17.28H18V36H0zm30 0V20.4C30 9.12 35.76 1.92 47.28 0l2.4 4.8C43.44 6.72 40.08 11.04 40.08 17.28H48V36H30z" />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-4"
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.4}
    >
      <path d="M10 2.5l2.2 4.45 4.9.71-3.55 3.46.84 4.88L10 13.7l-4.39 2.3.84-4.88L2.9 7.66l4.9-.71L10 2.5z" />
    </svg>
  );
}

function ReviewStars({ rating }: { rating: number | null | undefined }) {
  const value = Math.max(0, Math.min(5, Math.round(rating ?? 5)));

  return (
    <div
      className="mt-auto flex items-center justify-end gap-0.5 text-star-gold"
      aria-label={`${value} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon key={index} filled={index < value} />
      ))}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="ml-0.5 size-5" aria-hidden="true">
      <path d="M8 6l10 6-10 6V6z" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return <X className="size-5" strokeWidth={1.5} aria-hidden="true" />;
}

function ReviewCard({ testimonial }: { testimonial: TestimonialSummary }) {
  const [expanded, setExpanded] = useState(false);
  const needsMore = testimonial.quote.length > PREVIEW_CHARS;
  const displayQuote =
    !needsMore || expanded
      ? testimonial.quote
      : `${testimonial.quote.slice(0, PREVIEW_CHARS).trimEnd()}...`;

  return (
    <article
      className={`relative flex h-full min-h-[300px] flex-col rounded-default border p-6 md:min-h-[320px] md:p-7 ${lightCard}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-star-gold/10 blur-2xl"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {testimonial.headshot ? (
            <SafeImage
              src={testimonial.headshot}
              alt=""
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-full border border-review-border bg-logo-surface font-display text-sm font-semibold text-accent"
            >
              {getInitials(testimonial.clientName)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-review-ink">
              {testimonial.clientName}
            </p>
            <p className="truncate text-sm text-review-muted">
              {testimonial.company?.trim() ||
                testimonial.role?.trim() ||
                "Client"}
            </p>
          </div>
        </div>
        <QuoteMark />
      </div>

      <blockquote className="relative mt-5 flex-1 text-sm leading-relaxed text-review-ink">
        <span aria-hidden="true" className="text-accent">
          “
        </span>
        {displayQuote}
        <span aria-hidden="true" className="text-accent">
          ”
        </span>
        {needsMore ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="mt-3 block text-sm font-medium text-accent transition-opacity hover:opacity-80"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        ) : null}
      </blockquote>

      <div className="relative mt-5 flex items-end justify-end gap-3">
        <ReviewStars rating={testimonial.rating} />
      </div>
    </article>
  );
}

function VideoModal({
  video,
  onClose,
}: {
  video: TestimonialVideo;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    closeRef.current?.focus();
    lockPageScroll();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      unlockPageScroll();
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Video: ${video.name}, ${video.company}`}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <button
        type="button"
        aria-label="Close video"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-foreground/50 backdrop-blur-lg dark:bg-background/70"
      />
      <motion.div
        className="relative w-full max-w-4xl"
        initial={reducedMotion ? false : { opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.35, ease: motionEase }}
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-surface dark:text-foreground">
            {video.name}
            <span className="text-surface/60 dark:text-muted">
              {" "}
              · {video.company}
            </span>
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close video"
            className="flex size-10 items-center justify-center rounded-full border border-surface/30 bg-surface/10 text-surface backdrop-blur transition-colors hover:bg-surface/25 dark:border-border dark:bg-surface dark:text-foreground"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="overflow-hidden rounded-default border border-review-border bg-review-card shadow-soft">
          <div className="relative aspect-video">
            {video.videoSrc ? (
              <video
                src={video.videoSrc}
                controls
                autoPlay
                playsInline
                className="absolute inset-0 size-full object-contain"
              />
            ) : video.youtubeId ? (
              <iframe
                title={`${video.name}, ${video.company}`}
                src={youtubeEmbedSrc(video.youtubeId, { autoplay: true })}
                className="absolute inset-0 size-full border-0"
                allow={YOUTUBE_IFRAME_ALLOW}
              />
            ) : null}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function VideoCard({
  video,
  index,
  onPlay,
}: {
  video: TestimonialVideo;
  index: number;
  onPlay: () => void;
}) {
  const thumbnail =
    video.posterSrc ??
    (video.youtubeId ? youtubePosterUrl(video.youtubeId) : null);

  return (
    <article className="h-full">
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Play video: ${video.name}, ${video.company}`}
        className={`group relative block h-full w-full overflow-hidden rounded-default border text-left transition-transform duration-300 hover:-translate-y-1 ${lightCard}`}
      >
        <div className="relative isolate aspect-video overflow-hidden bg-review-border/40">
          {thumbnail ? (
            <SafeImage
              src={thumbnail}
              alt={`Video testimonial from ${video.name}, ${video.company}`}
              width={640}
              height={360}
              sizes="(min-width: 768px) 33vw, 100vw"
              className="size-full max-h-full max-w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              unoptimized={thumbnail.includes("i.ytimg.com")}
            />
          ) : null}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-review-ink/35 transition-colors duration-300 group-hover:bg-review-ink/25"
          />
          <span
            aria-hidden="true"
            className="absolute right-4 top-4 text-xs tabular-nums text-surface/80"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="absolute right-4 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-surface transition-transform duration-300 group-hover:scale-110">
            <PlayIcon />
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-review-border px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-review-ink">
              {video.name}
            </p>
            <p className="truncate text-sm text-review-muted">{video.company}</p>
          </div>
          <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-review-muted transition-colors group-hover:text-accent">
            Watch
          </span>
        </div>
      </button>
    </article>
  );
}

function SliderControls({
  onPrev,
  onNext,
  canNavigate,
  label,
}: {
  onPrev: () => void;
  onNext: () => void;
  canNavigate: boolean;
  label: string;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        aria-label={`Previous ${label}`}
        disabled={!canNavigate}
        onClick={onPrev}
        className="flex size-11 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-35"
      ><ChevronLeft className="size-4" strokeWidth={1.5} aria-hidden="true" /></button>
      <button
        type="button"
        aria-label={`Next ${label}`}
        disabled={!canNavigate}
        onClick={onNext}
        className="flex size-11 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-35"
      ><ChevronRight className="size-4" strokeWidth={1.5} aria-hidden="true" /></button>
    </div>
  );
}

function useVisibleCount() {
  const [visible, setVisible] = useState(1);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setVisible(mq.matches ? VISIBLE_DESKTOP : 1);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return visible;
}

function useSlideMetrics(shellRef: RefObject<HTMLDivElement | null>) {
  const visible = useVisibleCount();
  const [cardWidth, setCardWidth] = useState(0);

  const measure = useCallback(() => {
    const shell = shellRef.current;
    if (!shell || shell.clientWidth === 0) return;
    setCardWidth(
      (shell.clientWidth - GAP_PX * (visible - 1)) / Math.max(visible, 1),
    );
  }, [shellRef, visible]);

  useLayoutEffect(() => {
    measure();
    const shell = shellRef.current;
    if (!shell) return;
    const observer = new ResizeObserver(measure);
    observer.observe(shell);
    return () => observer.disconnect();
  }, [measure, shellRef]);

  return { visible, cardWidth };
}

function useCarouselIndex(
  itemCount: number,
  visible: number,
  active: boolean,
) {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const maxIndex = Math.max(0, itemCount - visible);
  const canNavigate = itemCount > visible;
  const activeIndex = Math.min(index, maxIndex);

  const goNext = useCallback(() => {
    if (!canNavigate) return;
    setIndex((current) => {
      const safe = Math.min(current, maxIndex);
      return safe >= maxIndex ? 0 : safe + 1;
    });
  }, [canNavigate, maxIndex]);

  const goPrev = useCallback(() => {
    if (!canNavigate) return;
    setIndex((current) => {
      const safe = Math.min(current, maxIndex);
      return safe <= 0 ? maxIndex : safe - 1;
    });
  }, [canNavigate, maxIndex]);

  useEffect(() => {
    if (!active || paused || reducedMotion || !canNavigate) return;
    const id = window.setInterval(() => {
      setIndex((current) => {
        const safe = Math.min(current, maxIndex);
        return safe >= maxIndex ? 0 : safe + 1;
      });
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [active, paused, reducedMotion, canNavigate, maxIndex]);

  return {
    index: activeIndex,
    goNext,
    goPrev,
    canNavigate,
    setPaused,
    reducedMotion,
  };
}

export function AboutSocialProof({
  testimonials,
  videos = testimonialVideos,
  eyebrow = "Client stories",
  headline = "What clients say about working with us",
}: {
  testimonials: TestimonialSummary[];
  videos?: TestimonialVideo[];
  eyebrow?: string;
  headline?: string;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const hasReviews = testimonials.length > 0;
  const hasVideos = videos.length > 0;
  const preferredMode: "written" | "video" =
    !hasReviews && hasVideos ? "video" : "written";
  const [mode, setMode] = useState<"written" | "video">(preferredMode);
  const [modeSeed, setModeSeed] = useState(preferredMode);
  if (preferredMode !== modeSeed) {
    setModeSeed(preferredMode);
    setMode(preferredMode);
  }
  const [activeVideo, setActiveVideo] = useState<TestimonialVideo | null>(null);
  const dragRef = useRef({ active: false, startX: 0 });
  const didDragRef = useRef(false);
  const suppressClickRef = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);

  const { visible, cardWidth } = useSlideMetrics(shellRef);

  const reviewNav = useCarouselIndex(
    testimonials.length,
    visible,
    mode === "written" && hasReviews,
  );
  const videoNav = useCarouselIndex(
    videos.length,
    visible,
    mode === "video" && hasVideos,
  );

  if (!hasReviews && !hasVideos) {
    return null;
  }

  const activeNav = mode === "written" ? reviewNav : videoNav;
  const widthStyle =
    cardWidth > 0
      ? cardWidth
      : `calc((100% - ${(visible - 1) * GAP_PX}px) / ${visible})`;

  function onShellPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!activeNav.canNavigate) return;
    didDragRef.current = false;
    suppressClickRef.current = false;
    dragRef.current = { active: true, startX: event.clientX };
    reviewNav.setPaused(true);
    videoNav.setPaused(true);
  }

  function onShellPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) return;
    const delta = event.clientX - dragRef.current.startX;
    // Only start visual drag after a real threshold — applying transform on
    // every 1–2px pointer jitter cancels the subsequent click on the card.
    if (Math.abs(delta) <= 20) return;
    if (!didDragRef.current) {
      didDragRef.current = true;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }
    setDragOffset(delta);
  }

  function onShellPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const delta = event.clientX - dragRef.current.startX;
    setDragOffset(0);
    if (didDragRef.current && Math.abs(delta) > 48) {
      if (delta < 0) activeNav.goNext();
      else activeNav.goPrev();
    }
    // Mouse pointers keep the hover pause until mouseleave fires.
    if (event.pointerType !== "mouse") {
      reviewNav.setPaused(false);
      videoNav.setPaused(false);
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    if (didDragRef.current) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
        didDragRef.current = false;
      }, 50);
    }
  }

  return (
    <section
      id="testimonials"
      className="relative overflow-clip bg-background py-20 md:py-28"
    >
      <Ambient />
      <div className="relative mx-auto max-w-[1120px] px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <BlurReveal className="max-w-2xl">
            <p className="text-sm font-medium text-accent">{eyebrow}</p>
            <h2 className="mt-4 text-balance text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground">
              {headline}
            </h2>
          </BlurReveal>

          <BlurReveal delay={0.08}>
            <div className="flex flex-wrap items-center gap-3">
              {hasReviews && hasVideos ? (
                <div className="inline-flex rounded-full border border-border bg-surface p-1">
                  <button
                    type="button"
                    onClick={() => setMode("written")}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      mode === "written"
                        ? "bg-accent text-surface"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    Reviews
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("video")}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      mode === "video"
                        ? "bg-accent text-surface"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    Videos
                  </button>
                </div>
              ) : null}

              <SliderControls
                label={mode === "written" ? "reviews" : "videos"}
                onPrev={activeNav.goPrev}
                onNext={activeNav.goNext}
                canNavigate={activeNav.canNavigate}
              />
            </div>
          </BlurReveal>
        </div>

        <div
          ref={shellRef}
          data-lenis-prevent-horizontal
          role="group"
          aria-label="Client testimonials"
          tabIndex={activeNav.canNavigate ? 0 : undefined}
          onKeyDown={(event) => {
            if (!activeNav.canNavigate) return;
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              activeNav.goPrev();
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              activeNav.goNext();
            }
          }}
          className={`mt-12 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-accent ${activeNav.canNavigate ? "cursor-grab active:cursor-grabbing" : ""}`}
          onMouseEnter={() => {
            reviewNav.setPaused(true);
            videoNav.setPaused(true);
          }}
          onMouseLeave={() => {
            reviewNav.setPaused(false);
            videoNav.setPaused(false);
          }}
          onFocus={() => {
            reviewNav.setPaused(true);
            videoNav.setPaused(true);
          }}
          onBlur={() => {
            reviewNav.setPaused(false);
            videoNav.setPaused(false);
          }}
          onPointerDown={onShellPointerDown}
          onPointerMove={onShellPointerMove}
          onPointerUp={onShellPointerUp}
          onPointerCancel={onShellPointerUp}
          onClickCapture={(event) => {
            if (suppressClickRef.current || didDragRef.current) {
              event.preventDefault();
              event.stopPropagation();
              suppressClickRef.current = false;
              didDragRef.current = false;
            }
          }}
        >
          {hasReviews && mode === "written" ? (
            <div
              aria-roledescription="carousel"
              aria-label="Written reviews"
            >
              <div
                className="flex touch-pan-y"
                style={{
                  gap: GAP_PX,
                  transform: `translate3d(${-(
                    (cardWidth > 0
                      ? reviewNav.index * (cardWidth + GAP_PX)
                      : 0) - dragOffset
                  )}px, 0, 0)`,
                  transition:
                    dragOffset !== 0 || reviewNav.reducedMotion
                      ? undefined
                      : "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                {testimonials.map((testimonial) => (
                  <div
                    key={testimonial.id}
                    className="shrink-0"
                    style={{ width: widthStyle }}
                  >
                    <ReviewCard testimonial={testimonial} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {hasVideos && mode === "video" ? (
            <div
              aria-roledescription="carousel"
              aria-label="Video testimonials"
            >
              <div
                className="flex touch-pan-y"
                style={{
                  gap: GAP_PX,
                  transform: `translate3d(${-(
                    (cardWidth > 0
                      ? videoNav.index * (cardWidth + GAP_PX)
                      : 0) - dragOffset
                  )}px, 0, 0)`,
                  transition:
                    dragOffset !== 0 || videoNav.reducedMotion
                      ? undefined
                      : "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                {videos.map((video, index) => (
                  <div
                    key={video.id}
                    className="shrink-0"
                    style={{ width: widthStyle }}
                  >
                    <VideoCard
                      video={video}
                      index={index}
                      onPlay={() => setActiveVideo(video)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {activeVideo ? (
          <VideoModal
            key={activeVideo.id}
            video={activeVideo}
            onClose={() => setActiveVideo(null)}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}
