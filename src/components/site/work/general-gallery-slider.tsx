"use client";

import { SafeImage } from "@/components/site/safe-image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import { GalleryLightbox } from "@/components/site/gallery-lightbox";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useOffscreenPause } from "@/hooks/use-offscreen-pause";
import type { WorkGalleryItem } from "@/lib/queries/work-gallery";
import type { GalleryItem } from "@/lib/site/content-parsers";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";

const GAP_PX = 16;
const AUTO_MS = 5500;

function useVisibleCount() {
  const [visible, setVisible] = useState(1);

  useEffect(() => {
    function sync() {
      const width = window.innerWidth;
      if (width >= 1280) setVisible(5);
      else if (width >= 1024) setVisible(4);
      else if (width >= 768) setVisible(3);
      else if (width >= 640) setVisible(2);
      else setVisible(1);
    }

    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return visible;
}

export function GeneralGallerySlider({
  items,
  eyebrow = "Graphic gallery",
  headline = "Visuals from the workbench",
  subtext = "A rotating look at brand, UI, and campaign graphics we ship alongside the builds above. Click any frame to open the full lightbox.",
}: {
  items: WorkGalleryItem[];
  eyebrow?: string;
  headline?: string;
  subtext?: string;
}) {
  const reducedMotion = useReducedMotion();
  const visible = useVisibleCount();
  const shellRef = useRef<HTMLDivElement>(null);
  const offscreenPaused = useOffscreenPause(shellRef);
  const [index, setIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    origin: number;
  }>({ active: false, startX: 0, origin: 0 });
  // Suppresses the click that fires right after a swipe gesture, so dragging
  // the carousel never accidentally opens the lightbox.
  const didDragRef = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);

  const galleryItems = useMemo<GalleryItem[]>(
    () =>
      items.map((item) => ({
        url: item.url,
        alt: item.alt,
        kind: "image" as const,
      })),
    [items],
  );

  const maxIndex = Math.max(0, items.length - visible);
  const canNavigate = items.length > visible;

  const measure = useCallback(() => {
    const shell = shellRef.current;
    if (!shell || shell.clientWidth === 0) return;
    setCardWidth(
      (shell.clientWidth - GAP_PX * (visible - 1)) / Math.max(visible, 1),
    );
  }, [visible]);

  useLayoutEffect(() => {
    measure();
    const shell = shellRef.current;
    if (!shell) return;
    const observer = new ResizeObserver(measure);
    observer.observe(shell);
    return () => observer.disconnect();
  }, [measure]);

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
    if (
      offscreenPaused ||
      paused ||
      reducedMotion ||
      !canNavigate ||
      lightboxIndex !== null
    ) {
      return;
    }

    const id = window.setInterval(goNext, AUTO_MS);
    return () => window.clearInterval(id);
  }, [offscreenPaused, paused, reducedMotion, canNavigate, lightboxIndex, goNext]);

  const suppressClickRef = useRef(false);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!canNavigate) return;
    didDragRef.current = false;
    suppressClickRef.current = false;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      origin: activeIndex * (cardWidth + GAP_PX),
    };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
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

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const delta = event.clientX - dragRef.current.startX;
    setDragOffset(0);
    if (didDragRef.current && Math.abs(delta) > 48) {
      if (delta < 0) goNext();
      else goPrev();
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

  const baseOffset = cardWidth > 0 ? activeIndex * (cardWidth + GAP_PX) : 0;
  const widthStyle =
    cardWidth > 0
      ? cardWidth
      : `calc((100% - ${(visible - 1) * GAP_PX}px) / ${visible})`;

  return (
    <section className="relative mx-auto max-w-[1120px] px-6 pb-24 md:pb-32">
      <BlurReveal>
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-accent">{eyebrow}</p>
            <h2 className="mt-3 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">
              {headline}
            </h2>
            {subtext ? (
              <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
                {subtext}
              </p>
            ) : null}
          </div>
          {canNavigate ? (
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Previous gallery items"
                onClick={goPrev}
                className="flex size-11 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                <ChevronLeft
                  className="size-4"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                aria-label="Next gallery items"
                onClick={goNext}
                className="flex size-11 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                <ChevronRight
                  className="size-4"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </button>
            </div>
          ) : null}
        </div>

        {items.length === 0 ? (
          <p className="rounded-default border border-border bg-surface p-8 text-center text-sm text-muted">
            No graphic gallery images yet. Add them in Admin → Work Gallery.
          </p>
        ) : (
          <div
            ref={shellRef}
            data-lenis-prevent-horizontal
            role="group"
            aria-label={headline}
            aria-roledescription="carousel"
            tabIndex={canNavigate ? 0 : undefined}
            onKeyDown={(event) => {
              if (!canNavigate) return;
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                goPrev();
              } else if (event.key === "ArrowRight") {
                event.preventDefault();
                goNext();
              }
            }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClickCapture={(event) => {
              if (suppressClickRef.current || didDragRef.current) {
                event.preventDefault();
                event.stopPropagation();
                suppressClickRef.current = false;
                didDragRef.current = false;
              }
            }}
            className={`overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-accent ${canNavigate ? "cursor-grab active:cursor-grabbing" : ""}`}
          >
            <div
              className="flex touch-pan-y"
              style={{
                gap: GAP_PX,
                transform: `translate3d(${-(baseOffset - dragOffset)}px, 0, 0)`,
                transition:
                  dragOffset !== 0 || reducedMotion
                    ? undefined
                    : "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {items.map((item, i) => (
                <div
                  key={item.id}
                  className="shrink-0"
                  style={{ width: widthStyle }}
                >
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    aria-label={`View ${item.alt.trim() || "gallery image"} in full screen`}
                    className="group relative block aspect-[4/3] w-full overflow-hidden rounded-default border border-border bg-background text-left transition-colors hover:border-accent"
                  >
                    <SafeImage
                      src={item.url}
                      alt={item.alt.trim() || "Gallery image"}
                      fill
                      sizes="(max-width: 640px) 50vw, 20vw"
                      className="object-contain p-2 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]"
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </BlurReveal>

      {lightboxIndex !== null && galleryItems.length > 0 ? (
        <GalleryLightbox
          items={galleryItems}
          initialIndex={lightboxIndex}
          clientName={headline}
          onClose={() => setLightboxIndex(null)}
        />
      ) : null}
    </section>
  );
}
