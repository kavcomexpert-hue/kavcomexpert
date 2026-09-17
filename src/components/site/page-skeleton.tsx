type PageSkeletonProps = {
  cardCount?: number;
  cardLayout?: "grid" | "list";
  showBreadcrumbs?: boolean;
};

export function PageSkeleton({
  cardCount = 6,
  cardLayout = "grid",
  showBreadcrumbs = true,
}: PageSkeletonProps) {
  return (
    <>
      {showBreadcrumbs ? (
        <div className="mx-auto max-w-[1120px] px-6 pt-16 md:pt-24">
          <div className="mb-8 h-4 w-48 animate-pulse rounded bg-border" />
        </div>
      ) : null}

      <div className="mx-auto max-w-[1120px] px-6 py-16 md:py-24">
        <div className="mb-12 max-w-2xl space-y-4 md:mb-16">
          <div className="h-3 w-24 animate-pulse rounded bg-border" />
          <div className="h-10 max-w-xl animate-pulse rounded bg-border" />
          <div className="h-5 max-w-2xl animate-pulse rounded bg-border" />
        </div>

        {cardLayout === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: cardCount }).map((_, index) => (
              <div
                key={index}
                className="h-52 animate-pulse rounded-default border border-border bg-surface"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from({ length: cardCount }).map((_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-default border border-border bg-surface"
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
