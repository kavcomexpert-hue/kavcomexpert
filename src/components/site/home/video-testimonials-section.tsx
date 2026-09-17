"use client";

import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";

import { Ambient } from "@/components/site/home/motion/ambient";
import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import {
  lockPageScroll,
  unlockPageScroll,
} from "@/components/site/lenis-provider";
import {
  testimonialVideos,
  type TestimonialVideo,
} from "@/components/site/testimonial-videos";
import { motionEase } from "@/components/site/motion/reveal";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SafeImage } from "@/components/site/safe-image";
import {
  YOUTUBE_IFRAME_ALLOW,
  youtubeEmbedSrc,
  youtubePosterUrl,
} from "@/lib/site/video-embed";
import { AnimatePresence, motion } from "motion/react";
import { SiteLinkButton } from "@/components/site/site-link-button";
import { linkButton, type LinkButton } from "@/lib/content/link-button";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="ml-0.5 size-5" aria-hidden="true">
      <path d="M8 6l10 6-10 6V6z" fill="currentColor" />
    </svg>
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
      if (event.key === "Escape") {
        onClose();
      }
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
        className="absolute inset-0 cursor-default bg-foreground/70 backdrop-blur-lg dark:bg-background/80"
      />

      <motion.div
        className="relative z-[1] w-full max-w-4xl"
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
            className="flex size-10 items-center justify-center rounded-full border border-surface/30 bg-surface/10 text-surface backdrop-blur transition-colors hover:bg-surface/25 dark:border-border dark:bg-surface dark:text-foreground dark:hover:border-accent"
          >
            <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-hidden rounded-default border border-surface/20 bg-background shadow-soft dark:border-border">
          <div className="relative isolate aspect-video overflow-hidden bg-foreground dark:bg-surface">
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
                // Intentionally no allowFullScreen — prevents the tab turning into a raw video player.
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
    <article className="w-[min(85vw,380px)] shrink-0 snap-start lg:w-[calc((100%-2.5rem)/3)]">
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onPlay();
        }}
        aria-label={`Play video: ${video.name}, ${video.company}`}
        className="group relative block w-full overflow-hidden rounded-default border border-border text-left transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-accent"
      >
        <div className="relative isolate aspect-video overflow-hidden bg-foreground dark:bg-surface">
          {thumbnail ? (
            <SafeImage
              src={thumbnail}
              alt={`Video testimonial from ${video.name}, ${video.company}`}
              width={640}
              height={360}
              sizes="(max-width: 1024px) 85vw, 360px"
              className="size-full max-h-full max-w-full object-cover"
              // YouTube posters are always remote; skip optimizer races on first paint.
              unoptimized={thumbnail.includes("i.ytimg.com")}
              loading="lazy"
            />
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle, var(--muted) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
          )}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-foreground/45 transition-colors duration-300 group-hover:bg-foreground/30 dark:bg-background/45 dark:group-hover:bg-background/30"
          />

          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-5 top-4 text-xs tabular-nums text-background/70 dark:text-foreground/70"
          >
            {String(index + 1).padStart(2, "0")}
          </span>

          <span className="pointer-events-none absolute right-5 top-1/2 flex size-14 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-surface shadow-soft transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110">
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-ping rounded-full bg-accent/50 opacity-0 transition-opacity duration-300 [animation-duration:1.6s] group-hover:opacity-100 motion-reduce:hidden"
            />
            <PlayIcon />
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border bg-surface px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-foreground">{video.name}</p>
            <p className="text-sm text-muted">{video.company}</p>
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-muted transition-colors duration-300 group-hover:text-accent">
            Watch
          </span>
        </div>
      </button>
    </article>
  );
}

