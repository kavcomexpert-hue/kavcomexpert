"use client";

export function TypingIndicator() {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-2"
      aria-hidden="true"
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:300ms]" />
    </div>
  );
}
