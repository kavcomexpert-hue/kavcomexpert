"use client";

import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";

import {
  lockPageScroll,
  unlockPageScroll,
} from "@/components/site/lenis-provider";
import { motionEase } from "@/components/site/motion/reveal";
import { SafeImage } from "@/components/site/safe-image";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { extractYoutubeId } from "@/lib/site/map-video-testimonial";
import type { ServiceWorkItem } from "@/lib/site/service-pages/types";
import {
  YOUTUBE_IFRAME_ALLOW,
  youtubeEmbedSrc,
} from "@/lib/site/video-embed";
import { AnimatePresence, motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

const CARD_CYCLE_MS = 4200;

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="ml-0.5 size-4" aria-hidden="true">
      <path d="M8 6l10 6-10 6V6z" fill="currentColor" />
    </svg>
  );
}

function workImages(item: ServiceWorkItem): string[] {
  return (item.images ?? []).map((url) => url.trim()).filter(Boolean);
}

function parseWorkVideo(item: ServiceWorkItem) {
  const url = item.videoUrl?.trim();
  if (!url) return null;

  const youtubeId = extractYoutubeId(url);
  if (youtubeId) {
    return { youtubeId };
  }

  return { videoSrc: url };
}

function WorkPreviewModal({
  item,
  onClose,
}: {
  item: ServiceWorkItem;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const video = parseWorkVideo(item);
  const images = workImages(item);
  const isVideo = Boolean(video);
  const [imageIndex, setImageIndex] = useState(0);
  const activeImage = images[Math.min(imageIndex, Math.max(0, images.length - 1))];

  useEffect(() => {
    closeRef.current?.focus();
    lockPageScroll();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (isVideo || images.length <= 1) return;
      if (event.key === "ArrowRight") {
        setImageIndex((current) => (current + 1) % images.length);
      } else if (event.key === "ArrowLeft") {
        setImageIndex(
          (current) => (current - 1 + images.length) % images.length,
        );
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      unlockPageScroll();
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, isVideo, images.length]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${item.clientName}`}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <button
        type="button"
        aria-label="Close preview"
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
            {item.clientName}
            <span className="text-surface/60 dark:text-muted">
              {" "}
              · {item.industry}
            </span>
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="flex size-10 items-center justify-center rounded-full border border-surface/30 bg-surface/10 text-surface backdrop-blur transition-colors hover:bg-surface/25 dark:border-border dark:bg-surface dark:text-foreground dark:hover:border-accent"
          >
            <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-hidden rounded-default border border-surface/20 bg-background shadow-soft dark:border-border">
          <div className="relative aspect-video">
            {isVideo && video?.videoSrc ? (
              <video
                src={video.videoSrc}
                controls
                autoPlay
                playsInline
                className="absolute inset-0 size-full object-contain bg-foreground dark:bg-surface"
              />
            ) : isVideo && video?.youtubeId ? (
              <iframe
                title={`${item.clientName} project video`}
                src={youtubeEmbedSrc(video.youtubeId, { autoplay: true })}
                className="absolute inset-0 size-full border-0"
                allow={YOUTUBE_IFRAME_ALLOW}
              />
            ) : activeImage ? (
              <>
                <SafeImage
                  key={activeImage}
                  src={activeImage}
                  alt={`${item.clientName} project preview`}
                  fill
                  sizes="(max-width: 896px) 100vw, 896px"
                  className="object-contain bg-foreground dark:bg-surface"
                  unoptimized={activeImage.startsWith("http")}
                />
                {images.length > 1 ? (
                  <>
                    <button
                      type="button"
                      aria-label="Previous image"
                      onClick={() =>
                        setImageIndex(
                          (current) =>
                            (current - 1 + images.length) % images.length,
                        )
                      }
                      className="absolute left-3 top-1/2 z-[1] flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/90 text-foreground"
                    >
                      <ChevronLeft className="size-4" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      aria-label="Next image"
                      onClick={() =>
                        setImageIndex((current) => (current + 1) % images.length)
                      }
                      className="absolute right-3 top-1/2 z-[1] flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/90 text-foreground"
                    >
                      <ChevronRight className="size-4" strokeWidth={1.5} />
                    </button>
                    <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-border bg-surface/90 px-3 py-1 text-xs text-muted">
                      {imageIndex + 1} / {images.length}
                    </p>
                  </>
                ) : null}
              </>
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
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
            <p className="text-sm text-muted">{item.website}</p>
            {item.websiteUrl ? (
              <a
                href={item.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-opacity hover:opacity-80"
              >
                Visit site
                <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function WorkCard({
  item,
  onPreview,
}: {
  item: ServiceWorkItem;
  onPreview: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const images = workImages(item);
  const hasVideo = Boolean(item.videoUrl?.trim());
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reducedMotion || paused || images.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, CARD_CYCLE_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion, paused, images.length]);

  const shown = reducedMotion ? images.slice(0, 1) : images;

  return (
    <button
      type="button"
      onClick={onPreview}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-label={`Preview ${item.clientName} project`}
      className="group block w-full overflow-hidden rounded-default border border-border text-left transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-soft dark:hover:shadow-glow"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-foreground dark:bg-surface">
        {shown.length > 0 ? (
          shown.map((src, index) => (
            <SafeImage
              key={`${src}-${index}`}
              src={src}
              alt={`${item.clientName} project preview`}
              fill
              sizes="(max-width: 1024px) 85vw, 360px"
              className={`object-cover transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 ${
                index === activeIndex || reducedMotion
                  ? "opacity-100"
                  : "opacity-0"
              }`}
              unoptimized={src.startsWith("http")}
            />
          ))
        ) : (
          <>
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, var(--accent) 0%, transparent 45%), radial-gradient(circle at 80% 80%, var(--accent-lime) 0%, transparent 40%)",
                opacity: 0.35,
              }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle, var(--muted) 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }}
            />
          </>
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-foreground/10 to-transparent dark:from-background/65 dark:via-background/10"
        />
        <span className="absolute bottom-4 left-4 rounded-full border border-border bg-surface/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
          {item.industry}
        </span>
        {hasVideo ? (
          <span className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-border bg-accent text-surface backdrop-blur-sm transition-[opacity,transform] duration-300 group-hover:scale-110">
            <PlayIcon />
          </span>
        ) : (
          <span
            aria-hidden="true"
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-border bg-surface/90 text-sm text-foreground opacity-0 backdrop-blur-sm transition-[opacity,transform] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
          >
            <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="border-t border-border bg-background p-5">
        <p className="text-base font-semibold tracking-[-0.01em] text-foreground">
          {item.clientName}
        </p>
        <p className="mt-1 text-sm text-muted">{item.website}</p>
      </div>
    </button>
  );
}

export function ServiceWorkSlider({
  eyebrow = "Our work",
  headline,
  items,
}: {
  eyebrow?: string;
  headline: string;
  items: readonly ServiceWorkItem[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [preview, setPreview] = useState<ServiceWorkItem | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, items.length]);

  function scrollByCard(direction: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-work-card]");
    const amount = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({
      left: direction * amount,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  // Mouse drag-to-scroll; touch swiping already works via native overflow.
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0 });
  const didDragRef = useRef(false);
  const suppressClickRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  function onTrackPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const el = trackRef.current;
    if (!el) return;
    didDragRef.current = false;
    suppressClickRef.current = false;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startScroll: el.scrollLeft,
    };
  }

  function onTrackPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) return;
    const el = trackRef.current;
    if (!el) return;
    const delta = event.clientX - dragRef.current.startX;
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
    el.scrollLeft = dragRef.current.startScroll - delta;
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
      const el = trackRef.current;
      if (el) {
        const card = el.querySelector<HTMLElement>("[data-work-card]");
        const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
        el.scrollTo({
          left: Math.round(el.scrollLeft / step) * step,
          behavior: reducedMotion ? "auto" : "smooth",
        });
      }
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
        didDragRef.current = false;
      }, 50);
    }
  }

  return (
    <section className="relative overflow-clip bg-background py-20 md:py-28">
      <div className="mx-auto max-w-[1120px] px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-accent">{eyebrow}</p>
            <h2 className="mt-3 text-balance text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">
              {headline}
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous projects"
              disabled={!canPrev}
              onClick={() => scrollByCard(-1)}
              className="flex size-11 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
            >
              <ChevronLeft className="size-4" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              aria-label="Next projects"
              disabled={!canNext}
              onClick={() => scrollByCard(1)}
              className="flex size-11 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
            >
              <ChevronRight className="size-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          data-lenis-prevent-horizontal
          role="group"
          aria-label={headline}
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
          className={`mt-10 flex ${dragging ? "" : "snap-x snap-mandatory"} cursor-grab gap-4 overflow-x-auto pb-2 outline-none [-ms-overflow-style:none] [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing [&::-webkit-scrollbar]:hidden`}
        >
          {items.map((item) => (
            <div
              key={`${item.clientName}-${item.website}`}
              data-work-card
              className="w-[min(85vw,360px)] shrink-0 snap-start"
            >
              <WorkCard item={item} onPreview={() => setPreview(item)} />
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {preview ? (
          <WorkPreviewModal item={preview} onClose={() => setPreview(null)} />
        ) : null}
      </AnimatePresence>
    </section>
  );
}
