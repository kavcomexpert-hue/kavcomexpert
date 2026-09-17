"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

import { classifyImageSrc } from "@/lib/site/image-src";

function isRenderableSrc(src: ImageProps["src"] | null | undefined): boolean {
  if (src == null) return false;
  if (typeof src === "string") {
    const trimmed = src.trim();
    if (!trimmed) return false;
    if (trimmed === "null" || trimmed === "undefined") return false;
    // Seed / demo paths that were never shipped under public/
    if (trimmed.startsWith("/og/") || trimmed.startsWith("/images/blog")) {
      return false;
    }
    // next/image throws for remote hosts outside remotePatterns; malformed
    // srcs (no leading slash, bad protocol) are unrenderable either way.
    return classifyImageSrc(trimmed) !== "invalid";
  }
  return true;
}

function needsUnoptimized(src: ImageProps["src"]): boolean {
  return typeof src === "string" && classifyImageSrc(src) === "unoptimized";
}

/**
 * next/image wrapper that never paints broken frames and never logs
 * uncaught errors when the src is missing or fails to load.
 * Defaults to lazy loading unless `priority` is set (LCP/hero only).
 */
export function SafeImage({
  src,
  alt,
  onError,
  loading,
  priority,
  ...props
}: ImageProps) {
  // Track WHICH src failed so switching to a new src (e.g. slide change in a
  // reused modal) renders again instead of staying blank forever.
  const [failedSrc, setFailedSrc] = useState<ImageProps["src"] | null>(null);

  if (!isRenderableSrc(src) || failedSrc === src) {
    return null;
  }

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      priority={priority}
      loading={priority ? undefined : (loading ?? "lazy")}
      unoptimized={props.unoptimized ?? needsUnoptimized(src)}
      onError={(event) => {
        setFailedSrc(src);
        onError?.(event);
      }}
    />
  );
}

export function isValidImageSrc(src: string | null | undefined): boolean {
  return isRenderableSrc(src);
}
