"use client";

import { parseResultMetric } from "@/lib/metrics/parse-metric";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

type CountUpProps = {
  metric: string;
  className?: string;
};

function formatNumeric(value: number, decimals: number): string {
  return decimals ? value.toFixed(decimals) : String(Math.round(value));
}

export function CountUp({ metric, className }: CountUpProps) {
  const parsed = parseResultMetric(metric);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [animating, setAnimating] = useState(false);
  const motionValue = useMotionValue(
    parsed.type === "numeric" ? parsed.value : 0,
  );
  const spring = useSpring(motionValue, {
    stiffness: 70,
    damping: 18,
  });
  const rounded = useTransform(spring, (value) =>
    parsed.type === "numeric"
      ? formatNumeric(value, parsed.decimals)
      : String(Math.round(value)),
  );

  useEffect(() => {
    if (!isInView || parsed.type !== "numeric" || animating) {
      return;
    }

    // Rewind the motion value, then flip to the animated branch on the next
    // frame so the state update is async (no cascading render in the effect).
    motionValue.set(0);
    const frame = requestAnimationFrame(() => {
      setAnimating(true);
      motionValue.set(parsed.value);
    });
    return () => cancelAnimationFrame(frame);
  }, [animating, isInView, motionValue, parsed]);

  if (parsed.type === "text") {
    return (
      <span ref={ref} className={className}>
        {parsed.text}
      </span>
    );
  }

  // SSR + pre-animation: show the final metric immediately (no blank/zero flash).
  if (!animating) {
    return (
      <span ref={ref} className={className}>
        {parsed.prefix}
        {formatNumeric(parsed.value, parsed.decimals)}
        {parsed.suffix}
        {parsed.remainder ? (
          <span className="text-base font-sans font-normal text-muted">
            {" "}
            {parsed.remainder}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span ref={ref} className={className}>
      {parsed.prefix}
      <motion.span>{rounded}</motion.span>
      {parsed.suffix}
      {parsed.remainder ? (
        <span className="text-base font-sans font-normal text-muted">
          {" "}
          {parsed.remainder}
        </span>
      ) : null}
    </span>
  );
}
