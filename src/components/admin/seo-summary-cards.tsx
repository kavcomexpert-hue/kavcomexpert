type SeoSummaryCardsProps = {
  totalIndexed: number;
  failing: number;
  stale: number;
  missingFaqs: number;
};

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "danger" | "warn" | "accent";
}) {
  const toneClass =
    tone === "danger"
      ? "text-danger"
      : tone === "warn"
        ? "text-accent"
        : tone === "accent"
          ? "text-accent"
          : "text-foreground";

  return (
    <article className="rounded-default border border-border bg-surface p-5 shadow-soft dark:shadow-glow">
      <p className="font-mono text-xs uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className={`mt-2 font-display text-3xl font-semibold tracking-tight ${toneClass}`}>
        {value}
      </p>
    </article>
  );
}

export function SeoSummaryCards({
  totalIndexed,
  failing,
  stale,
  missingFaqs,
}: SeoSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="Indexed pages" value={totalIndexed} />
      <SummaryCard
        label="Items failing"
        value={failing}
        tone={failing > 0 ? "danger" : "default"}
      />
      <SummaryCard
        label="Items stale"
        value={stale}
        tone={stale > 0 ? "warn" : "default"}
      />
      <SummaryCard
        label="Missing FAQs"
        value={missingFaqs}
        tone={missingFaqs > 0 ? "accent" : "default"}
      />
    </div>
  );
}
