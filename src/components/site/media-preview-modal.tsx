"use client";

import { SafeImage } from "@/components/site/safe-image";

import { ChevronLeft, ChevronRight, X } from "lucide-react";

import {
  lockPageScroll,
  unlockPageScroll,
} from "@/components/site/lenis-provider";
import { motionEase } from "@/components/site/motion/reveal";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  isEmbeddableVideoUrl,
  toEmbedUrl,
} from "@/lib/site/video-embed";
import type { GalleryItem } from "@/lib/site/content-parsers";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

function CloseIcon() {
  return <X className="size-5" strokeWidth={1.5} aria-hidden="true" />;
}

type MediaPreviewModalProps = {
  items: GalleryItem[];
  initialIndex: number;
  onClose: () => void;
  title?: string;
};

export function MediaPreviewModal({
  items,
  initialIndex,
  onClose,
  title = "Preview",
}: MediaPreviewModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(initialIndex);
  const item = items[index];

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    closeRef.current?.focus();
    lockPageScroll();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowLeft" && items.length > 1) {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight" && items.length > 1) {
        event.preventDefault();
        goNext();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      unlockPageScroll();
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, goPrev, goNext, items.length]);

  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`${title} ${index + 1} of ${items.length}`}
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
          className="relative w-full max-w-5xl"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.35, ease: motionEase }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-surface dark:text-foreground">
              {title}
              {items.length > 1 ? (
                <span className="text-surface/60 dark:text-muted">
                  {" "}
                  · {index + 1} / {items.length}
                </span>
              ) : null}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="flex size-10 items-center justify-center rounded-full border border-surface/30 bg-surface/10 text-surface backdrop-blur transition-colors hover:bg-surface/25 dark:border-border dark:bg-surface dark:text-foreground dark:hover:border-accent"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="relative overflow-hidden rounded-default border border-surface/20 bg-background shadow-soft dark:border-border">
            {items.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous item"
                  className="absolute left-3 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:border-accent md:left-4"
                ><ChevronLeft className="size-4" strokeWidth={1.5} aria-hidden="true" /></button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next item"
                  className="absolute right-3 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:border-accent md:right-4"
                ><ChevronRight className="size-4" strokeWidth={1.5} aria-hidden="true" /></button>
              </>
            ) : null}

            <div className="flex min-h-[240px] items-center justify-center p-4 md:p-8">
              {item.kind === "image" ? (
                <SafeImage
                  src={item.url}
                  alt={item.alt || `${title} ${index + 1}`}
                  width={1400}
                  height={900}
                  className="max-h-[75vh] w-auto rounded-default object-contain"
                  sizes="96vw"
                  priority
                />
              ) : isEmbeddableVideoUrl(item.url) ? (
                <div className="aspect-video w-full max-w-4xl overflow-hidden rounded-default">
                  <iframe
                    title={item.alt || `${title} video`}
                    src={toEmbedUrl(item.url, { autoplay: true })}
                    className="size-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  />
                </div>
              ) : (
                <video
                  src={item.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[75vh] w-full max-w-4xl rounded-default object-contain"
                />
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
