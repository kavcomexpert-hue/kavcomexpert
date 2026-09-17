"use client";

import { CountUp } from "@/components/site/motion/count-up";

/**
 * Metric display entry point. Renders the final number on SSR / first paint,
 * then CountUp animates when the value scrolls into view.
 */
export function CountUpLoader({
  metric,
  className,
}: {
  metric: string;
  className?: string;
}) {
  return <CountUp metric={metric} className={className} />;
}