export function VideoTestimonialsSection({
  items,
  eyebrow = "Testimonials",
  headline = "Listen what they say about working with us",
  cta = linkButton("View reviews", "/about-us#testimonials"),
}: {
  items?: TestimonialVideo[];
  eyebrow?: string;
  headline?: string;
  cta?: LinkButton;
}) {
  const videos = items ?? testimonialVideos;
  const reducedMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  // The section unmounts on route change, so the modal never leaks across pages.
  const [activeVideo, setActiveVideo] = useState<TestimonialVideo | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    setCanPrev(track.scrollLeft > 8);
    setCanNext(track.scrollLeft < track.scrollWidth - track.clientWidth - 8);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [updateArrows]);

  const scrollByCard = useCallback(
    (direction: 1 | -1) => {
      const track = trackRef.current;
      if (!track) {
        return;
      }

      const card = track.firstElementChild as HTMLElement | null;
      const step = card ? card.offsetWidth + 20 : 420;
      track.scrollBy({
        left: step * direction,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    },
    [reducedMotion],
  );

  // Mouse drag-to-scroll. Touch swiping already works via native overflow
  // scrolling, so this only handles pointerType === "mouse".
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0 });
  const didDragRef = useRef(false);
  const suppressClickRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  const snapToNearestCard = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 20 : 420;
    const target = Math.round(track.scrollLeft / step) * step;
    track.scrollTo({
      left: target,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [reducedMotion]);

  function onTrackPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const track = trackRef.current;
    if (!track) return;
    didDragRef.current = false;
    suppressClickRef.current = false;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startScroll: track.scrollLeft,
    };
  }

  function onTrackPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) return;
    const track = trackRef.current;
    if (!track) return;
    const delta = event.clientX - dragRef.current.startX;
    // 20px threshold avoids trackpad jitter canceling card clicks.
    if (Math.abs(delta) <= 20) return;
    if (!didDragRef.current) {
      didDragRef.current = true;
      setDragging(true);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }
    track.scrollLeft = dragRef.current.startScroll - delta;
  }

  function onTrackPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    if (didDragRef.current) {
      setDragging(false);
      snapToNearestCard();
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
        didDragRef.current = false;
      }, 50);
    }
  }

  if (videos.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-clip bg-background py-20 md:py-32">
      <Ambient />
      <div className="relative mx-auto max-w-[1120px] px-6">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <BlurReveal>
            <p className="text-sm font-medium text-accent">{eyebrow}</p>
            <h2 className="mt-4 max-w-2xl text-balance text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground">
              {headline}
            </h2>
          </BlurReveal>

          <BlurReveal delay={0.1}>
            <div className="flex flex-wrap items-center gap-3">
              <SiteLinkButton
                button={cta}
                className="group inline-flex h-12 shrink-0 items-center justify-center gap-3 rounded-full border border-border bg-surface py-3 pl-6 pr-3 text-sm font-medium text-foreground transition-colors duration-300 hover:border-accent hover:text-accent"
              >
                <>
                  {cta.label}
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
              <button
                type="button"
                aria-label="Previous testimonials"
                disabled={!canPrev}
                onClick={() => scrollByCard(-1)}
                className="flex size-12 items-center justify-center rounded-full border border-border text-foreground transition-colors duration-300 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft
                  className="size-4"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                aria-label="Next testimonials"
                disabled={!canNext}
                onClick={() => scrollByCard(1)}
                className="flex size-12 items-center justify-center rounded-full border border-border text-foreground transition-colors duration-300 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronRight
                  className="size-4"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </button>
            </div>
          </BlurReveal>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1120px] px-6">
        <div
          ref={trackRef}
          onScroll={updateArrows}
          data-lenis-prevent-horizontal
          role="group"
          aria-label="Video testimonials"
          aria-roledescription="carousel"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              scrollByCard(-1);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              scrollByCard(1);
            }
          }}
          onPointerDown={onTrackPointerDown}
          onPointerMove={onTrackPointerMove}
          onPointerUp={onTrackPointerUp}
          onPointerCancel={onTrackPointerUp}
          onClickCapture={(event) => {
            if (suppressClickRef.current || didDragRef.current) {
              event.preventDefault();
              event.stopPropagation();
              suppressClickRef.current = false;
              didDragRef.current = false;
            }
          }}
          className={`flex ${dragging ? "" : "snap-x snap-mandatory"} cursor-grab gap-5 overflow-x-auto pb-2 outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing [&::-webkit-scrollbar]:hidden`}
        >
          {videos.map((video, index) => (
            <VideoCard
              key={video.id}
              video={video}
              index={index}
              onPlay={() => setActiveVideo(video)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeVideo ? (
          <VideoModal
            video={activeVideo}
            onClose={() => setActiveVideo(null)}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}
