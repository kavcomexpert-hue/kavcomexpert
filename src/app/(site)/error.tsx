"use client";

import Link from "next/link";
import { useEffect } from "react";

type SiteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SiteError({ error, reset }: SiteErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-wider text-muted">
        Something went wrong
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground">
        We hit a snag
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        The page could not load right now. Try again, or head back to the homepage.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-surface transition-opacity hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-default border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-surface"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
