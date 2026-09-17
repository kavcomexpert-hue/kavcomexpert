"use client";

import { useRef } from "react";
import { useOffscreenPause } from "@/hooks/use-offscreen-pause";

const tickerItems = [
  "WordPress",
  "Shopify",
  "Magento",
  "WooCommerce",
  "SEO & AI SEO",
  "Google Ads",
  "Social Media",
  "Video Editing",
  "UI/UX",
  "Virtual Assistant",
  "Digital Marketing",
  "iOS & Android",
] as const;

function TickerHalf({
  items,
  hidden,
}: {
  items: readonly string[];
  hidden?: boolean;
}) {
  return (
    <div
      className={`flex w-max items-center ${hidden ? "marquee-dup-half" : ""}`.trim()}
      aria-hidden={hidden || undefined}
    >
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className="flex shrink-0 items-center gap-8 pr-8 text-base font-medium tracking-[-0.01em] text-muted md:text-lg"
        >
          {item}
          <span className="size-1.5 rounded-full bg-accent-lime" />
        </span>
      ))}
    </div>
  );
}

export function ServiceTicker({
  items = tickerItems,
}: {
  items?: readonly string[];
}) {
  const maskRef = useRef<HTMLDivElement | null>(null);
  const pausedOffscreen = useOffscreenPause(maskRef);

  return (
    <div className="border-y border-border bg-background" aria-hidden="true">
      <div
        ref={maskRef}
        className="logo-marquee-mask marquee-pause-hover overflow-hidden py-6"
      >
        <div
          className="animate-marquee flex w-max items-center"
          style={pausedOffscreen ? { animationPlayState: "paused" } : undefined}
        >
          <TickerHalf items={items} />
          <TickerHalf items={items} hidden />
        </div>
      </div>
    </div>
  );
}
