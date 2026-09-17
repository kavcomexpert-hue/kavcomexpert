type SectionHeaderProps = {
  eyebrow: string;
  headline: string;
  accentWordCount?: number;
  subtext?: string;
  className?: string;
  as?: "h2" | "h3";
};

export function SectionHeader({
  eyebrow,
  headline,
  accentWordCount = 2,
  subtext,
  className = "",
  as: Tag = "h2",
}: SectionHeaderProps) {
  const words = headline.trim().split(/\s+/);
  const splitAt = Math.max(1, words.length - accentWordCount);
  const lead = words.slice(0, splitAt).join(" ");
  const accent = words.slice(splitAt).join(" ");

  return (
    <header className={`max-w-2xl space-y-4 ${className}`.trim()}>
      <p className="font-mono text-xs uppercase tracking-wider text-muted">
        {eyebrow}
      </p>
      <Tag className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
        {lead}{" "}
        {accent ? <span className="text-accent">{accent}</span> : null}
      </Tag>
      {subtext ? (
        <p className="max-w-xl text-base leading-relaxed text-muted md:text-lg">
          {subtext}
        </p>
      ) : null}
    </header>
  );
}
