"use client";

import { testimonialVideos } from "@/components/site/testimonial-videos";
import {
  YOUTUBE_IFRAME_ALLOW,
  youtubeEmbedSrc,
  youtubePosterUrl,
} from "@/lib/site/video-embed";
import { useState } from "react";
import Image from "next/image";

const tiffany =
  testimonialVideos.find((v) => v.id === "Phillips-Business-Group") ??
  testimonialVideos[0];

export function TiffanyVideo() {
  const [playing, setPlaying] = useState(false);

  if (!tiffany?.youtubeId) return null;

  const poster = youtubePosterUrl(tiffany.youtubeId);

  return (
    <section
      aria-labelledby="tiffany-heading"
      className="border-y border-border bg-surface"
    >
      <div className="mx-auto grid max-w-[1120px] gap-10 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            Client story
          </p>
          <h2
            id="tiffany-heading"
            className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
          >
            Hear Tiffany Phillips on working with Kavcom Expert.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Tiffany Phillips of Phillips Business Group shares how the engagement
            felt from the client side. Watch before you book the fit call.
          </p>
          <p className="mt-4 font-mono text-xs text-muted">
            {tiffany.name} · {tiffany.company}
          </p>
        </div>

        <div className="relative aspect-video overflow-hidden rounded-default border border-border bg-background shadow-soft dark:shadow-glow">
          {playing ? (
            <iframe
              title={`Video testimonial from ${tiffany.name}`}
              src={youtubeEmbedSrc(tiffany.youtubeId, { autoplay: true })}
              allow={YOUTUBE_IFRAME_ALLOW}
              allowFullScreen
              className="absolute inset-0 size-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 size-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
              aria-label={`Play video testimonial from ${tiffany.name}`}
            >
              <Image
                src={poster}
                alt={`Video testimonial from ${tiffany.name}, ${tiffany.company}`}
                fill
                sizes="(max-width: 768px) 100vw, 560px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <span className="absolute inset-0 bg-foreground/25" />
              <span className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-surface shadow-soft">
                <svg viewBox="0 0 24 24" className="ml-0.5 size-5" aria-hidden="true">
                  <path d="M8 6l10 6-10 6V6z" fill="currentColor" />
                </svg>
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
