"use client";

import Image from "next/image";
import { useState } from "react";

type AdminMediaImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
};

/**
 * Admin thumbnails via next/image with fallback to a plain <img> when the
 * optimizer rejects the host or the remote object 404s — never leave a blank tile.
 */
export function AdminMediaImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
}: AdminMediaImageProps) {
  const [mode, setMode] = useState<"optimized" | "raw" | "failed">("optimized");

  if (!src.trim() || mode === "failed") {
    return (
      <div className="flex size-full items-center justify-center bg-background px-2 text-center font-mono text-[0.65rem] text-muted">
        Preview unavailable
      </div>
    );
  }

  if (mode === "raw") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- fallback when next/image cannot load remote R2 hosts
      <img
        src={src}
        alt={alt}
        className={
          fill
            ? `absolute inset-0 size-full object-cover ${className ?? ""}`
            : className
        }
        onError={() => setMode("failed")}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      {...(fill
        ? { fill: true }
        : { width: width ?? 400, height: height ?? 300 })}
      className={className}
      sizes={sizes}
      unoptimized
      onError={() => setMode("raw")}
    />
  );
}
