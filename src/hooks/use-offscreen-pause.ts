"use client";

import { useEffect, useState } from "react";

export function useOffscreenPause<T extends HTMLElement>(ref: {
  current: T | null;
}) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setPaused(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return paused;
}

