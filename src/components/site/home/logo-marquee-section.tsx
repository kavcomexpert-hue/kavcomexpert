"use client";

import Image from "next/image";
import { clientLogos, type ClientLogo } from "@/components/site/logos";
import { useOffscreenPause } from "@/hooks/use-offscreen-pause";
import { useRef } from "react";

function LogoItem({ name, src }: { name: string; src: string }) {
  return (
    <div className="flex shrink-0 items-center px-3 sm:px-4">
      <div className="flex h-10 items-center justify-center rounded-default bg-logo-surface px-3.5 py-1.5 sm:h-11 sm:px-4">
        <Image
          src={src}
          alt={name}
          width={140}
          height={36}
          loading="lazy"
          fetchPriority="low"
          className="pointer-events-none h-7 w-auto max-w-[120px] object-contain select-none sm:h-8 sm:max-w-[140px]"
          draggable={false}
        />
      </div>
    </div>
  );
}

function MarqueeTrack({ logos }: { logos: ClientLogo[] }) {
  const track = [...logos, ...logos];
  const trackRef = useRef<HTMLDivElement | null>(null);
  const offscreenPaused = useOffscreenPause(trackRef);

  return (
    <div
      ref={trackRef}
      className="logo-marquee-track logo-marquee-mask overflow-hidden"
    >
      <div
        className="animate-logo-marquee flex w-max items-center gap-0"
        style={
          offscreenPaused ? { animationPlayState: "paused" } : undefined
        }
      >
        {track.map((logo, index) => (
          <LogoItem key={`${logo.src}-${index}`} name={logo.name} src={logo.src} />
        ))}
      </div>
    </div>
  );
}

function StaticGrid({ logos }: { logos: ClientLogo[] }) {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-3 py-1 sm:gap-4">
      {logos.map((logo) => (
        <li key={logo.src}>
          <LogoItem name={logo.name} src={logo.src} />
        </li>
      ))}
    </ul>
  );
}

export function LogoMarqueeSection({
  logos = clientLogos,
}: {
  logos?: ClientLogo[];
} = {}) {
  const list = logos.length > 0 ? logos : clientLogos;

  return (
    <section aria-label="Client logos" className="border-y border-border bg-surface py-4 md:py-5">
      <div className="marquee-static px-6">
        <StaticGrid logos={list} />
      </div>
      <div className="marquee-motion">
        <MarqueeTrack logos={list} />
      </div>
    </section>
  );
}
